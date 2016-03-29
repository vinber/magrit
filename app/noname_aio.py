# -*- coding: utf-8 -*-
"""
Basicly trying to do here the same things as in the "noname.py" file but
using aiohttp framework instead of Flask
(same urls, same jinja2 templating system,
same services provided and roughly the same variable/function/etc. names)

@author: mz
"""
import os
import sys
import ujson as json
import time
import pandas as pd
import fiona
import threading

from zipfile import ZipFile
from random import randint, choice
from datetime import datetime
from base64 import b64decode
from hashlib import sha512, md5
import asyncio
import zmq.asyncio
from subprocess import Popen, PIPE

# Web related stuff :
import jinja2
import aiohttp_jinja2
from aiohttp import web, web_reqrep
import aioredis
#import aiohttp_debugtoolbar
from aiohttp_session import get_session, session_middleware, redis_storage

# Just for the R console page based on rpy2 :
from r_py.rpy2_console_client import client_Rpy_async
from r_py.rpy2_console_queue import launch_queue

# For the other actions involving R :
from r_py.rclient import rClient_async
from r_py.rclient_load_balance_auto_scale import R_client_fuw_async, url_client

# Used for the page generation with jinja2 and wtforms:
from helpers.misc import guess_separator
from helpers.forms import (
    MTA_form_global, MTA_form_medium, MTA_form_local, SpatialPos_Form,
    RstatementForm, FlowsForm)

# For testing purpose only, in order to make the topojson translation staying
# in a python environnement :
#from pytopojson import topo_to_geo

pp = '(aiohttp_app) '

def find_port():
    while True:
        port = randint(10000, 20000)
        if port not in app_glob['keys_mapping'].values():
            return port


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
def handler(request):
    return {}


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


@asyncio.coroutine
def is_known_user(request, ref):
    session = yield from get_session(request)
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

#####################################################
### Some views to make two poor R consoles
### (one using a remote R instance, the other using rpy2)
### Each user has its own session (based on session id on cookies)
### The rpy2 version is currently the only able to display the plot
### eventually requested.
#####################################################

class Rpy2_console(web.View):
    """
    Using a client written with zmq.asyncio package (but a broker using regular
    pyzmq implementation)
    """
    @aiohttp_jinja2.template('R_form_console.html')
    @asyncio.coroutine
    def get(self):
        R_form = RstatementForm()
        content = ''  # Todo : write the last content in the cookies to redisplay it ?
        return {'form': R_form, 'content': content}

    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        sess = yield from get_session(self.request)
        rcommande = posted_data['rcommande']
        if 'rpy2_session' in sess and sess['rpy2_session'] in app_glob['keys_mapping']:
            port, pid = app_glob['keys_mapping'][sess['rpy2_session']]
            cRpy = client_Rpy_async("ipc:///tmp/feeds/rpy2_clients", port,
                                    ctx=app_glob['async_ctx'],
                                    init=False, worker_pid=pid)
        else:
            key = get_key(app_glob['keys_mapping'])
            port = find_port()
            cRpy = client_Rpy_async("ipc:///tmp/feeds/rpy2_clients", port,
                                    ctx=app_glob['async_ctx'])
            app_glob['keys_mapping'][key] = port, cRpy.worker_process.pid
            sess['rpy2_session'] = key
        if rcommande == "CLOSE":
#            print('before')
            yield from cRpy.disconnect_close()
#            print('after')
            app_glob['keys_mapping'].pop(sess['rpy2_session'])
            sess.pop('rpy2_session')
            print('app_glob.keys_mapping :', app_glob['keys_mapping'])
            return web.Response(text=json.dumps(
                {'Status': 'Disconnected',
                 'Result': "Reload the page to get a new session"}))
        else:
            print('app_glob.keys_mapping :', app_glob['keys_mapping'])
            message = yield from cRpy.reval(rcommande.replace('\r', ''))
            return web.Response(text=message.decode())

class R_console(web.View):
    @aiohttp_jinja2.template('R_form_console.html')
    @asyncio.coroutine
    def get(self):
        R_form = RstatementForm()
        content = ''
        return {'form': R_form, 'content': content}

    @asyncio.coroutine
    def post(self):
        R_form = RstatementForm()
        content = ''
        if R_form.validate():
            rcommande = yield from self.request.post()
            rcommande = rcommande['rcommande']
            print(app_glob['keys_mapping'])
            sess = yield from get_session(self.request)
            if 'R_session' in sess and sess['R_session'] in app_glob['keys_mapping']:
                key = sess['R_session']
                port, pid = app_glob['keys_mapping'][key]
                r = rClient_async(port, ctx=app_glob['async_ctx'],
                                  init=False, key=key, pid=pid)
            else:
                port = find_port()
                key = get_key(app_glob['keys_mapping'])
                r = rClient_async(port, ctx=app_glob['async_ctx'],
                                  init=True, key=key)
                app_glob['keys_mapping'][key] = port, r.process.pid
                sess['R_session'] = key
            message = yield from r.rEval(rcommande.replace('\r', '').encode())
            content = message.decode()
            if "exiting R" in content:
                app_glob['keys_mapping'].pop(sess['R_session'])
                r.manual_disconnect()
                sess.pop('R_session')
                content += " - Reload the page to get a new session"
            return web.Response(text=json.dumps({'Result': content,
                                                 'Status': 'OK'}))

@asyncio.coroutine
def clear_r_session(request):
    session = yield from get_session(request)
    posted_data = yield from request.post()
    print('session : ', session, '\nposted_data : ', posted_data)
    if 'rpy2_session' in posted_data:
        app_glob['keys_mapping'].pop(session['rpy2_session'])
        session.pop('rpy2_session')
    elif 'R_session' in posted_data:
        app_glob['keys_mapping'].pop(session['R_session'])
        session.pop('R_session')
    return web.Response(text=json.dumps({'Status': 'Done'}))


##########################################################
#### A few functions to open (server side) a table or
#### ... a geo layer uploaded by the user and display
#### ... some informations.
##########################################################
#### These functions are currently totaly insecure

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

def topojson_to_geojson(filepath):
    layers_name = json.parse(data)['objects'].keys()
    layers_name = [''.join([i, '.json'] for i in layers_name)]
    folder_name = os.path.join('/tmp', get_name())
    os.mkdir(folder_name)
    process = Popen(['topojson-geojson', filepath, '-o', folder_name])
    result = []
    for lyr in layers_name:
        with open(os.path.join(folder_name, layers_name),
                  'r', encoding='utf-8') as f:
            result.append(f.read())
    os.removedirs(folder_name)
    return result

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

##########################################################
#### Quick views to wrap "flows" functionnalities :

class FlowsPage(web.View):
    @aiohttp_jinja2.template('default_page_form.html')
    @asyncio.coroutine
    def get(self):
        flows_form = FlowsForm()
        return {'form': flows_form, 'title': 'Flows page example'}

    @aiohttp_jinja2.template('default_page_form.html')
    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        id_ = yield from is_known_user(self.request, ref=app_glob['table_map'])
        flows_form = FlowsForm(posted_data)
        form_data = flows_form.data
        print(form_data)
        if not app_glob['table_map'][id_][1]:
            file_to_upload = posted_data.get('table')
            filename = 'table_' + str(abs(hash(id_)))
            real_path = \
                os.path.join(app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], filename)
            savefile(real_path, file_to_upload[2].read())
            try:
                app_glob['table_map'][id_][1] = real_path
                sep = guess_separator(real_path)
                df = pd.read_csv(real_path, sep=sep)
                headers = list(df.columns)
                print('Before : ', headers)
                if 'Unnamed: 0' in headers[0]:
                    headers = headers[1:]
                headers_fields = list(zip(headers, headers))
                suite = flows_form.next_field.append_entry()
                suite.field_i.choices = headers_fields
                suite.field_j.choices = headers_fields
                suite.field_fij.choices = headers_fields
                content = ''.join(['<div>',
                                   df.head(15).to_html().replace('\n', ''),
                                   '</div>'])
            except Exception as err:
                print(err)
                content = str(err)
            return {'form': flows_form, 'content': content,
                    'title': 'Flows page example'}
        else:
            nform = form_data['next_field'][0]
            commande = (b"prepflows_json(mat, i, j, fij, "
                        b"remove_diag, direct_stat)")
            filename = app_glob['table_map'][id_][1]
            print(pp, filename)
            data = json.dumps({
                'mat': filename,
                'i': nform['field_i'],
                'j': nform['field_j'],
                'fij': nform['field_fij'],
                'remove_diag': False,
                'direct_stat': {
                    "direct_stat": True, "output": 'none', "verbose": True}
                }).encode()
            content = yield from R_client_fuw_async(
                url_client, commande, data, app_glob['async_ctx'], id_)
            print(pp, content)
            res = json.loads(content.decode())
            summary = '<br>'.join([i for i in res])
            return {'form': flows_form,
                    'content': "<b>Summary:</b><br>" + summary,
                    'title': 'Flows page example'}

##########################################################
#### Qucik views to wrap "SpatialPosition" functionnalities :

class StewartPage(web.View):
    @aiohttp_jinja2.template('default_page_form.html')
    @asyncio.coroutine
    def get(self):
        stewart_form = SpatialPos_Form()
        return {'form': stewart_form, 'content': '',
                'title' : 'Stewart Example'}

    @aiohttp_jinja2.template('display_result.html')
    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        stewart_form = SpatialPos_Form(posted_data)
        if not stewart_form.validate():
            return web.Response(text="Invalid input fields")

        filenames = {}  # Following code is probably totally insecure to deal with user inputs :
        for file_ph in ('point_layer', 'mask_layer'):
            file_to_upload = self.request.POST[file_ph]
            if file_to_upload:
                filepath = os.path.join(
                    app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], file_to_upload[1])
                savefile(filepath, file_to_upload[2].read())
                filenames[file_ph] = filepath
            else:
                filenames[file_ph] = 'NULL'
        form_data = stewart_form.data
        id_ = yield from is_known_user(self.request, ref=app_glob['session_map'])
        commande = (b'stewart_to_json(knownpts_json, varname, typefct, span, '
                    b'beta, nclass, resolution, mask_json)')
        data = json.dumps({
            'knownpts_json': filenames['point_layer'],
            'varname': form_data['var_name'],
            'typefct': form_data['type_fun'],
            'span': form_data['span'],
            'beta': form_data['beta'],
            'nclass': form_data['nclass'],
            'resolution': form_data['resolution'],
            'mask_json': filenames['mask_layer']
            }).encode()

        content = yield from R_client_fuw_async(
            url_client, commande, data, app_glob['async_ctx'], id_)
        content = json.loads(content.decode())
        return {'content': json.dumps(content['geojson']),
                'breaks': content['breaks'],
                'title': 'Stewart Result'}

##########################################################
#### Qucik views to wrap "MTA" functionnalities :

class MTA_globalDev(web.View):
    @asyncio.coroutine
    @aiohttp_jinja2.template('MTA_dev.html')
    def get(self):
        gbd_form = MTA_form_global()
        return {'form': gbd_form, 'title': 'MTA Global Dev. Example'}

    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        # Using the prepared WTForm allow to fetch the values
        # with the good datatype :
        gbd_form = MTA_form_global(posted_data)
        if not gbd_form.validate():
            return web.Response(text="Invalid input fields")
        form_data = gbd_form.data
        commande = b'mta_globaldev(x, var1, var2, ref, type_dev)'
        data = json.dumps({
            'x': form_data['json_df'], 'var1': form_data['var1'],
            'var2': form_data['var2'], 'ref': form_data['ref'],
            'type_dev': form_data['type_fun']
            }).encode()
        id_ = yield from is_known_user(self.request, ref=app_glob['session_map'])
        content = yield from R_client_fuw_async(
            url_client, commande, data, app_glob['async_ctx'], id_)
        return web.Response(text=content.decode())

class MTA_mediumDev(web.View):
    @asyncio.coroutine
    @aiohttp_jinja2.template('MTA_dev.html')
    def get(self):
        meddev_form = MTA_form_medium()
        return {'form': meddev_form, 'title': 'MTA Medium Dev. Example'}

    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        meddev_form = MTA_form_medium(posted_data)
        if not meddev_form.validate():
            return web.Response(text="Invalid input fields")
        form_data = meddev_form.data
        commande = b'mta_mediumdev(x, var1, var2, key, type_dev)'
        data = json.dumps({
            'x': form_data['json_df'].replace('\n', '').replace('\r', ''),
            'var1': form_data['var1'], 'var2': form_data['var2'],
            'key': form_data['key'], 'type_dev': form_data['type_fun']
            }).encode()
        id_ = yield from is_known_user(self.request, ref=app_glob['session_map'])
        content = yield from R_client_fuw_async(
            url_client, commande, data, app_glob['async_ctx'], id_)
        return web.Response(text=content.decode())

class MTA_localDev(web.View):
    @asyncio.coroutine
    @aiohttp_jinja2.template('MTA_dev.html')
    def get(self):
        locdev_form = MTA_form_local()
        return {'form': locdev_form, 'title': 'MTA Local Dev. Example'}

    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        locdev_form = MTA_form_local(posted_data)
        if not locdev_form.validate():
            return web.Response(text="Invalid input fields")
        form_data = locdev_form.data
        if not form_data['distance'] and not form_data['order']:
            return web.Response(text="Invalid input fields"
                                     "(Order or Distance have to be set)")
        commande = \
            b'mta_localdev(spdf_geojs, var1, var2, order, dist, type_dev)'
        data = json.dumps({
            'spdf_geojs': form_data['geojs'],
            'var1': form_data['var1'],
            'var2': form_data['var2'],
            'order': form_data['order'],
            'dist': form_data['distance'],
            'type_dev': form_data['type_fun']}).encode()
        id_ = yield from is_known_user(self.request, ref=app_glob['session_map'])
        content = yield from R_client_fuw_async(
            url_client, commande, data, app_glob['async_ctx'], id_)
        # Todo : Convert the result to TopoJSON
        return web.Response(text=content.decode())

@asyncio.coroutine
def cache_input_topojson(request):
    posted_data = yield from request.post()
    try:
        name, data = posted_data.getall('file[]')
        hashed_input = sha512(data.encode()).hexdigest() # Todo : compute the hash on client side to avoid re-sending the data
        print('Here i am')
    except Exception as err:
        print("posted data :\n", posted_data)
        print("err\n", err)
        return web.Response(text=json.dumps({'Error': 'Incorrect datatype'}))

    session_redis = yield from get_session(request)
    if not 'app_user' in session_redis:
        user_id = get_key(app_glob['app_users'])
        app_glob['app_users'].add(user_id)
        session_redis['app_user'] = user_id
        session_redis['converted'] = {}
        f_name = '_'.join([user_id, name])
#        print('I stored the input TopojSON as GEOJSON for later computations')
#        session['converted'] = topojson_to_geojson(data)
    else:
        user_id = session_redis['app_user']
        f_name = '_'.join([user_id, name])
        if hashed_input in session_redis['converted']:
            print("The TopoJSON was already cached !")
            return web.Response()

    session_redis['converted'][hashed_input] = True
    yield from app_glob['redis_conn'].set(f_name, data)
    print('Caching the TopoJSON')
    return web.Response()

@asyncio.coroutine
def user_pref(request):
    posted_data = yield from request.post()
    session = yield from get_session(request)
    session['map_pref'] = dict(posted_data)
    return web.Response(text=json.dumps({'Info': "I don't do anything with it rigth now!"}))


def hash_md5_file(path):
    H = md5()
    with open(path, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            H.update(buf)
            buf = f.read(65536)
    return H.hexdigest()

# Todo : Create a customizable route (like /convert/{format_Input}/{format_output})
# to easily handle file types send by the front-side ?
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
        hashed_input = hash_md5_file(shp_path)
        name = shp_path.split(os.path.sep)[2]
        datatype = "shp"

    # If there is a single file (geojson or zip) to handle :
    elif "action" in posted_data and "file[]" in posted_data:
        try:
            field = posted_data.get('file[]')
            name = field[1]
            data = field[2].read()
            datatype = field[3]
            hashed_input = sha512(data).hexdigest()
            filepath = os.path.join(
                app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], name)
        except Exception as err:
            print("posted data :\n", posted_data)
            print("err\n", err)
            return web.Response(text=json.dumps({'Error': 'Incorrect datatype'}))

    session_redis = yield from get_session(request)
    if not 'app_user' in session_redis:
        user_id = get_key(app_glob['app_users'])
        app_glob['app_users'].add(user_id)
        session_redis['app_user'] = user_id
        session_redis['converted'] = {}
        f_name = '_'.join([user_id, name])
    else:
        user_id = session_redis['app_user']
        f_name = '_'.join([user_id, name])
        if hashed_input in session_redis['converted']:
            result = yield from app_glob['redis_conn'].get(f_name)
            print("Used cached result")
            return web.Response(text=result.decode())

    if "shp" in datatype:
        res = ogr_to_geojson(shp_path, to_latlong=True)
        filepath2 = '/tmp/' + name.replace('.shp', '.geojson')
        with open(filepath2, 'w') as f:
            f.write(res)
        result = geojson_to_topojson(filepath2)
        session_redis['converted'][hashed_input] = True
        yield from app_glob['redis_conn'].set(f_name, result)
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
            session_redis['converted'][hashed_input] = True
            yield from app_glob['redis_conn'].set(f_name, result)
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
        else:
            session_redis['converted'][hashed_input] = True
            yield from app_glob['redis_conn'].set(f_name, result)
        os.remove(filepath)

    else:
        result = json.dumps({'Error': 'Incorrect datatype'})

    return web.Response(text=result)

class R_commande(web.View):
    @asyncio.coroutine
    def get(self):
        function = self.request.match_info['function']
        params = self.request.match_info['params']
        data = dict([(_.split('=')[0], try_float(_.split('=')[1])) for _ in params.split('&')])
        commande = ''.join(
            [function,
             '(',
             ','.join(['='.join([param,param]) for param in data]),
             ')']
            ).encode()
        id_ = yield from is_known_user(
            self.request, ref=app_glob['session_map'])
        data = json.dumps(data).encode()
        content = yield from R_client_fuw_async(
            url_client, commande, data, app_glob['async_ctx'], id_)
        return web.Response(text=content.decode())

    def post(self):
        function = self.request.match_info['function']
        params = yield from self.request.post()
        commande = ''.join([
            function,
            '(',
            ','.join(['='.join([param,param]) for param in params]),
            ')']).encode()
        data = {k:try_float(v) for k,v in params.items()}
        id_ = yield from is_known_user(self.request, ref=app_glob['session_map'])
        data = json.dumps(data).encode()
        content = yield from R_client_fuw_async(
            url_client, commande, data, app_glob['async_ctx'], id_)
        return web.Response(text=content.decode())

def try_float(val):
    try:
        return float(val)
    except ValueError:
        return val

@asyncio.coroutine
@aiohttp_jinja2.template('modules/test_interface.html')
def handle_app_functionality(request):
    return {"func" : request.match_info['function']}


@asyncio.coroutine
def init(loop, port=9999):
    # Todo : 
    # - Use server-side cookie storage with redis
    # - Store client map parameters (preference, zoom, legend, etc.) on demand
    redis_cookie = yield from aioredis.create_pool(('localhost', 6379), db=0, maxsize=500)
    redis_conn = yield from aioredis.create_reconnecting_redis(('localhost', 6379), db=1)
    storage = redis_storage.RedisStorage(redis_cookie)
    app = web.Application(middlewares=[session_middleware(storage)])
#    aiohttp_debugtoolbar.setup(app)
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
    app.router.add_route('GET', '/', handler)
    app.router.add_route('GET', '/index', handler)
    app.router.add_route('GET', '/index2', handler2)
    app.router.add_route('GET', '/modules/{function}', handle_app_functionality)
    app.router.add_route('*', '/upload', UploadFile)
    app.router.add_route('GET', '/R/{function}/{params}', R_commande)
    app.router.add_route('POST', '/R/{function}', R_commande)
    app.router.add_route('*', '/R_console', R_console)
    app.router.add_route('*', '/R_console/', R_console)
    app.router.add_route('*', '/Rpy2_console', Rpy2_console)
    app.router.add_route('*', '/Rpy2_console/', Rpy2_console)
    app.router.add_route('POST', '/clear_R_session', clear_r_session)
    app.router.add_route('POST', '/convert_to_topojson', convert)
    app.router.add_route('POST', '/cache_topojson', cache_input_topojson)
    app.router.add_route('POST', '/save_user_pref', user_pref)
    app.router.add_route('*', '/R/wrapped/flows/int', FlowsPage)
    app.router.add_route('*', '/R/wrapped/SpatialPosition/stewart', StewartPage)
    app.router.add_route('*', '/R/wrapped/MTA/globalDev', MTA_globalDev)
    app.router.add_route('*', '/R/wrapped/MTA/mediumDev', MTA_mediumDev)
    app.router.add_route('*', '/R/wrapped/MTA/localDev', MTA_localDev)
#    app.router.add_static('/modules/', path='templates/modules', name='modules')
    app.router.add_static('/static/', path='static', name='static')
    app.router.add_static('/database/', path='../database', name='database')

    srv = yield from loop.create_server(
        app.make_handler(), '0.0.0.0', port)
    return srv, redis_conn

if __name__ == '__main__':
    if not os.path.isdir('/tmp/feeds'):
        try:
            os.mkdir('/tmp/feeds')
        except Exception as err:
            print(err)
            sys.exit()

    if len(sys.argv) == 2:
        port = int(sys.argv[1])
        nb_r_workers = '2'
    elif len(sys.argv) == 3:
        port = int(sys.argv[1])
        nb_r_workers = sys.argv[2]
        if not nb_r_workers.isnumeric():
            sys.exit()
    else:
        port = 9999
        nb_r_workers = '2'

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

    def init_Rpy2_console_broker():  # Todo : Idem (or use asyncio run_in_executor or something like thaht)
        app_glob['thread_q'] = threading.Thread(
            target=launch_queue, args=("ipc:///tmp/feeds/rpy2_clients", ))
        app_glob['thread_q'].start()
    # Todo : refactor this ugly launcher of the broker (and refactor the broker itself!)
    init_Rpy2_console_broker()

    # In order to get an async zmq context object for the clients without using the zmq event loop:
    zmq.asyncio.install()
    app_glob['async_ctx'] = zmq.asyncio.Context(3) # It will be use to launch the rClient_async object
    # Some other global objects to hold various informations
    # (Aimed to be remplaced by something better)
    app_glob['UPLOAD_FOLDER'] = 'tmp/users_uploads'
    path = os.path.dirname(os.path.realpath(__file__))
    app_glob['app_real_path'] = path[:-path[::-1].find(os.path.sep)-1]
    app_glob['keys_mapping'] = {}
    app_glob['session_map'] = {}
    app_glob['table_map'] = {}
    app_glob['app_users'] = set()
    loop = asyncio.get_event_loop()
    srv, redis_conn = loop.run_until_complete(init(loop, port))
    app_glob['redis_conn'] = redis_conn

    print(pp, 'serving on', srv.sockets[0].getsockname())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass