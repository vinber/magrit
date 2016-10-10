#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-
"""
noname_app

Usage:
  noname_app
  noname_app [--port <port_nb> --name-app <name>]
  noname_app [-p <port_nb> -n <name>]
  noname_app --version
  noname_app --help

Options:
  -h, --help                        Show this screen.
  --version                         Show version.
  -p <port>, --port <port>          Port number to use (exit if not available) [default: 9999]
  -n <name>, --name-app <name>      Name of the application [default: Magrit]
"""

import os
import sys
import ujson as json
import time
import docopt
import logging

import asyncio
import uvloop
import pandas as pd
import numpy as np
import matplotlib; matplotlib.use('Agg')
from base64 import b64encode
from contextlib import closing
from zipfile import ZipFile
from datetime import datetime
from io import StringIO, BytesIO
from geopandas import GeoDataFrame
from subprocess import Popen, PIPE
from socket import socket, AF_INET, SOCK_STREAM
from mmh3 import hash as mmh3_hash
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# Web related stuff :
import jinja2
import aiohttp_jinja2
from aioredis import create_pool, create_reconnecting_redis
from aiohttp import web, MultiDict
from aiohttp_session import get_session, session_middleware, redis_storage

try:
    from helpers.misc import (
        savefile, get_key, fetch_zip_clean, prepare_folder, mmh3_file)
    from helpers.cy_misc import (
        get_name, join_field_topojson, get_borders_to_geojson)
    from helpers.cartogram_doug import make_cartogram
    from helpers.topo_to_geo import convert_from_topo
    from helpers.geo import (
        reproj_convert_layer, reproj_layer, check_projection, olson_transform,
        make_geojson_links)
    from helpers.stewart_smoomapy import quick_stewart_mod, resume_stewart
    from helpers.grid_layer import get_grid_layer

except:
    from .helpers.misc import (
        savefile, get_key, fetch_zip_clean, prepare_folder, mmh3_file)
    from .helpers.cy_misc import (
        get_name, join_field_topojson, get_borders_to_geojson)
    from .helpers.cartogram_doug import make_cartogram
    from .helpers.topo_to_geo import convert_from_topo
    from .helpers.geo import (
        reproj_convert_layer, reproj_layer, check_projection, olson_transform,
        make_geojson_links)
    from .helpers.stewart_smoomapy import quick_stewart_mod, resume_stewart
    from .helpers.grid_layer import get_grid_layer

pp = '(aiohttp_app) '


@aiohttp_jinja2.template('index2.html')
async def index_handler(request):
    session = await get_session(request)
    if 'last_visit' in session:
        date = 'Last visit : {}'.format(datetime.fromtimestamp(
            session['last_visit']).strftime("%B %d, %Y at %H:%M:%S"))
    else:
        date = ''
    session['last_visit'] = time.time()
    return {'last_visit': date,
            'app_name': request.app['app_name']}

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


async def geojson_to_topojson(
        filepath, quantization="--no-quantization", remove=False):
    # Todo : Rewrite using asyncio.subprocess methods
    # Todo : Use topojson python port if possible to avoid writing a temp. file
    process = Popen(["topojson", "--no-stitch-poles", quantization, "--bbox",
                     "-p", "--", filepath],
                    stdout=PIPE, stderr=PIPE)
    stdout, _ = process.communicate()
    if remove:
        os.remove(filepath)
    return stdout.decode()


async def store_non_quantized(filepath, f_name, redis_conn):
    process = Popen(["topojson", "--spherical", "--no-quantization", "--bbox",
                     "-p", "--", filepath], stdout=PIPE, stderr=PIPE)
    stdout, _ = process.communicate()
    result = stdout.decode()
    os.remove(filepath)
    await redis_conn.set(f_name, result)


def topojson_to_geojson(data):
    """
    Topojson to geojson back-conversion in python
    (	through cython-written extension)
    """
    return json.dumps(convert_from_topo(data))


async def remove_layer(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])
    f_names = posted_data.getall('layer_name')
    for f_name in f_names:
        f_name_q = '_'.join([user_id, f_name, "NQ"])
        f_name_nq = '_'.join([user_id, f_name, "NQ"])
        print("Deleting  " + f_name)
        asyncio.ensure_future(
            request.app["redis_conn"].delete(f_name_q))
        asyncio.ensure_future(
            request.app["redis_conn"].delete(f_name_nq))
    return web.Response(text=json.dumps({"code": "Ok"}))


async def list_user_layers(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])
    layers = await request.app["redis_conn"].keys(user_id + "_*")
    if not layers:
        return web.Response(text=json.dumps({"Error": "No layer to list"}))
    else:
        tmp = user_id + "_"
        layer_names = ['_'.join(name.decode().replace(
                            tmp, '').split('_')[::-1][1::][::-1])
                       for name in layers]   # ^^^^^^^^^^^^^ seriously
        return web.Response(text=json.dumps({"layers": layer_names}))


async def cache_input_topojson(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    params = request.match_info['params']

    if "sample_data" in params:
        user_id = get_user_id(session_redis, request.app['app_users'])
        name = posted_data.get('layer_name')
        path = request.app['db_layers'][name]
        hash_val = str(mmh3_hash(path))
        fp_name = '_'.join([user_id, name])
        f_name = '_'.join([user_id, hash_val])
        f_nameQ = '_'.join([f_name, "Q"])
        f_nameNQ = '_'.join([f_name, "NQ"])

        result = await request.app['redis_conn'].get(f_nameQ)
        if result:
            result = result.decode()
            request.app['logger'].info(
                '{} - Used result from redis'.format(user_id))
            return web.Response(text=''.join([
                '{"key":', hash_val,
                ',"file":', result.replace(''.join([user_id, '_']), ''), '}'
                ]))
        else:
            res = await ogr_to_geojson(path, to_latlong=True)
            request.app['logger'].info(
                '{} - Transform coordinates from GeoJSON'.format(user_id))
            f_path = '/tmp/' + fp_name + ".geojson"
            with open(f_path, 'w', encoding='utf-8') as f:
                f.write(res)
            result = await geojson_to_topojson(f_path, "-q 1e5")
            result = result.replace(''.join([user_id, '_']), '')
            asyncio.ensure_future(
                store_non_quantized(
                    f_path, f_nameNQ, request.app['redis_conn']))
            asyncio.ensure_future(
                request.app['redis_conn'].set(f_nameQ, result))
            print('Caching the TopoJSON')
            return web.Response(text=''.join(
                ['{"key":', hash_val, ',"file":', result, '}']
                ))

    elif "user" in params:
        try:
            file_field = posted_data['file[]']
            name = file_field.filename
            data = file_field.file.read()

        except Exception as err:
            print("posted data :\n", posted_data)
            print("err\n", err)
            return web.Response(text='{"Error": "Incorrect datatype"}')

        user_id = get_user_id(session_redis, request.app['app_users'])
        hash_val = str(mmh3_hash(data))
        f_name = '_'.join([user_id, hash_val])
        f_nameQ = '_'.join([f_name, "Q"])
        f_nameNQ = '_'.join([f_name, "NQ"])

        result = await request.app['redis_conn'].get(f_nameNQ)
        if result:
            result = result.decode()
            request.app['logger'].info(
                '{} - Used result from redis'.format(user_id))
            return web.Response(text=''.join([
                '{"key":', hash_val,
                ',"file":', result.replace(hash_val, name), '}'
                ]))

        asyncio.ensure_future(request.app['redis_conn'].set(f_nameNQ, data))
        asyncio.ensure_future(request.app['redis_conn'].set(f_nameQ, data))
        print('Caching the TopoJSON')
        return web.Response(text=''.join(
            ['{"key":', hash_val, ',"file":null}']
            ))


def get_user_id(session_redis, app_users):
    """
    Function to get (or retrieve) the user unique ID
    (ID is used amongst other things to set/get data in/from redis
    and for retrieving the layers decribed in a "preference file" of an user)
    """
    if 'app_user' not in session_redis:
        user_id = get_key(app_users)
        app_users.add(user_id)
        session_redis['app_user'] = user_id
        return user_id
    else:
        user_id = session_redis['app_user']
        if user_id not in app_users:
            app_users.add(user_id)
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


async def convert(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])

    # If a shapefile is provided as multiple files
    # (.shp, .dbf, .shx, and .prj are expected), not ziped :
    if "action" in posted_data and "file[]" not in posted_data:
        list_files = []
        for i in range(len(posted_data) - 1):
            field = posted_data.getall('file[{}]'.format(i))[0]
            file_name = ''.join(['/tmp/', user_id, '_', field[1]])
            list_files.append(file_name)
            savefile(file_name, field[2].read())
        shp_path = [i for i in list_files if 'shp' in i][0]
        hashed_input = mmh3_file(shp_path)
        name = shp_path.split(os.path.sep)[2]
        datatype = "shp"
    # If there is a single file (geojson or zip) to handle :
    elif "action" in posted_data and "file[]" in posted_data:
        try:
            field = posted_data.get('file[]')
            name = field[1]
            data = field[2].read()
            datatype = field[3]
            print(datatype)
            hashed_input = mmh3_hash(data)
            filepath = ''.join(['/tmp/', user_id, "_", name])
        except Exception as err:
            print("posted data :\n", posted_data)
            print("err\n", err)
            return web.Response(text='{"Error": "Incorrect datatype"}')

    f_name = '_'.join([user_id, str(hashed_input)])
    f_nameQ = '_'.join([f_name, "Q"])
    f_nameNQ = '_'.join([f_name, "NQ"])

    results = await request.app['redis_conn'].keys(f_name)
    if results:
        result = await request.app['redis_conn'].get(f_nameQ)
        request.app['logger'].info(
            '{} - Used result from redis'.format(user_id))
        return web.Response(text=''.join(
            ['{"key":', str(hashed_input), ',"file":', result.decode(), '}']
            ))

    if "shp" in datatype:
        res = await ogr_to_geojson(shp_path, to_latlong=True)
        filepath2 = '/tmp/' + name.replace('.shp', '.geojson')
        with open(filepath2, 'w') as f:
            f.write(res)
        result = await geojson_to_topojson(filepath2, "-q 1e5")
        result = result.replace(''.join([user_id, '_']), '')
        asyncio.ensure_future(
            store_non_quantized(
                filepath2, f_nameNQ, request.app['redis_conn']))
        asyncio.ensure_future(
            request.app['redis_conn'].set(f_nameQ, result))
        [os.remove(file) for file in list_files]

    elif datatype in ('application/x-zip-compressed', 'application/zip'):
        dataZip = BytesIO(data)
        dir_path = '/tmp/{}{}/'.format(user_id, hashed_input)
        os.mkdir(dir_path)
        with ZipFile(dataZip) as myzip:
            list_files = myzip.namelist()
            list_files = [dir_path + i for i in list_files]
            shp_path = [i for i in list_files if 'shp' in i][0]
            myzip.extractall(path=dir_path)
            res = await ogr_to_geojson(shp_path, to_latlong=True)
            filepath2 = shp_path.replace(
                "{}{}/".format(user_id, hashed_input), "").replace(
                '.shp', '.geojson')
            with open(filepath2, 'w') as f:
                f.write(res)
            result = await geojson_to_topojson(filepath2, "-q 1e5")
            result = result.replace(''.join([user_id, '_']), '')
            asyncio.ensure_future(
                request.app['redis_conn'].set(f_nameQ, result))
            asyncio.ensure_future(
                store_non_quantized(
                    filepath2, f_nameNQ, request.app['redis_conn']))
        [os.remove(dir_path + file) for file in os.listdir(dir_path)]
        os.removedirs(dir_path)

    elif 'octet-stream' in datatype and "geojson" in name.lower():
        data = data.decode()
        if '"crs"' in data and '"urn:ogc:def:crs:OGC:1.3:CRS84"' not in data:
            crs = True
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(data)
            res = await ogr_to_geojson(filepath, to_latlong=True)
            request.app['logger'].info(
                '{} - Transform coordinates from GeoJSON'.format(user_id))
            os.remove(filepath)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(res)
        else:
            crs = False
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(data)

        result = await geojson_to_topojson(filepath, "-q 1e5")

        if len(result) == 0 and not crs:
            return web.Response(text=json.dumps(
                {'Error': 'GeoJSON layer provided without CRS'}))
        else:
            result = result.replace(''.join([user_id, '_']), '')
            asyncio.ensure_future(
                store_non_quantized(
                    filepath, f_nameNQ, request.app['redis_conn']))
            asyncio.ensure_future(
                request.app['redis_conn'].set(f_nameQ, result))

    elif 'octet-stream' in datatype and "kml" in name.lower():
        print(datatype, name)
        with open(filepath, 'wb') as f:
            f.write(data)
        res = await ogr_to_geojson(filepath, to_latlong=True)
        os.remove(filepath)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(res)
        result = await geojson_to_topojson(filepath, "-q 1e5")
        if len(result) == 0:
            return web.Response(
                text='{"Error": "Error converting reading kml file"}')
        else:
            result = result.replace(''.join([user_id, '_']), '')
            asyncio.ensure_future(
                store_non_quantized(
                    filepath, f_nameNQ, request.app['redis_conn']))
            asyncio.ensure_future(
                request.app['redis_conn'].set(f_nameQ, result))
    else:
        return web.Response(text='{"Error": "Incorrect datatype"}')

    request.app['logger'].info(
        '{} - Converted, stored in redis and sent back to client'
        .format(user_id))
    return web.Response(text=''.join(
        ['{"key":', str(hashed_input), ',"file":', result, '}']
        ))


@aiohttp_jinja2.template('modules.html')
async def serve_main_page(request):
    session_redis = await get_session(request)
    get_user_id(session_redis, request.app['app_users'])
    return {"app_name": request.app["app_name"]}


async def carto_doug(posted_data, user_id, app):
    st = time.time()
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, str(posted_data['topojson']), "Q"])
    ref_layer = await app['redis_conn'].get(f_name)
    ref_layer = await ajson_loads(ref_layer.decode())
    new_field = posted_data['var_name']
    iterations = int(posted_data['iterations'])
    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)

    tmp_part = get_name()
    tmp_path = ''.join(['/tmp/', tmp_part, '.geojson'])
    savefile(tmp_path, topojson_to_geojson(ref_layer).encode())

    result = await app.loop.run_in_executor(
        app["ThreadPool"],
        make_cartogram,
        GeoDataFrame.from_file(tmp_path), n_field_name, iterations)
    os.remove(tmp_path)
    savefile(tmp_path, result.encode())
    res = await geojson_to_topojson(tmp_path, remove=True)
    new_name = '_'.join(["Carto_doug", str(iterations), n_field_name])
    res = res.replace(tmp_part, new_name)
    hash_val = mmh3_hash(res)
    asyncio.ensure_future(
        app['redis_conn'].set('_'.join([user_id, str(hash_val), "NQ"]), res))
    app['logger'].info(
        '{} - timing : carto_doug : {:.4f}s'
        .format(user_id, time.time()-st))
    return ''.join(['{"key":', str(hash_val), ',"file":', res, '}'])


async def compute_discont(posted_data, user_id, app):
    st = time.time()
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, str(posted_data['topojson']), "NQ"])
    ref_layer = await app['redis_conn'].get(f_name)
    ref_layer = json.loads(ref_layer.decode())
    new_field = posted_data['join_field']

    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)
    ref_layer_geojson = convert_from_topo(ref_layer)
    tmp_part = get_name()
    tmp_path = ''.join(['/tmp/', tmp_part, '.geojson'])
    with open(tmp_path, 'wb') as f:
        f.write(json.dumps(ref_layer_geojson).encode())
    new_topojson = await geojson_to_topojson(tmp_path, "-q 1e3")
    new_topojson = json.loads(new_topojson)
    res_geojson = app.loop.run_in_executor(
        app["ProcessPool"],
        get_borders_to_geojson,
        new_topojson
        )
    savefile(tmp_path, res_geojson)
    res = await geojson_to_topojson(tmp_path, remove=True)
    new_name = ''.join(["Discont_", n_field_name])
    res = res.replace(tmp_part, new_name)
    hash_val = mmh3_hash(res)
    asyncio.ensure_future(
        app['redis_conn'].set('_'.join([user_id, str(hash_val), "NQ"]), res))
    app['logger'].info(
        '{} - timing : dicont_on_py : {:.4f}s'
        .format(user_id, time.time()-st))

    return ''.join(['{"key":', str(hash_val), ',"file":', res, '}'])


async def links_map(posted_data, user_id, app):
    st = time.time()
    posted_data = json.loads(posted_data.get("json"))

    f_name = '_'.join([user_id, str(posted_data['topojson']), "NQ"])
    ref_layer = await app['redis_conn'].get(f_name)
    ref_layer = json.loads(ref_layer.decode())
    new_field = posted_data['join_field']

    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)
    ref_layer = convert_from_topo(ref_layer)

    result_geojson = await app.loop.run_in_executor(
        app["ThreadPool"],
        make_geojson_links,
        ref_layer,
        posted_data["csv_table"],
        posted_data["field_i"],
        posted_data["field_j"],
        posted_data["field_fij"],
        n_field_name)

    tmp_part = get_name()
    tmp_name = ''.join(['/tmp/', tmp_part, '.geojson'])
    savefile(tmp_name, result_geojson)
    res = await geojson_to_topojson(tmp_name, remove=True)
    new_name = ''.join(["Links_", n_field_name])
    res = res.replace(tmp_part, new_name)
    hash_val = mmh3_hash(res)
    asyncio.ensure_future(
        app['redis_conn'].set('_'.join([user_id, str(hash_val), "NQ"]), res))
    app['logger'].info(
        '{} - timing : links_on_py : {:.4f}s'
        .format(user_id, time.time()-st))

    return ''.join(['{"key":', str(hash_val), ',"file":', res, '}'])


async def carto_gridded(posted_data, user_id, app):
    st = time.time()
    posted_data = json.loads(posted_data.get("json"))

    f_name = '_'.join([user_id, str(posted_data['topojson']), "NQ"])
    ref_layer = await app['redis_conn'].get(f_name)

    ref_layer = json.loads(ref_layer.decode())
    new_field = posted_data['var_name']

    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)

    tmp_part = get_name()
    filenames = {"src_layer": ''.join(['/tmp/', tmp_part, '.geojson']),
                 "result": None}
    savefile(filenames['src_layer'], topojson_to_geojson(ref_layer).encode())

    result_geojson = await app.loop.run_in_executor(
        app["ProcessPool"],
        get_grid_layer,
        filenames['src_layer'],
        posted_data["cellsize"],
        n_field_name,
        posted_data["grid_shape"].lower())

    savefile(filenames['src_layer'], result_geojson.encode())
    res = await geojson_to_topojson(filenames['src_layer'], remove=True)

    app['logger'].info(
        '{} - Gridded_on_py - {:.4f}'.format(user_id, st-time.time()))

    new_name = '_'.join(['Gridded',
                         str(posted_data["cellsize"]),
                         n_field_name])
    res = res.replace(tmp_part, new_name)
    hash_val = str(mmh3_hash(res))
    asyncio.ensure_future(
        app['redis_conn'].set('_'.join([user_id, hash_val, "NQ"]), res))
    return ''.join(['{"key":', hash_val, ',"file":', res, '}'])


async def compute_olson(posted_data, user_id, app):
    st = time.time()
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, str(posted_data['topojson']), "NQ"])

    ref_layer = await app['redis_conn'].get(f_name)
    ref_layer = await ajson_loads(ref_layer.decode())

    scale_values = posted_data['scale_values']
    ref_layer_geojson = convert_from_topo(ref_layer)

    await app.loop.run_in_executor(
        app["ThreadPool"],
        olson_transform,
        ref_layer_geojson,
        scale_values)

    tmp_part = get_name()
    f_name = "".join(["/tmp/", tmp_part, ".geojson"])
    savefile(f_name, json.dumps(ref_layer_geojson).encode())
    res = await geojson_to_topojson(f_name, remove=True)
    new_name = "_".join(["Olson_carto",
                        str(posted_data["field_name"]),
                        str(int(posted_data["scale_max"]*100))])
    res = res.replace(tmp_part, new_name)
    hash_val = str(mmh3_hash(res))
    asyncio.ensure_future(
        app['redis_conn'].set('_'.join([
            user_id, hash_val, "NQ"]), res))
    app['logger'].info(
        '{} - timing : olson-like cartogram : {:.4f}s'
        .format(user_id, time.time()-st))
    return ''.join(['{"key":', hash_val, ',"file":', res, '}'])


async def receiv_layer(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])
    layer_name = posted_data['layer_name']
    data = posted_data['geojson']
    h_val = mmh3_hash(data)
    f_name = '_'.join([user_id, str(h_val)])
    f_nameNQ = '_'.join([f_name, "NQ"])
    tmp_part = get_name()
    filepath = "".join(['/tmp/', tmp_part, '.geojson'])
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(data)
    res = await geojson_to_topojson(filepath)
    res = res.replace(tmp_part, layer_name)
    asyncio.ensure_future(
        request.app['redis_conn'].set(f_nameNQ, res))
    return web.Response(text=''.join(['{"key":', str(h_val), '}']))


async def call_stewart(posted_data, user_id, app):
    st = time.time()
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, str(posted_data['topojson']), "NQ"])
    point_layer = await app['redis_conn'].get(f_name)
    point_layer = json.loads(point_layer.decode())

    new_field1 = posted_data['variable1']
    new_field2 = posted_data['variable2']

    n_field_name1 = list(new_field1.keys())[0]
    if len(new_field1[n_field_name1]) > 0:
        join_field_topojson(point_layer, new_field1[n_field_name1],
                            n_field_name1)

    if new_field2:
        discretization = "equal_interval"
        n_field_name2 = list(new_field2.keys())[0]
        if len(new_field2[n_field_name2]) > 0:
            join_field_topojson(point_layer, new_field2[n_field_name2],
                                n_field_name2)
    else:
        discretization = "jenks"
        n_field_name2 = None

    if posted_data['mask_layer']:
        f_name = '_'.join([user_id, str(posted_data['mask_layer']), "NQ"])
        mask_layer = await app['redis_conn'].get(f_name)

    tmp_part = get_name()
    filenames = {
        'point_layer': ''.join(['/tmp/', tmp_part, '.geojson']),
        'mask_layer': ''.join(['/tmp/', get_name(), '.geojson'])
                      if posted_data['mask_layer'] != "" else None
        }
    savefile(filenames['point_layer'],
             topojson_to_geojson(point_layer).encode())

    if filenames['mask_layer']:
        savefile(filenames['mask_layer'],
                 topojson_to_geojson(json.loads(mask_layer.decode())).encode())

    reusable_val = '_'.join([user_id,
                             str(posted_data['topojson']),
                             n_field_name1,
                             n_field_name2 if n_field_name2 else "",
                             str(posted_data["span"]),
                             str(posted_data['beta']),
                             str(posted_data['resolution']),
                             posted_data['typefct'].lower()])

    existing_obj = await app['redis_conn'].get(reusable_val)

    if existing_obj:
        res, breaks = await app.loop.run_in_executor(
            app["ThreadPool"],
            resume_stewart,
            existing_obj,
            int(posted_data['nb_class']),
            discretization,
            posted_data['user_breaks'],
            filenames["mask_layer"])

    else:
        res, breaks, dump_obj = await app.loop.run_in_executor(
            app["ProcessPool"],
            quick_stewart_mod,
            filenames['point_layer'],
            n_field_name1,
            int(posted_data['span']),
            float(posted_data['beta']),
            posted_data['typefct'].lower(),
            int(posted_data['nb_class']),
            discretization,
            posted_data['resolution'],
            filenames["mask_layer"],
            n_field_name2,
            posted_data['user_breaks'])

        asyncio.ensure_future(
            app['redis_conn'].set(reusable_val, dump_obj))

    os.remove(filenames['point_layer'])
    savefile(filenames['point_layer'], res)
    res = await geojson_to_topojson(filenames['point_layer'], remove=True)

    new_name = '_'.join(['StewartPot', n_field_name1])
    res = res.replace(tmp_part, new_name)
    hash_val = str(mmh3_hash(res))

    asyncio.ensure_future(
        app['redis_conn'].set('_'.join([user_id, hash_val, "NQ"]), res))
    app['logger'].info(
        '{} - timing : stewart_on_py : {:.4f}s'
        .format(user_id, time.time()-st))

    return "|||".join([
        ''.join(['{"key":', hash_val, ',"file":', res, '}']),
        json.dumps(breaks)
        ])

async def geo_compute(request):
    s_t = time.time()
    function = request.match_info['function']
    if function not in request.app['geo_function']:
        return web.Response(text=json.dumps(
            {"Error": "Wrong function requested"}))
    else:
        posted_data, session_redis = \
            await asyncio.gather(*[request.post(), get_session(request)])
        user_id = get_user_id(session_redis, request.app['app_users'])
        func = request.app['geo_function'][function]
        print('Python - p1 : {:.4f}'.format(time.time()-s_t))
        data_response = await func(posted_data, user_id, request.app)
        return web.Response(text=data_response)


async def handler_exists_layer(request):
    session_redis = await get_session(request)
    user_id = get_user_id(session_redis, request.app['app_users'])
    res = await request.app['redis_conn'].get(
        '_'.join([user_id, request.match_info['expr'], "NQ"]))
    if res:
        return web.Response(
            text=res.decode().replace(''.join([user_id, "_"]), ''))
    else:
        return web.Response(text="")


async def handler_exists_layer2(request):
    session_redis = await get_session(request)
    posted_data = await request.post()
    user_id = get_user_id(session_redis, request.app['app_users'])
    layer_name = posted_data.get('layer')
    layer_name_redis = posted_data.get('layer_name')
    file_format = posted_data.get('format')
    projection = json.loads(posted_data.get('projection'))
    res = await request.app['redis_conn'].get(
            '_'.join([user_id, layer_name_redis, "NQ"])
            )
    if not res:
        request.app['logger'].info(
            '{} - Unable to fetch the requested layer ({}/{})'
            .format(user_id, layer_name, layer_name_redis))
        return web.Response(
            text="Error: Unable to fetch the layer on the server")
    elif file_format == "TopoJSON":
        return web.Response(text=res.decode())
    else:
        res_geojson = topojson_to_geojson(json.loads(res.decode()))
        out_proj = check_projection(projection["name"] if "name" in projection
                                    else projection["proj4string"])
        if not out_proj:
            return web.Response(
                text="Error: Unable to understand the projection string")
        if "GeoJSON" in file_format:
            res_geojson = json.loads(res_geojson)
            if out_proj == "epsg:4326":
                res_geojson["crs"] = {
                    'type': 'name', 'properties': {
                        'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
                        }
                    }
                return web.Response(text=json.dumps(res_geojson))
            else:
                reproj_layer(res_geojson, out_proj)
                if "epsg" in out_proj:
                    res_geojson["crs"] = {
                        'type': 'name', 'properties': {
                            'name': 'urn:ogc:def:crs:{}'
                                .format(out_proj.replace("epsg", "EPSG:"))
                            }
                        }
                return web.Response(text=json.dumps(res_geojson))
        else:
            available_formats = {"ESRI Shapefile": ".shp",
                                 "KML": ".kml",
                                 "GML": ".gml"}
            ext = available_formats[file_format]
            tmp_path = prepare_folder()
            output_path = ''.join([tmp_path, "/", layer_name, ".geojson"])
            savefile(output_path, res_geojson.encode())
            reproj_convert_layer(
                output_path, output_path.replace(".geojson", ext),
                file_format, out_proj
                )
            os.remove(output_path)
            raw_data, filename = fetch_zip_clean(tmp_path, layer_name)
            if ".zip" in filename:
                b64_zip = b64encode(raw_data)
                return web.Response(
                    body=b64_zip,
                    headers=MultiDict({
                        "Content-Type": "application/octet-stream",
                        "Content-Disposition": ''.join(
                            ["attachment; filename=", layer_name, ".zip"]),
                        "Content-length": len(b64_zip)}))
            else:
                return web.Response(text=raw_data.decode())
    return web.Response(text="Error: Not supported yet")


async def rawcsv_to_geo(data):
    raw_csv = StringIO(data)
    df = pd.read_csv(raw_csv)
    geo_col_y = [colnb for colnb, col in enumerate(df.columns)
                 if col.lower() in {"y", "latitude", "lat"}
                 ][0] + 1
    geo_col_x = [colnb for colnb, col in enumerate(df.columns)
                 if col.lower() in {"x", "longitude", "lon", "lng", "long"}
                 ][0] + 1
    col_names = df.columns.tolist()
    # Ugly minified geojson construction "by hand" :
    ft_template_start = \
        '''{"type":"Feature","geometry":{"type":"Point","coordinates":['''
    geojson_features = [
        ''.join([
            ft_template_start,
            '''{0},{1}'''.format(ft[geo_col_x], ft[geo_col_y]),
            ''']},"properties":''',
            str({k: v for k, v in zip(col_names, ft[1:])}).replace("'", '"'),
            '''}'''
            ]) for ft in df.itertuples()]

    return ''.join([
        '''{"type":"FeatureCollection","crs":{"type":"name","properties":'''
        '''{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[''',
        ','.join(geojson_features),
        """]}"""
        ])


async def calc_helper(request):
    posted_data = await request.post()
    val1 = np.array(json.loads(posted_data['var1']))
    val2 = np.array(json.loads(posted_data['var2']))
    allowed_types = {"i", "f"}
    if val1.dtype.kind not in allowed_types:
        try:
            val1 = val1.astype(float, copy=False)
        except:
            return web.Response(text='{"Error":"Invalid datatype"}')
    if val2.dtype.kind not in allowed_types:
        try:
            val2 = val2.astype(float, copy=False)
        except:
            return web.Response(text='{"Error":"Invalid datatype"}')
    result = {
                "+": val1.__add__, "-": val1.__sub__,
                "*": val1.__mul__, "/": val1.__truediv__,
                "^": val1.__pow__
            }[posted_data['operator']](val2).tolist()
    return web.Response(text=json.dumps(result))


async def convert_csv_geo(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])
    st = time.time()
    file_name = posted_data.get("filename")
    data = posted_data.get("csv_file")
    hash_val = str(mmh3_hash(data))
    f_name = '_'.join([user_id, hash_val, "NQ"])
    result = await request.app['redis_conn'].get(f_name)
    if result:
        request.app['logger'].info(
                '{} - Used result from redis'.format(user_id))
        return web.Response(text=''.join(
            ['{"key":', hash_val, ',"file":', result.decode(), '}']))

    res = await rawcsv_to_geo(data)

    filepath = "/tmp/"+file_name+".geojson"
    with open(filepath, 'wb') as f:
        f.write(res.encode())
    result = await geojson_to_topojson(filepath)
    if len(result) == 0:
        result = json.dumps({'Error': 'Wrong CSV input'})
    else:
        asyncio.ensure_future(
            request.app['redis_conn'].set(
                '_'.join([user_id, hash_val, "NQ"]), result))

    request.app['logger'].info(
        '{} - timing : csv -> geojson -> topojson : {:.4f}s'
        .format(user_id, time.time()-st))

    return web.Response(text=''.join(
        ['{"key":', hash_val, ',"file":', result, '}']
        ))


async def convert_tabular(request):
    st = time.time()
    posted_data = await request.post()

    # For xls, ods and xlsx files :
    allowed_datatypes = (
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.spreadsheet")

    _, name, data, datatype = posted_data.get('file[]')

    if datatype in allowed_datatypes:
        data = BytesIO(data.read())
        df = pd.read_excel(data)
        result = df.to_csv()
    else:
        result = "Unknown tabular file format"
        request.app['logger'].info(
            'Unknown tabular file format : {} / {}'
            .format(name, datatype))

    request.app['logger'].info(
        ' - timing : spreadsheet -> csv : {:.4f}s'
        .format(time.time()-st))
    return web.Response(text=json.dumps({"file": result, "name": name}))


def prepare_list_svg_symbols():
    symbols = os.listdir("static/img/svg_symbols/")
    with open("static/json/list_symbols.json", "w") as f:
        f.write(json.dumps(symbols))


def check_port_available(port_nb):
    if port_nb < 7000:
        return False
    with closing(socket(AF_INET, SOCK_STREAM)) as sock:
        if sock.connect_ex(("0.0.0.0", port_nb)) == 0:
            return False
    return True


async def on_shutdown(app):
    app["redis_conn"].quit()
    app["ProcessPool"].shutdown()
    app["ThreadPool"].shutdown()
    for task in asyncio.Task.all_tasks():
        await asyncio.sleep(0)
#        info = task._repr_info()
#        if "RedisConnection" in info[1]:
#            task.cancel()
#        if "RedisPool" in info[1] and "pending" in info[0]:
        try:
            await asyncio.wait_for(task, 2)
        except asyncio.TimeoutError:
            task.cancel()
#        else:
#            task.cancel()

async def init(loop, port):
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger("noname_app.main")
    redis_cookie = await create_pool(('0.0.0.0', 6379), db=0, maxsize=50)
    redis_conn = await create_reconnecting_redis(('0.0.0.0', 6379), db=1)
    app = web.Application(
        loop=loop,
        middlewares=[
            session_middleware(redis_storage.RedisStorage(redis_cookie))])
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
    add_route = app.router.add_route
    add_route('GET', '/', index_handler)
    add_route('GET', '/index', index_handler)
    add_route('GET', '/modules', serve_main_page)
    add_route('GET', '/modules/', serve_main_page)
    add_route('GET', '/modules/{expr}', serve_main_page)
    add_route('GET', '/layers', list_user_layers)
    add_route('POST', '/layers/add', receiv_layer)
    add_route('POST', '/layers/delete', remove_layer)
    add_route('GET', '/get_layer/{expr}', handler_exists_layer)
    add_route('POST', '/get_layer2', handler_exists_layer2)
    add_route('POST', '/compute/{function}', geo_compute)
    add_route('POST', '/convert_to_topojson', convert)
    add_route('POST', '/convert_csv_geo', convert_csv_geo)
    add_route('POST', '/convert_tabular', convert_tabular)
    add_route('POST', '/cache_topojson/{params}', cache_input_topojson)
    add_route('POST', '/helpers/calc', calc_helper)
    app.router.add_static('/static/', path='static', name='static')
    app['redis_conn'] = redis_conn
    app['app_users'] = set()
    app['logger'] = logger
    with open('static/json/sample_layers.json', 'r') as f:
        app['db_layers'] = json.loads(f.read().replace('/static', 'static'))[0]
    app['ThreadPool'] = ThreadPoolExecutor(4)
    app['ProcessPool'] = ProcessPoolExecutor(4)
    app['geo_function'] = {
        "stewart": call_stewart, "gridded": carto_gridded, "links": links_map,
        "carto_doug": carto_doug, "olson": compute_olson}
#    app.on_startup.append(on_startup)
    app.on_shutdown.append(on_shutdown)
    prepare_list_svg_symbols()
    if not port:
        return app
    else:
        handler = app.make_handler()
        srv = await loop.create_server(
            handler, '0.0.0.0', port)
        return srv, app, handler

def create_app(app_name="FreeCarto"):
    # Entry point when using Gunicorn to run the application with something like :
    # $ gunicorn "noname_app.noname_aio:create_app('AppName')" --bind 0.0.0.0:9999 --worker-class aiohttp.worker.GunicornUVLoopWebWorker --workers 2
    app_real_path = os.path.dirname(os.path.realpath(__file__))
    if app_real_path != os.getcwd():
        os.chdir(app_real_path)
    loop = asyncio.get_event_loop()
    app = loop.run_until_complete(init(loop, None))
    app['app_name'] = app_name
    return app


def main():
    # Entry point used when the application is started directly like :
    # $ ./noname_app/noname_aio.py --name AppName --port 9999
    #   or when installed and started like :
    # $ noname_app --name AppName --port 9999
    arguments = docopt.docopt(__doc__, version='noname_app 0.0.0 (Unreleased)')
    if not arguments["--port"].isnumeric():
        print(__doc__[__doc__.find("Usage:"):__doc__.find("\nOptions")])
        sys.exit("Error: Invalid port value")
    port = int(arguments["--port"])

    if not check_port_available(port):
        print(__doc__[__doc__.find("Usage:"):__doc__.find("\nOptions")])
        sys.exit("Error : Selected port is already in use")

    app_real_path = os.path.dirname(os.path.realpath(__file__))
    if app_real_path != os.getcwd():
        os.chdir(app_real_path)

    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    loop = asyncio.get_event_loop()
    asyncio.set_event_loop(loop)
    srv, app, handler = loop.run_until_complete(init(loop, port))
    app['app_name'] = arguments["--name-app"]
    app['logger'].info('serving on' + str(srv.sockets[0].getsockname()))
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.close()
        loop.run_until_complete(srv.wait_closed())
        loop.run_until_complete(app.shutdown())
        loop.run_until_complete(handler.finish_connections(60.0))
        loop.run_until_complete(app.cleanup())
    loop.close()


if __name__ == '__main__':
    main()
