# -*- coding: utf-8 -*-
"""
@author: mz
"""
import os
import sys
import ujson as json
import time
import pandas as pd
import fiona

from zipfile import ZipFile
from random import randint, choice
from datetime import datetime
from base64 import b64decode
from hashlib import sha512
import asyncio
from subprocess import Popen, PIPE

# Web related stuff :
import jinja2
import aiohttp_jinja2
from aiohttp import web, web_reqrep
from aiohttp_session import get_session, session_middleware
from aiohttp_session.cookie_storage import EncryptedCookieStorage

# Used for the page generation with jinja2 and wtforms:
from helpers.misc import guess_separator

pp = '(aiohttp_app) '

def get_key(var):
    """Find and return an available key (ie. which is not in 'var')"""
    while True:
        k = (b''.join([bytes([choice(list(range(48, 58))+list(range(97, 123)))])
                    for i in range(25)])).decode()
        if k not in var:
            return k


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


@aiohttp_jinja2.template('index2.html')
@asyncio.coroutine
def handler2(request):
    session = yield from get_session(request)
    try:
        date = 'Last visit : {}'.format(
            datetime.fromtimestamp(
                session['last_visit']).strftime("%B %d, %Y at %H:%M:%S"))
    except Exception as err:
        date = str(err)
    session['last_visit'] = time.time()
    return {'date': date}


def savefile(path, raw_data):
    # Todo : insert some data validation tests
    if '.shp' in path or '.dbf' in path or '.shx' in path:
        with open(path, 'wb') as f:
            f.write(raw_data)
    else:
        with open(path, 'w') as f:
            f.write(raw_data.decode())

def ogr_to_geojson(filepath, to_latlong=True):
    # Todo : Rewrite using asyncio.subprocess methods
#    print("Here i am with ", filepath)
    if to_latlong:
        process = Popen(["ogr2ogr", "-f", "GeoJSON", "-t_srs", "EPSG:4326",
                         "/dev/stdout", filepath], stdout=PIPE)
    else:
        process = Popen(["ogr2ogr", "-f", "GeoJSON",
                         "/dev/stdout", filepath], stdout=PIPE)
    stdout, _ = process.communicate()
    return stdout.decode()

def geojson_to_topojson(filepath):
    # Todo : Rewrite using asyncio.subprocess methods
    # Todo : Use topojson python port if possible to avoid writing a temp. file
    process = Popen(["topojson", "--spherical",
                     filepath], stdout=PIPE)
    stdout, _ = process.communicate()
    return stdout.decode()

#def topojson_to_geojson(filepath):
#    layers_name = json.parse(data)['objects'].keys()
#    layers_name = [''.join([i, '.json'] for i in layers_name)]
#    folder_name = os.path.join('/tmp', get_name())
#    os.mkdir(folder_name)
#    process = Popen(['topojson-geojson', filepath, '-o', folder_name])
#    result = []
#    for lyr in layers_name:
#        with open(os.path.join(folder_name, layers_name),
#                  'r', encoding='utf-8') as f:
#            result.append(f.read())
#    os.removedirs(folder_name)
#    return result

class UploadFile(web.View):
    """
    It accepts single files (geojson, topojson, csv, tsv, txt,
            or the 3 mandatory files for a Shapefile layer : .shp, .shx, .dbf).
    Mixing types and multi-upload (except the necessary one for Shapefile) are
    not allowed.
    """
    @aiohttp_jinja2.template('upload_srv.html')
    @asyncio.coroutine
    def get(self):
        return {'content_d': '', 'raw_result': ''}

    @aiohttp_jinja2.template('upload_srv.html')
    @asyncio.coroutine
    def post(self):
        filenames = []
        posted_data = yield from self.request.post()
        files_to_upload = posted_data.getall('file[]')
        if isinstance(files_to_upload[0], web_reqrep.FileField):
            alert = self.validate_upload_set(files_to_upload)
            if alert:
                return {'content_d': alert, 'raw_result': ''}
            for file in files_to_upload:
                if file and file[0]:
                    filename = file[1]
                    if not isinstance(file[2], str):
                        savefile(os.path.join(app_glob['app_real_path'],
                                              app_glob['UPLOAD_FOLDER'],
                                              filename), file[2].read())
                    else:
                        savefile(os.path.join(app_glob['app_real_path'],
                                              app_glob['UPLOAD_FOLDER'],
                                              filename), file[2].encode())
                    filenames.append(filename)
                else:
                    continue
        elif files_to_upload[0] == '0':  # Data are coming from the drag and drop zone
            raw_buff = b64decode(files_to_upload[2])
            try:
                loaded = json.loads(raw_buff)
                if 'type' in loaded and loaded['type'] == 'Topology':
                    ext = '.topojson'
                elif 'features' in loaded and 'type' in loaded:
                    ext = '.geojson'
                filename = 'tmp_{}{}'.format(get_name(), ext)
            finally:
                savefile(os.path.join(app_glob['app_real_path'],
                                      app_glob['UPLOAD_FOLDER'],
                                      filename), raw_buff)
                filenames.append(filename)
        if len(filenames) > 0:
            try:
                content, raw_result = self.uploaded_file_summary(filename)
            except Exception as err:
                content = 'Something wrong appened :\n{}'.format(err)
                raw_result = ''
            return {'content_d': content, 'raw_result': raw_result}
        else:
            return {'content_d': 'Unexpected error', 'raw_result': ''}

    @staticmethod
    def uploaded_file_summary(filename):
        infos, file = '', None
        raw_result = ''
        trans_rule = str.maketrans('', '', '[()]')
        try:
            basename, ext = filename.split('.')
        except ValueError:
            basename = filename
            ext = 'geojson'
        if ext in ('shp', 'dbf', 'shx'):
            filepath = os.path.join(
                app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], basename+'.shp')
            file = fiona.open(filepath)
            format_file = 'ESRI Shapefile'
            layers = basename
            nb_features = len(file)
            if 'init' in file.crs:
                crs = file.crs['init']
            else:
                crs = file.crs
            type_geom = file.schema['geometry']
            infos = repr(file.schema)
            raw_result = ogr_to_geojson(filepath)
        elif ext in 'topojson':
            filepath = os.path.join(
                app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], filename)
            file = open(filepath)
            datajs = json.loads(file.read())
            format_file = datajs['type']
            layers = [i for i in datajs['objects'].keys()]
            nb_features = \
                [len(datajs['objects'][lyr]['geometries']) for lyr in layers]
            type_geom = set.union(*[set(
                rec['type'] for rec in datajs['objects'][lyr]['geometries'])
                                    for lyr in layers])
            crs = "EPSG:4326"
            raw_result = topo_to_geo(datajs)
        elif ext in ('json', 'geojson'):
            filepath = \
                os.path.join(app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], filename)
            file = fiona.open(filepath)
            format_file = 'GeoJSON'
            layers = basename
            nb_features = len(file)
            if 'init' in file.crs:
                crs = file.crs['init']
            else:
                crs = file.crs
            type_geom = file.schema['geometry']
            with open(filepath, 'r') as f:
                raw_result = f.read()
        elif ext in ('csv', 'txt', 'tsv'):
            layers, format_file = basename, ext
            filepath = \
                os.path.join(app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], filename)
            sep = guess_separator(filepath)
            file = pd.read_csv(filepath, sep=sep)
            infos = str(file.info())
            crs, type_geom, nb_features = \
                'NA', 'NA', "{} rows x {} columns".format(*file.shape)
        if not isinstance(file, pd.DataFrame):
            try:
                file.close()
            except Exception as err: print(err)
        if file is not None:  # Because "The truth value of a DataFrame is ambiguous"
            infos = infos + """<br><b>Format:</b><br>{}<br><b>Layers:</b><br>{}
                               <br><b>Nb features:</b><br>{}
                               <br><b>Geometrie Type(s):</b><br>{}
                               <br><b>Coordinate system:</b><br>{}
                """.format(format_file, layers, nb_features, type_geom, crs)
        else:
            infos = "Something unexpected append"
        return ''.join(['<div>',
                        infos.translate(trans_rule).replace('\n', '<br>'),
                        '</div>']), raw_result

    @staticmethod
    def validate_upload_set(files_to_upload):
        alert = ""
        if len(files_to_upload) > 1 \
                and not any(['shp' in file[1] or 'dbf' in file[1]
                             for file in files_to_upload]):
            alert = """<script>
                alert("Layers have to be uploaded one by one")
                </script>"""
        elif len(files_to_upload) < 3 \
                and any(['shp' in file[1] or 'dbf' in file[1]
                         for file in files_to_upload]):
            alert = ("<script>"
                     "alert('Associated files (.dbf, .shx and .prj) have "
                     "to be provided with the Shapefile')</script>")
        elif any(['shp' in file[1] or 'dbf' in file[1]
                  for file in files_to_upload]) and \
                any(['json' in file[1] or 'csv' in file[1]
                     for file in files_to_upload]):
            alert = """<script>
                alert("Layers have to be uploaded one by one")
                </script>"""
        return alert

@asyncio.coroutine
def convert(request):
    posted_data = yield from request.post()

    try:
        datatype, name, data = posted_data.getall('file[]')
        hashed_input = sha512(data.encode()).hexdigest()

    except Exception as err:
        print("posted data :\n", posted_data)
        print("err\n", err)
        return web.Response(text=json.dumps({'Error': 'Incorrect datatype'}))

#    session_redis = yield from get_session(request)
#    if not 'app_user' in session_redis:
#        user_id = get_key(app_glob['app_users'])
#        app_glob['app_users'].add(user_id)
#        session_redis['app_user'] = user_id
#        session_redis['converted'] = {}
#        f_name = '_'.join([user_id, name])
#    else:
#        user_id = session_redis['app_user']
#        f_name = '_'.join([user_id, name])
#        if hashed_input in session_redis['converted']:
#            result = yield from app_glob['redis_conn'].get(f_name)
#            print("Used cached result")
#            return web.Response(text=result.decode())

    filepath = os.path.join(app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], name)
    if 'zip' in datatype:
        with open(filepath+'archive', 'wb') as f:
            f.write(b64decode(data))
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
#            session_redis['converted'][hashed_input] = True
#            yield from app_glob['redis_conn'].set(f_name, result)
#            session['converted'][f_name] = json.loads(result)
#            print(type(session['converted'][f_name]))
        os.remove(filepath+'archive')
        os.remove(filepath2)
        [os.remove(file) for file in list_files]

    elif 'octet-stream;base64' in datatype:
        data = b64decode(data).decode()
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
def init(loop, port=9999):
    app = web.Application(middlewares=[session_middleware(
        EncryptedCookieStorage(b'aWM\\PcrlZwfrMW^varyDtKIeMkNnkgQv'))])
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
    app.router.add_route('GET', '/', handler)
    app.router.add_route('POST', '/convert_to_topojson', convert)
    app.router.add_route('*', '/upload', UploadFile)    
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


    # The mutable mapping provided by web.Application will be used to store (safely ?)
    # some global variables :
    # Todo : create only one web.Application object instead of app + app_glob
    app_glob = web.Application()

    app_glob['UPLOAD_FOLDER'] = 'tmp/users_uploads'
    app_glob['app_real_path'] = '/home/mz/code/noname-stuff'
    app_glob['keys_mapping'] = {}
    app_glob['session_map'] = {}
    app_glob['table_map'] = {}
    app_glob['app_users'] = set()
    loop = asyncio.get_event_loop()
    srv = loop.run_until_complete(init(loop, port))

    print(pp, 'serving on', srv.sockets[0].getsockname())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass