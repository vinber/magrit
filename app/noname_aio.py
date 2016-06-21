#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@author: mz
"""
import os
import sys
import ujson as json
import time

import asyncio
import zmq.asyncio
import pandas as pd
import base64

from contextlib import closing
from zipfile import ZipFile
from datetime import datetime
from io import StringIO
from subprocess import Popen, PIPE
from socket import socket, AF_INET, SOCK_STREAM
#from hashlib import sha512
#from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# Web related stuff :
import jinja2
import aiohttp_jinja2
import aioredis
from aiohttp import web, MultiDict
from aiohttp_session import get_session, session_middleware, redis_storage

# Helpers :
from r_py.rclient_load_balance_auto_scale import R_client_fuw_async, url_client
from helpers.misc import savefile, get_key, zip_and_clean, prepare_folder
from helpers.geo import reproj_convert_layer, reproj_layer, check_projection
from helpers.cy_misc import get_name, join_topojson_new_field2
from helpers.cartogram_doug import make_cartogram
from helpers.topo_to_geo import convert_from_topo

from geopandas import GeoDataFrame

pp = '(aiohttp_app) '


@aiohttp_jinja2.template('index.html')
async def handler(request):
    session = await get_session(request)
    if 'last_visit' in session:
        date = 'Last visit : {}'.format(datetime.fromtimestamp(
            session['last_visit']).strftime("%B %d, %Y at %H:%M:%S"))
    else:
        date = ''
    session['last_visit'] = time.time()
    return {'last_visit': date}


async def is_known_user(request, ref):
    session = await get_session(request)
    if 'R_user' in session and session['R_user'] in ref:
        id_ = session['R_user']
        assert id_ in ref
        print(session['R_user'], ' is a kwown user')
    else:
        id_ = get_key(var=ref)
        session['R_user'] = id_
        ref[id_] = [True, None]
        print(session['R_user'], ' is a new user')
    return id_


##########################################################
#### A few functions to open (server side)
#### ... a geo layer uploaded by the user
##########################################################
#### These functions are currently totaly insecure

async def ogr_to_geojson(filepath, to_latlong=True):
    # Todo : Rewrite using asyncio.subprocess methods
    # Todo : rewrite using new gdal/ogr (> 2.0) bindings to avoid "exiting"
    # ... python when using ogr2ogr
    if to_latlong:
        process = Popen(["ogr2ogr", "-f", "GeoJSON",
                         "-preserve_fid",
                         "-t_srs", "EPSG:4326",
                         "/dev/stdout", filepath], stdout=PIPE)
    else:
        process = Popen(["ogr2ogr", "-f", "GeoJSON", "-preserve_fid",
                         "/dev/stdout", filepath], stdout=PIPE)
    stdout, _ = process.communicate()
    return stdout.decode()


async def geojson_to_topojson(filepath, quantization="--no-quantization"):
    # Todo : Rewrite using asyncio.subprocess methods
    # Todo : Use topojson python port if possible to avoid writing a temp. file
    process = Popen(["topojson", "--spherical", quantization,
                     "-p", "--", filepath], stdout=PIPE)
    stdout, _ = process.communicate()
    os.remove(filepath)
    return stdout.decode()

def topojson_to_geojson(data):
    """
    Topojson to geojson back-conversion in python
    (	through cython-written extension)
    """
    return json.dumps(convert_from_topo(data))

#def topojson_to_geojson(data):
#    """
#    Topojson to geojson back-conversion
#    (using "official" TopoJSON cli tool)
#    """
#    # Todo : Rewrite using asyncio.subprocess methods
#    # Todo : Use topojson python port if possible to avoid writing a temp. file
#    layer_name = list(data['objects'].keys())[0]
#    f_path = ''.join(['/tmp/', layer_name, '.topojson'])
#    with open(f_path, 'wb') as f:
#        f.write(json.dumps(data).encode())
#    new_path = f_path.replace('topojson', 'json')
#    process = Popen(["topojson-geojson", f_path, "-o", '/tmp'])
#    process.wait()
#    with open(new_path, 'r') as f:
#        data = f.read()
#    os.remove(f_path)
#    os.remove(new_path)
#    return datathough


async def cache_input_topojson(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    params = request.match_info['params']

    if "sample_data" in params:
        user_id = get_user_id(session_redis)
        name = posted_data.get('layer_name')
        quantization = posted_data.get('quantization')
        path = app_glob['db_layers'][name]
        f_name = '_'.join([user_id, name, quantization])
        result = await app_glob['redis_conn'].get(f_name)
        if not result:
            res = await ogr_to_geojson(path, to_latlong=True)
            print("Transform coordinates from GeoJSON")
            f_path = '/tmp/' + f_name
            with open(f_path, 'w', encoding='utf-8') as f:
                f.write(res)
            result = await geojson_to_topojson(f_path, quantization)
            result = result.replace(f_name, name)
            asyncio.ensure_future(app_glob['redis_conn'].set(f_name, result))
            print('Caching the TopoJSON')
            return web.Response(text=result)
        else:
            print("The TopoJSON was already cached !")
            return web.Response(text=result.decode())

    elif "user" in params:
        try:
            file_field = posted_data['file[]']
            name = file_field.filename
            data = file_field.file.read()
            # Todo : compute the hash on client side to avoid re-sending the data ?
#            hashed_input = sha512(data).hexdigest()
        except Exception as err:
            print("posted data :\n", posted_data)
            print("err\n", err)
            return web.Response(text=json.dumps({'Error': 'Incorrect datatype'}))

        user_id = get_user_id(session_redis)
        f_name = '_'.join([user_id, name.split('.')[0]])

        result = await app_glob['redis_conn'].get(f_name)
        if result:
            print("The TopoJSON was already cached !")
            return web.Response(text='')

        await app_glob['redis_conn'].set(f_name, data.decode())
        print('Caching the TopoJSON')
        return web.Response(text='')


def get_user_id(session_redis):
    """
    Function to get (or retrieve) the user unique ID
    (ID is used amongst other things to set/get data in/from redis
    and for retrieving the layers decribed in a "preference file" of an user)
    """
    if 'app_user' not in session_redis:
        user_id = get_key(app_glob['app_users'])
        app_glob['app_users'].add(user_id)
        session_redis['app_user'] = user_id
        return user_id
    else:
        user_id = session_redis['app_user']
        if user_id not in app_glob['app_users']:
            app_glob['app_users'].add(user_id)
        return user_id

async def ajson_loads(str_data):
    """
    Just a wrapper around json.loads to make it an awaitable coroutine.
    Not sure yet if their is a real benefit to "gather" simultaneously multiple
    loaded JSON this way.
    Args:
        - str_data, str: the raw JSON, decoded as String
    Return:
        - parsed_json, dict : the JSON file loaded in a python dictionnary
    """
    return json.loads(str_data)

async def user_pref(request):
    last_pref = await request.post()
    session_redis = await get_session(request)
    user_id = get_user_id(session_redis)
    key = '_'.join([user_id, "lastPref"])
    await app_glob['redis_conn'].set(key, json.dumps(last_pref['config']))
    return web.Response(text=json.dumps(
        {'Info': "Preferences saved!"}))


async def convert(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])

    # If a shapefile is provided as multiple files
    # (.shp, .dbf, .shx, and .prj are expected), not ziped :
    if "action" in posted_data and not "file[]" in posted_data:
        list_files = []
        for i in range(len(posted_data) - 2):
            field = posted_data.getall('file[{}]'.format(i))[0]
            file_name = ''.join(['/tmp/', field[1]])
            list_files.append(file_name)
            savefile(file_name, field[2].read())
        shp_path = [i for i in list_files if 'shp' in i][0]
#        hashed_input = hash_md5_file(shp_path)
        name = shp_path.split(os.path.sep)[2]
        datatype = "shp"
    # If there is a single file (geojson or zip) to handle :
    elif "action" in posted_data and "file[]" in posted_data:
        try:
            field = posted_data.get('file[]')
            name = field[1]
            data = field[2].read()
            datatype = field[3]
#            hashed_input = sha512(data).hexdigest()
            filepath = ''.join(['/tmp/', name])
#            tmp_part = get_name()
#            filepath = ''.join(['/tmp/', tmp_part, name])
        except Exception as err:
            print("posted data :\n", posted_data)
            print("err\n", err)
            return web.Response(text=json.dumps({'Error': 'Incorrect datatype'}))

    user_id = get_user_id(session_redis)
    quantize = posted_data.get('quantization')
    f_name = '_'.join([user_id, name.split('.')[0], quantize])

    result = await app_glob['redis_conn'].get(f_name)
    if result:
        print("Used cached result")
        return web.Response(text=result.decode())

    if "shp" in datatype:
        res = await ogr_to_geojson(shp_path, to_latlong=True)
        filepath2 = '/tmp/' + name.replace('.shp', '.geojson')
        with open(filepath2, 'w') as f:
            f.write(res)
        result = await geojson_to_topojson(filepath2, quantize)
        asyncio.ensure_future(app_glob['redis_conn'].set(f_name, result))
        [os.remove(file) for file in list_files]

    elif 'zip' in datatype:
        with open(filepath+'archive', 'wb') as f:
            f.write(data)
        with ZipFile(filepath+'archive') as myzip:
            list_files = myzip.namelist()
            list_files = ['/tmp/' + i for i in list_files]
            shp_path = [i for i in list_files if 'shp' in i][0]
            layer_name = shp_path.split(os.path.sep)[2]
            myzip.extractall(path='/tmp')
            res = await ogr_to_geojson(shp_path, to_latlong=True)
            filepath2 = '/tmp/' + layer_name.replace('.shp', '.geojson')
            with open(filepath2, 'w') as f:
                f.write(res)
            result = await geojson_to_topojson(filepath2, quantize)
            asyncio.ensure_future(app_glob['redis_conn'].set(f_name, result))
        os.remove(filepath+'archive')
        [os.remove(file) for file in list_files]

    elif 'octet-stream' in datatype:
        data = data.decode()
        if '"crs"' in data and '"urn:ogc:def:crs:OGC:1.3:CRS84"' not in data:
            crs = True
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(data)
            res = await ogr_to_geojson(filepath, to_latlong=True)
            print("Transform coordinates from GeoJSON")
            os.remove(filepath)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(res)
        else:
            crs = False
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(data)

        result = await geojson_to_topojson(filepath, quantize)
        if len(result) == 0 and not crs:
            result = json.dumps({'Error': 'GeoJSON layer provided without CRS'})
        else:
            asyncio.ensure_future(app_glob['redis_conn'].set(f_name, result))

    elif 'kml' in datatype:
        print(datatype)
        with open(filepath, 'wb') as f:
            f.write(data)
        res = await ogr_to_geojson(filepath, to_latlong=True)
        os.remove(filepath)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(res)
        result = await geojson_to_topojson(filepath, quantize)
        if len(result) == 0:
            result = json.dumps({'Error': 'Error converting reading kml file'})
        else:
            asyncio.ensure_future(app_glob['redis_conn'].set(f_name, result))

    else:
        result = json.dumps({'Error': 'Incorrect datatype'})

    return web.Response(text=result)


@aiohttp_jinja2.template('modules/test_interface.html')
async def handle_app_functionality(request):
    session_redis = await get_session(request)
    user_id = get_user_id(session_redis)
    lastPref = await app_glob['redis_conn'].get('_'.join([user_id, "lastPref"]))
    return {"func": request.match_info['function'],
            "lastPref": lastPref, "user_id": user_id}


async def nothing(posted_data, session_redis, user_id):
    s_t = time.time()
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, posted_data['topojson'], "--no-quantization"])
    ref_layer = await app_glob['redis_conn'].get(f_name)
    ref_layer = json.loads(ref_layer.decode())
    new_field = json.loads(posted_data['var_name'])
    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_topojson_new_field2(ref_layer, new_field, n_field_name)
    tmp_part = get_name()
    tmp_path = ''.join(['/tmp/', tmp_part, '.geojson'])
    savefile(tmp_path, topojson_to_geojson(ref_layer).encode())
    gdf = GeoDataFrame.from_file(tmp_path)
    os.remove(tmp_path)
    result = gdf.to_json()
    savefile(tmp_path, result.encode())
    res = await geojson_to_topojson(tmp_path)
    print('Python - p2 : {:.4f}'.format(time.time()-s_t))
    return res.replace(
        tmp_part, '_'.join(["Nope", n_field_name]))

async def carto_doug(posted_data, session_redis, user_id):
    s_t = time.time()
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, posted_data['topojson'], "--no-quantization"])
    ref_layer = await app_glob['redis_conn'].get(f_name)
#    ref_layer = json.loads(ref_layer.decode())
#    new_field = json.loads(posted_data['var_name'])
#    iterations = json.loads(posted_data['iterations'])
    ref_layer, new_field, iterations = \
        await asyncio.gather(*[ajson_loads(ref_layer.decode()),
                               ajson_loads(posted_data['var_name']),
                               ajson_loads(posted_data['iterations'])])
    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_topojson_new_field2(ref_layer, new_field[n_field_name], n_field_name)
    tmp_part = get_name()
    tmp_path = ''.join(['/tmp/', tmp_part, '.geojson'])
    savefile(tmp_path, topojson_to_geojson(ref_layer).encode())
    gdf = GeoDataFrame.from_file(tmp_path)
    os.remove(tmp_path)
    result = await make_cartogram(gdf, n_field_name, iterations)
    savefile(tmp_path, result.encode())
    res = await geojson_to_topojson(tmp_path)
    new_name =  '_'.join(["Carto_doug", str(iterations), n_field_name])
    res = res.replace(tmp_part, new_name)
    asyncio.ensure_future(
        app_glob['redis_conn'].set('_'.join([user_id, new_name, "--no-quantization"]), res))
    print('Python - p2 : {:.4f}'.format(time.time()-s_t))
    return res

async def links_map(posted_data, session_redis, user_id):
    s_t = time.time()
    posted_data = json.loads(posted_data.get("json"))

    f_name = '_'.join([user_id, posted_data['topojson'], "--no-quantization"])
    ref_layer = await app_glob['redis_conn'].get(f_name)
#    ref_layer = json.loads(ref_layer.decode())
#    new_field = json.loads(posted_data['join_field'])
    ref_layer, new_field = await asyncio.gather(*[
        ajson_loads(ref_layer.decode()), ajson_loads(posted_data['join_field'])])

    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_topojson_new_field2(ref_layer, new_field[n_field_name], n_field_name)

    tmp_part = get_name()
    filenames = {"src_layer": ''.join(['/tmp/', tmp_part, '.geojson']),
                 "result": None}
    savefile(filenames['src_layer'], topojson_to_geojson(ref_layer).encode())
    commande = \
        b'getLinkLayer_json(layer_json_path, csv_table, i, j, fij, join_field)'
    data = json.dumps({
        "layer_json_path": filenames['src_layer'],
        "csv_table": posted_data['csv_table'],
        "i": posted_data["field_i"],
        "j": posted_data["field_j"],
        "fij": posted_data["field_fij"],
        "join_field": n_field_name
        }).encode()
    print('Python - p2 : {:.4f}'.format(time.time()-s_t))
    content = await R_client_fuw_async(
        url_client, commande, data, app_glob['async_ctx'], user_id)
    s_t = time.time()
    content = content.decode()
    try:
        content = json.loads(content)
    except:
        return '{"Error":"Something went wrong... : %s"}' % content \
            if content else "Unknown Error"

    if "additional_infos" in content:
        print("Additionnal infos:\n", content["additional_infos"])

    res = await geojson_to_topojson(content['geojson_path'])
    new_name = ''.join(["Links_", n_field_name])
    res = res.replace(tmp_part, new_name)
    asyncio.ensure_future(
        app_glob['redis_conn'].set('_'.join([user_id, new_name, "--no-quantization"]), res))
    print('Python - p3 : {:.4f}'.format(time.time()-s_t))
    return res


async def carto_gridded(posted_data, session_redis, user_id):
    s_t = time.time()
    posted_data = json.loads(posted_data.get("json"))

    f_name = '_'.join([user_id, posted_data['topojson'], "--no-quantization"])
    ref_layer = await app_glob['redis_conn'].get(f_name)

#    ref_layer = json.loads(ref_layer.decode())
#    new_field = json.loads(posted_data['var_name'])
    ref_layer, new_field = await asyncio.gather(*[
        ajson_loads(ref_layer.decode()), ajson_loads(posted_data['var_name'])])

    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_topojson_new_field2(ref_layer, new_field[n_field_name], n_field_name)

    tmp_part = get_name()
    filenames = {"src_layer" : ''.join(['/tmp/', tmp_part, '.geojson']),
                 "result": None}
    savefile(filenames['src_layer'], topojson_to_geojson(ref_layer).encode())
    commande = b'make_gridded_map(layer_json_path, var_name, cellsize)'
    data = json.dumps({
        "layer_json_path": filenames['src_layer'],
        "var_name": n_field_name,
        "cellsize": posted_data["cellsize"]
        }).encode()
    print('Python - p2 : {:.4f}'.format(time.time()-s_t))
    content = await R_client_fuw_async(
        url_client, commande, data, app_glob['async_ctx'], user_id)
    s_t = time.time()
    content = content.decode()
    try:
        content = json.loads(content)
    except:
        return '{"Error":"Something went wrong... : %s"}' % content \
            if content else "Unknown Error"

    if "additional_infos" in content:
        print("Additionnal infos:\n", content["additional_infos"])

    res = await geojson_to_topojson(content['geojson_path'])
    new_name = '_'.join(['Gridded', posted_data["cellsize"], n_field_name])
    res = res.replace(tmp_part, new_name)
    asyncio.ensure_future(
        app_glob['redis_conn'].set('_'.join([user_id, new_name, "--no-quantization"]), res))
    print('Python - p3 : {:.4f}'.format(time.time()-s_t))
    return res


async def call_mta_simpl(posted_data, session_redis, user_id):
    posted_data = json.loads(posted_data.get("json"))
    if "medium" in posted_data["method"]:
        commande = b'mta_mediumdev(x, var1, var2, key, type_dev)'
        data = json.dumps({
            "x": json.dumps(posted_data['table']).encode(),
            "var1": posted_data['var1_name'],
            "var2": posted_data['var2_name'],
            "key": posted_data["key_field_name"],
            "type_dev": posted_data["type_dev"]
            }).encode()

    elif "global" in posted_data["method"]:
        commande = b'mta_globaldev(x, var1, var2, ref, type_dev)'
        data = json.dumps({
            "x": json.dumps(posted_data['table']).encode(),
            "var1": posted_data['var1_name'],
            "var2": posted_data['var2_name'],
            "ref": posted_data["ref_value"],
            "type_dev": posted_data["type_dev"]
            }).encode()

    else:
        return {"Error": "Unknow MTA method"}

    content = await R_client_fuw_async(
        url_client, commande, data, app_glob['async_ctx'], user_id)
    content = content.decode()
    try:
        assert '{' in content
        return content
    except:
        return '{"Error":"Something went wrong... : %s"}' % content \
            if content else "Unknown Error"


async def call_mta_geo(posted_data, session_redis, user_id):
    s_t = time.time()
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, posted_data['topojson'], "--no-quantization"])
    ref_layer = await app_glob['redis_conn'].get(f_name)
    ref_layer = json.loads(ref_layer.decode())

    new_field1 = json.loads(posted_data['var1'])
    n_field_name1 = list(new_field1.keys())[0]

    new_field2 = json.loads(posted_data['var2'])
    n_field_name2 = list(new_field2.keys())[0]

    if len(new_field1[n_field_name1]) > 0:
        join_topojson_new_field2(ref_layer, new_field1[n_field_name1], n_field_name1)

    if len(new_field2[n_field_name2]) > 0:
        join_topojson_new_field2(ref_layer, new_field2[n_field_name2], n_field_name2)

    tmp_part = get_name()
    filenames = {"src_layer" : ''.join(['/tmp/', tmp_part, '.geojson']),
                 "result": None}
    savefile(filenames['src_layer'], topojson_to_geojson(ref_layer).encode())
    commande = b'mta_localdev(geojson_path, var1, var2, order, dist, type_dev)'
    data = json.dumps({
        "geojson_path": filenames['src_layer'],
        "var1": n_field_name1,
        "var2": n_field_name2,
        "order": posted_data["order"],
        "dist": posted_data["dist"],
        "type_dev": posted_data["type_dev"]}).encode()
    print('Python - p2 : {:.4f}'.format(time.time()-s_t))
    content = await R_client_fuw_async(
        url_client, commande, data, app_glob['async_ctx'], user_id)
    content = content.decode()
    try:
        assert '{' in content
        return content
    except:
        return '{"Error":"Something went wrong... : %s"}' % content \
            if content else "Unknown Error"


async def call_stewart(posted_data, session_redis, user_id):
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, posted_data['topojson'], "--no-quantization"])
    point_layer = await app_glob['redis_conn'].get(f_name)
    point_layer = json.loads(point_layer.decode())
    new_field = json.loads(posted_data['var_name'])

    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_topojson_new_field2(point_layer, new_field[n_field_name], n_field_name)

    if posted_data['mask_layer']:
        f_name = '_'.join([user_id, posted_data['mask_layer'], "--no-quantization"])
        result_mask = await app_glob['redis_conn'].get(f_name)

    tmp_part = get_name()
    filenames = {
        'point_layer': ''.join(['/tmp/', tmp_part, '.geojson']),
        'mask_layer': ''.join(['/tmp/', get_name(), '.geojson']) if posted_data['mask_layer'] != "" else None
        }
    savefile(filenames['point_layer'], topojson_to_geojson(point_layer).encode())

    if filenames['mask_layer']:
        savefile(filenames['mask_layer'],
                 topojson_to_geojson(json.loads(result_mask.decode())).encode())

    commande = (b'stewart_to_json(knownpts_json, var_name, typefct, span, '
                b'beta, resolution, nb_class, user_breaks, mask_json)')

    data = json.dumps({
        'knownpts_json': filenames['point_layer'],
        'var_name': n_field_name,
        'typefct': posted_data['typefct'].lower(),
        'span': posted_data['span'],
        'beta': float(posted_data['beta']),
        'resolution': posted_data['resolution'],
        'nb_class': int(posted_data['nb_class']),
        'user_breaks': posted_data['user_breaks'],
        'mask_json': filenames['mask_layer']
        }).encode()

    content = await R_client_fuw_async(
        url_client, commande, data, app_glob['async_ctx'], user_id)
    content = content.decode()

    try:
        content = json.loads(content)
    except:
        return '{"Error":"Something went wrong... : %s"}' % content \
            if content else "Unknown Error"

    if "additional_infos" in content:
        print("Additionnal infos:\n", content["additional_infos"])

    res = await geojson_to_topojson(content['geojson_path'])
    new_name = '_'.join(['StewartPot', n_field_name])
    res = res.replace(tmp_part, new_name)
    asyncio.ensure_future(
        app_glob['redis_conn'].set('_'.join([user_id, new_name, "--no-quantization"]), res))
    return '|||'.join([res, json.dumps(content['breaks'])])

async def R_compute(request):
    s_t = time.time()
    function = request.match_info['function']
    if function not in app_glob['R_function']:
        return web.Response(text=json.dumps(
            {"Error": "Wrong function requested"}))
    else:
        posted_data, session_redis = \
            await asyncio.gather(*[request.post(), get_session(request)])
        user_id = get_user_id(session_redis)
        func = app_glob['R_function'][function]
        print('Python - p1 : {:.4f}'.format(time.time()-s_t))
        data_response = await func(posted_data, session_redis, user_id)
        return web.Response(text=data_response)

async def handler_exists_layer(request):
    res = await app_glob['redis_conn'].get(request.match_info['expr'])
    if res:
        return web.Response(text=res.decode())
    else:
        return web.Response(text="")

async def handler_exists_layer2(request):
    session_redis = await get_session(request)
    posted_data = await request.post()
    user_id = get_user_id(session_redis)
    layer_name = posted_data.get('layer')
    layer_name_redis = posted_data.get('layer_name')
    file_format = posted_data.get('format')
    projection = json.loads(posted_data.get('projection'))
    res = await app_glob['redis_conn'].get(
            '_'.join([user_id, layer_name_redis])
            )
    if not res:
        return web.Response(text="Something wrong happened")
    elif "TopoJSON" in file_format:
        return web.Response(text=res.decode())
    else:
        res_geojson = topojson_to_geojson(json.loads(res.decode()))
        out_proj = projection["name"] if "name" in projection else projection["proj4string"]
        out_proj = check_projection(out_proj)
        if not out_proj:
            return web.Response(text="Unable to understand the projection string")
        if "GeoJSON" in file_format:
            if out_proj == "epsg:4326":
                return web.Response(text=res_geojson)
            else:
                reproj_layer(res_geojson, out_proj)
                return web.Response(text=res_geojson)
        elif "Shapefile" in file_format:
            tmp_path = prepare_folder()
            output_path = ''.join([tmp_path, "/", layer_name, ".geojson"])
            savefile(output_path, res_geojson.encode())
            reproj_convert_layer(output_path, output_path.replace(".geojson", ".shp"),
                                 "ESRI Shapefile", out_proj)
            os.remove(output_path)
            zstream, zipname = zip_and_clean(tmp_path, layer_name)
            b64_zip =  base64.b64encode(zstream.read())
            return web.Response(
                body=b64_zip,
                headers= MultiDict({
                    "Content-Type": "application/octet-stream",
                    "Content-Disposition": "attachment; filename=" + layer_name + ".zip",
                    "Content-length": len(b64_zip)}))
    return web.Response(text="Not supported yet")

async def rawcsv_to_geo(data):
    raw_csv = StringIO(data)
    df = pd.read_csv(raw_csv)
    geo_col_y = [colnb for colnb, col in enumerate(df.columns)
                 if col.lower() in {"y", "latitude", "lat"}][0] + 1
    geo_col_x = [colnb for colnb, col in enumerate(df.columns)
                 if col.lower() in {"x", "longitude", "lon", "lng", "long"}][0] + 1
    col_names = df.columns.tolist()
    ## Ugly minified geojson construction "by hand" :
    ft_template_start = \
        '''{"type":"Feature","geometry":{"type":"Point","coordinates":['''
    geojson_features = [
        ''.join([ft_template_start,
                 '''{0},{1}'''.format(ft[geo_col_x], ft[geo_col_y]),
                 ''']},"properties":''',
                 str({k: v for k, v in zip(col_names, ft[1:])}).replace("'", '"'),
                 '''}'''])
        for ft in df.itertuples()
        ]

    return ''.join([
        '''{"type":"FeatureCollection","crs":{"type":"name","properties":'''
        '''{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[''',
        ','.join(geojson_features),
        """]}"""
        ])

async def convert_csv_geo(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis)
    st = time.time()
    file_name = posted_data.get("filename")
    data = posted_data.get("csv_file")
    f_name = '_'.join([user_id, file_name.split('.')[0], "--no-quantization"])

    result = await app_glob['redis_conn'].get(f_name)
    if result:
        print("Used cached result")
        return web.Response(text=result.decode())

    res = await rawcsv_to_geo(data)

    filepath = "/tmp/"+file_name+".geojson"
    with open(filepath, 'wb') as f:
        f.write(res.encode())
    result = await geojson_to_topojson(filepath)
    if len(result) == 0:
        result = json.dumps({'Error': 'GeoJSON layer provided without CRS'})
    else:
        asyncio.ensure_future(app_glob['redis_conn'].set(f_name, result))
    print("csv -> geojson -> topojson : {:.4f}s".format(time.time()-st))
    return web.Response(text=result)

def check_port_available(port_nb):
    if port_nb < 7000:
        return False
    with closing(socket(AF_INET, SOCK_STREAM)) as sock:
        if sock.connect_ex(("0.0.0.0", port_nb)) == 0:
            return False
    return True

def display_usage(file_name):
    print("""
    Usage :
        ./{} [TCP port to use] [Number of R process]

        TCP port to use       An available TCP port for the application
                              (default: 9999)
        Number of R process   The number of R instance to start in background
                              (default: 2)
        """.format(file_name))

async def init(loop, port=9999):
    redis_cookie = await aioredis.create_pool(('localhost', 6379), db=0, maxsize=500)
    redis_conn = await aioredis.create_reconnecting_redis(('localhost', 6379), db=1)
    storage = redis_storage.RedisStorage(redis_cookie)
    app = web.Application(middlewares=[session_middleware(storage)])
#    aiohttp_debugtoolbar.setup(app)
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
    app.router.add_route('GET', '/', handler)
    app.router.add_route('GET', '/index', handler)
    app.router.add_route('GET', '/modules', handler)
    app.router.add_route('GET', '/modules/', handler)
    app.router.add_route('GET', '/get_layer/{expr}', handler_exists_layer)
    app.router.add_route('POST', '/get_layer2', handler_exists_layer2)
    app.router.add_route('GET', '/modules/{function}', handle_app_functionality)
    app.router.add_route('POST', '/R_compute/{function}', R_compute)
    app.router.add_route('POST', '/convert_to_topojson', convert)
    app.router.add_route('POST', '/convert_csv_geo', convert_csv_geo)
    app.router.add_route('POST', '/cache_topojson/{params}', cache_input_topojson)
    app.router.add_route('POST', '/save_user_pref', user_pref)
#    app.router.add_static('/foo/', path='templates/modules', name='modules')
    app.router.add_static('/static/', path='static', name='static')
    app.router.add_static('/database/', path='../database', name='database')

    srv = await loop.create_server(
        app.make_handler(), '0.0.0.0', port)
    return srv, redis_conn

if __name__ == '__main__':
    if not os.path.isdir('/tmp/feeds'):
        try:
            os.mkdir('/tmp/feeds')
        except Exception as err:
            print(err)
            display_usage(sys.argv[0])
            sys.exit()

    if len(sys.argv) == 2:
        try:
            port = int(sys.argv[1])
        except:
            display_usage(sys.argv[0])
            sys.exit()
        nb_r_workers = '2'
    elif len(sys.argv) == 3:
        try:
            port = int(sys.argv[1])
        except:
            display_usage(sys.argv[0])
            sys.exit()
        nb_r_workers = sys.argv[2]
        if not nb_r_workers.isnumeric():
            print("Error : The number of R instances have to be a number (<= 8)")
            display_usage(sys.argv[0])
            sys.exit()
    else:
        port = 9999
        nb_r_workers = '2'

    if not check_port_available(port):
        print("Error : Selected port is already in use")
        display_usage(sys.argv[0])
        sys.exit()
    # The mutable mapping provided by web.Application will be used to store (safely ?)
    # some global variables :
    # Todo : create only one web.Application object instead of app + app_glob
    app_glob = web.Application()
    if not nb_r_workers == '0':
        # To be set to '0' when launching other instance of the noname app
        # as they all can use the same worker queue
        app_glob['broker'] = Popen([
            sys.executable,'r_py/rclient_load_balance_auto_scale.py', nb_r_workers
            ])

    # In order to get an async zmq context object for the clients without using the zmq event loop:
    zmq.asyncio.install()
    app_glob['async_ctx'] = zmq.asyncio.Context(2)
    app_glob['UPLOAD_FOLDER'] = 'tmp/users_uploads'
    path = os.path.dirname(os.path.realpath(__file__))
    app_glob['app_real_path'] = path[:-path[::-1].find(os.path.sep)-1]
    app_glob['app_users'] = set()
    loop = asyncio.get_event_loop()
    srv, redis_conn = loop.run_until_complete(init(loop, port))
    app_glob['redis_conn'] = redis_conn
    with open('static/json/sample_layers.json', 'r') as f:
        data = f.read()
        app_glob['db_layers'] = json.loads(data.replace('/da', '../da'))[0]
    app_glob['R_function'] = {
        "stewart": call_stewart, "gridded": carto_gridded, "links": links_map,
        "MTA_d": call_mta_simpl, "MTA_geo": call_mta_geo ,
        "carto_doug": carto_doug, "nothing": nothing }
    print(pp, 'serving on', srv.sockets[0].getsockname())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass