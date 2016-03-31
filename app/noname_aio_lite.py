# -*- coding: utf-8 -*-
"""
@author: mz
"""
import os
import sys
import ujson as json

from zipfile import ZipFile
from random import choice
#from hashlib import sha512
import asyncio
from subprocess import Popen, PIPE

# Web related stuff :
import jinja2
import aiohttp_jinja2
from aiohttp import web
from aiohttp_session import get_session, session_middleware
from aiohttp_session.cookie_storage import EncryptedCookieStorage

from helpers.misc import savefile

pp = '(aiohttp_app) '


def get_name(length=25):
    """
    Find a temporary random name to share object
    with some external soft used ( R / ogr2ogr / topojson / etc.)
    Aimed to be remplaced by something better
    """
    return ''.join([bytes([choice(list(range(48, 58))
                                  + list(range(65, 91))
                                  + list(range(97, 123)))]).decode()
                    for i in range(length)])


@aiohttp_jinja2.template('index.html')
@asyncio.coroutine
def handler(request): return {}

def ogr_to_geojson(filepath, to_latlong=True):
    # Todo : Rewrite using asyncio.subprocess methods
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

def geojson_to_topojson(filepath):
    # Todo : Rewrite using asyncio.subprocess methods
    # Todo : Use topojson python port if possible to avoid writing a temp. file
    process = Popen(["topojson", "--spherical", "--bbox", "true",
                     "-p", "--", filepath], stdout=PIPE)
    stdout, _ = process.communicate()
    return stdout.decode()

@asyncio.coroutine
def user_pref(request):
    posted_data = yield from request.post()
    # session = yield from get_session(request)
    # session['map_pref'] = posted_data
    return web.Response(text=json.dumps({'Info': "I don't do anything with it rigth now!"}))

@asyncio.coroutine
def cache_input_topojson(request):
    posted_data = yield from request.post()
    # session = yield from get_session(request)
    # session['map_pref'] = posted_data
    return web.Response(text=json.dumps({'Info': "I don't do anything with it rigth now!"}))


@asyncio.coroutine
def convert(request):
    posted_data = yield from request.post()

    # If a shapefile is provided as multiple files (.shp, .dbf, .shx, and .prj are expected), not ziped :
    if "action" in posted_data and not "file[]" in posted_data:
        list_files = []
        for i in range(len(posted_data) - 1):
            field = posted_data.getall('file[{}]'.format(i))[0]
            file_name = ''.join(['/tmp/', field[1]])
            list_files.append(file_name)
            savefile(file_name, field[2].read())
        shp_path = [i for i in list_files if 'shp' in i][0]
        name = shp_path.split(os.path.sep)[2]
        datatype = "shp"

    # If there is a single file (geojson or zip) to handle :
    elif "action" in posted_data and "file[]" in posted_data:
        try:
            field = posted_data.get('file[]')
            name = field[1]
            data = field[2].read()
            datatype = field[3]
            filepath = os.path.join(
                app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], name)
        except Exception as err:
            print("posted data :\n", posted_data)
            print("err\n", err)
            return web.Response(text=json.dumps({'Error': 'Incorrect datatype'}))

    if "shp" in datatype:
        res = ogr_to_geojson(shp_path, to_latlong=True)
        filepath2 = '/tmp/' + name.replace('.shp', '.geojson')
        with open(filepath2, 'w') as f:
            f.write(res)
        result = geojson_to_topojson(filepath2)
        os.remove(filepath2)
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
            res = ogr_to_geojson(shp_path, to_latlong=True)
            filepath2 = '/tmp/' + layer_name.replace('.shp', '.geojson')
            with open(filepath2, 'w') as f:
                f.write(res)
            result = geojson_to_topojson(filepath2)
        os.remove(filepath+'archive')
        os.remove(filepath2)
        [os.remove(file) for file in list_files]

    elif 'octet-stream' in datatype:
        data = data.decode()
        if '"crs"' in data and not '"urn:ogc:def:crs:OGC:1.3:CRS84"' in data:
            crs = True
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(data)
            res = ogr_to_geojson(filepath, to_latlong=True)
            print("Transform coordinates from GeoJSON")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(res)
        else:
            crs = False
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(data)

        result = geojson_to_topojson(filepath)
        if len(result) == 0 and not crs:
            result = json.dumps({'Error': 'GeoJSON layer provided without CRS'})
        os.remove(filepath)

    else:
        result = json.dumps({'Error': 'Incorrect datatype'})

    return web.Response(text=result)

@asyncio.coroutine
@aiohttp_jinja2.template('modules/test_interface.html')
def handle_app_functionality(request):
    return {"func" : request.match_info['function']}

@asyncio.coroutine
def init(loop, port=9999):
    app = web.Application(middlewares=[session_middleware(
        EncryptedCookieStorage(b'aWM\\PcrlZwfrMW^varyDtKIeMkNnkgQv'))])
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
    app.router.add_route('GET', '/', handler)
    app.router.add_route('GET', '/index', handler)
    app.router.add_route('GET', '/modules/{function}', handle_app_functionality)
    app.router.add_route('POST', '/convert_to_topojson', convert)
    app.router.add_route('POST', '/save_user_pref', user_pref)
    app.router.add_route('POST', '/cache_topojson', cache_input_topojson)
    app.router.add_static('/modules/', path='templates/modules', name='modules')
    app.router.add_static('/static/', path='static', name='static')
    app.router.add_static('/database/', path='../database', name='database')

    srv = yield from loop.create_server(
        app.make_handler(), '0.0.0.0', port)
    return srv

if __name__ == '__main__':
    if len(sys.argv) == 2:
        port = int(sys.argv[1])
    else:
        port = 9999

    app_glob = web.Application()

    app_glob['UPLOAD_FOLDER'] = 'tmp/users_uploads'
    path = os.path.dirname(os.path.realpath(__file__))
    app_glob['app_real_path'] = path[:-path[::-1].find(os.path.sep)-1]
    app_glob['keys_mapping'] = {}
    app_glob['app_users'] = set()
    loop = asyncio.get_event_loop()
    srv = loop.run_until_complete(init(loop, port))

    print(pp, 'serving on', srv.sockets[0].getsockname())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass