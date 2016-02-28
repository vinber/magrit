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
import fiona
#import sqlite3
from random import randint
from datetime import datetime

import asyncio
import zmq.asyncio

import jinja2
import aiohttp_jinja2
from aiohttp import web
import aiohttp_debugtoolbar
from aiohttp_session import get_session, session_middleware  #, SimpleCookieStorage
from aiohttp_session.cookie_storage import EncryptedCookieStorage

# TODO : some clean-up in the R and rpy2 clients used
from rclient import rClient_async
from rpy2_function import *
from rpy2_console_client import client_Rpy_async
from rpy2_console_queue import launch_queue
from rclient_load_balance import *
from wtforms import (
    FileField, IntegerField, SelectField, FieldList,
    Form, TextAreaField, validators, StringField, FloatField,
    RadioField, FormField)


class g2:
    DATABASE = 'tmp/db.db'
    UPLOAD_FOLDER = 'tmp/users_uploads'
    app_real_path = '/home/mz/code/noname'
    keys_mapping = {}

def find_port():
    while True:
        port = randint(10000, 20000)
        if port not in g2.keys_mapping.values():
            return port

def get_key():
    while True:
        k = ''.join([bytes([randint(65,122)]).decode() for _ in range(25)])
        if k not in g2.keys_mapping:
            return k

@aiohttp_jinja2.template('templates/index.html')
@asyncio.coroutine
def handler(request):
    session = yield from get_session(request)
    try:
        date = 'Last visit : {}'.format(
            datetime.fromtimestamp(
                session['last_visit']).strftime("%B %d, %Y at %H:%M:%S"))
    except Exception as err:
        date = str(err)
    session['last_visit'] = time.time()
    return {'date': date}

#####################################################
#####################################################
### Some functions to allow to execute R statements
### ... in a basic form or directly in the url
### ... with or without persistence

@asyncio.coroutine
def r_handler(request):
    pattern = request.match_info['pattern']
    if len(g2.keys_mapping) > 1500:
        return web.Response(
            body='<html><b>Too many sessions/users ....</b><html>'.encode())
    if 'key' in pattern:
        key, pattern = pattern[4:].split('&')
        if key in g2.keys_mapping:
            port, pid = g2.keys_mapping[key]
            r = rClient(port, init=False, key=key, pid=pid)
            custom_message = '<br><br>Current session :  {}'.format(key)
        else:
            port = find_port()
            r = rClient(port, init=True, key=key)
            g2.keys_mapping[key] = port, r.process.pid
            custom_message = '<br><br>New keyed session :  {}'.format(key)
    else:
        key = None
        port = find_port()
        r = rClient(port, init=True)
        custom_message = '<br><br>One shot R session!'
    message = r.rEval(pattern.encode())
    message = ''.join(['<html><body>',
                       str(message).replace('\n', '<br>'),
                       custom_message,
                       '</body></html>'])
    if not key:
        r.disconnect()
    return web.Response(body=message.encode())

@aiohttp_jinja2.template('templates/R_form.html')
@asyncio.coroutine
def rdisplay(request):
    return {}

@asyncio.coroutine
def r_post_handler(request):
    rcommande = yield from request.post()
    port = find_port()
    r = rClient(port, init=True)
    message = r.rEval(rcommande['rcommande'].encode())
    r.disconnect()
    return web.json_response({'status':'OK - Stand-alone session without persistence',
                              'Commande':rcommande['rcommande'],
                              'Result': message.decode()})


#####################################################
### Some views to make two poor R consoles
### (one using a remote R instance, the other using rpy2)
### Each user has its own session (based on session id on cookies)
### The rpy2 version is currently the only able to display the plot
### eventually requested.
#####################################################

class RstatementForm(Form):
    rcommande = TextAreaField('R commande',
                          [validators.Length(min=1, max=4000),
                           validators.DataRequired(True)],
                          default=u'R.Version()')


class Rpy2_console(web.View):
    """
    Using a client written with zmq.asyncio package (but a boker using regular
    pyzmq implementation)
    """
    @aiohttp_jinja2.template('templates/R_form_persist2.html')
    @asyncio.coroutine
    def get(self):
        R_form = RstatementForm()
        content = ''  # Todo : write the last content in the cookies to redisplay it ?
        return {'form': R_form, 'content': content}

    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        session = yield from get_session(self.request)
        rcommande = posted_data['rcommande']
#        print('g2.keys_mapping :', g2.keys_mapping)
        if 'rpy2_session' in session and session['rpy2_session'] in g2.keys_mapping:
            port, pid = g2.keys_mapping[session['rpy2_session']]
            cRpy = client_Rpy_async("ipc:///tmp/feeds/rpy2_clients", port,
                                    ctx=g2.async_ctx, init=False, worker_pid=pid)
        else:
            key = get_key()
            port = find_port()
            cRpy = client_Rpy_async("ipc:///tmp/feeds/rpy2_clients", port,
                                    ctx=g2.async_ctx)
            g2.keys_mapping[key] = port, cRpy.worker_process.pid
            session['rpy2_session'] = key
        if rcommande == "CLOSE":
            print('before')
            yield from cRpy.disconnect_close()
            print('after')
            g2.keys_mapping.pop(session['rpy2_session'])
            session.pop('rpy2_session')
            print('g2.keys_mapping :', g2.keys_mapping)
            return web.Response(text=json.dumps(
                {'Status': 'Disconnected', 'Result': ''}))
        else:
            print('g2.keys_mapping :', g2.keys_mapping)
            message = yield from cRpy.reval(rcommande.replace('\r', ''))
            return web.Response(text=message.decode())

class R_console(web.View):
    @aiohttp_jinja2.template('templates/R_form_persist2.html')
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
            print(g2.keys_mapping)
            session = yield from get_session(self.request)
            if 'R_session' in session and session['R_session'] in g2.keys_mapping:
                key = session['R_session']
                port, pid = g2.keys_mapping[key]
                r = rClient_async(port, ctx=g2.async_ctx, init=False, key=key, pid=pid)
            else:
                port = find_port()
                key = get_key()
                r = rClient_async(port, ctx=g2.async_ctx, init=True, key=key)
                g2.keys_mapping[key] = port, r.process.pid
                session['R_session'] = key
            message = yield from r.rEval(rcommande.replace('\r', '').encode())
            content = message.decode()
            if "exiting R" in content:
                g2.keys_mapping.pop(session['R_session'])
                r.manual_disconnect()
                session.pop('R_session')
                content += " - Reload the page to get a new session"
            return web.Response(text=json.dumps({'Result': content,
                                                 'Status': 'OK'}))

def clear_r_session(request):
    session = yield from get_session(request)
    posted_data = yield from request.post()
    print('session : ', session, '\nposted_data : ', posted_data)
    if 'rpy2_session' in posted_data:
        g2.keys_mapping.pop(session['rpy2_session'])
        session.pop('rpy2_session')
    elif 'R_session' in posted_data:
        g2.keys_mapping.pop(session['R_session'])
        session.pop('R_session')
    return web.Response(text=json.dumps({'Status': 'Done'}))


##########################################################
#### A few functions to open (server side) a table or
#### ... a geo layer uploaded by the user and display
#### ... some informations.
##########################################################

def savefile(path, raw_data):
    with open(path, 'wb') as f:
        f.write(raw_data)

class UploadFile(web.View):
    """
    It accepts single files (geojson, topojson, csv, tsv, txt,
            or the 3 mandatory files for a Shapefile layer : .shp, .shx, .dbf).
    Mixing types and multi-upload (except the necessary one for Shapefile) are
    not allowed.
    """
    page = """
            <title>Upload new File</title>
            <h1>Upload new File</h1>
            <form action="upload" method="post" enctype=multipart/form-data>
              <p><input type="file" multiple="" name=file[]>
                 <input type=submit value=Upload>
            </form>{}
            """
    @asyncio.coroutine
    def get(self):
        return web.Response(body=self.page.format('').encode())

    @asyncio.coroutine
    def post(self):
        filenames = []
        posted_data = yield from self.request.post()
        print(posted_data)
        files_to_upload = posted_data.getall('file[]')
        alert = self.validate_upload_set(files_to_upload)
        if alert:
            return web.Response(body=self.page.format(alert).encode())
        for file in files_to_upload:
            if file:
                filename = file[1]
                savefile(os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, filename), file[2].read())
                filenames.append(filename)
            else:
                continue
        if len(filenames) > 0:
            content = self.uploaded_file_summary(filename)
            return web.Response(body=content.encode())
        else:
            return web.Response(body=self.page.format(alert).encode())

    @staticmethod
    def uploaded_file_summary(filename):
        infos, file = '', None
        trans_rule = str.maketrans('', '', '[()]')
        basename, ext = filename.split('.')
        if ext in ('shp', 'dbf', 'shx'):
            file = fiona.open(os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, basename+'.shp'))
            format_file = 'ESRI Shapefile'
            layers = basename
            nb_features = len(file)
            if 'init' in file.crs:
                crs = file.crs['init']
            else:
                crs = file.crs
            type_geom = file.schema['geometry']
            infos = repr(file.schema)
        elif ext in ('topojson'):
            file = open(os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, filename))
            datajs = json.loads(file.read())
            format_file = datajs['type']
            layers = [i for i in datajs['objects'].keys()]
            nb_features = [len(datajs['objects'][lyr]['geometries']) for lyr in layers]
            type_geom = set.union(*[set(
                 rec['type'] for rec in datajs['objects'][lyr]['geometries'])
                for lyr in layers])
            crs = "EPSG:4326"
        elif ext in ('json', 'geojson'):
            file = fiona.open(os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, filename))
            format_file = 'GeoJSON'
            layers = basename
            nb_features = len(file)
            if 'init' in file.crs:
                crs = file.crs['init']
            else:
                crs = file.crs
            type_geom = file.schema['geometry']
        elif ext in ('csv', 'txt', 'tsv'):
            layers, format_file = basename, ext
            filepath = os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, filename)
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
        return '<div>'+infos.translate(trans_rule).replace('\n', '<br>')+'</div>'

    @staticmethod
    def validate_upload_set(files_to_upload):
        alert = ""
        if len(files_to_upload) > 1 \
                and not any(['shp' in file[1] or 'dbf' in file[1] for file in files_to_upload]):
            alert = """<script>
                alert("Layers have to be uploaded one by one")
                </script>"""
        elif len(files_to_upload) < 3 \
                and any(['shp' in file[1] or 'dbf' in file[1] for file in files_to_upload]):
            alert = """<script>
                alert("Associated files (.dbf and .shx) have to be provided with the Shapefile")
                </script>"""
        elif any(['shp' in file[1] or 'dbf' in file[1] for file in files_to_upload]) \
                and any(['json' in file[1] or 'csv' in file[1] for file in files_to_upload]):
            alert = """<script>
                alert("Layers have to be uploaded one by one")
                </script>"""
        return alert

##########################################################
#### Qucik views to wrap "flows" functionnalities :


class FlowsAnalysisForm(Form):
#    colname = SelectField('Column names....')
    field_i = SelectField('Flows origins (i) :', choices=[])
    field_j = SelectField('Flows destinations (i) :', choices=[])
    field_fij = SelectField('Flow intensity (Fij) :', choices=[])


class FlowsForm(Form):
    table = FileField('JSON representation of the table...')
    next_field = FieldList(FormField(FlowsAnalysisForm),
                           'Columns to use for later analysis')


class FlowsPage(web.View):
    @aiohttp_jinja2.template('templates/flows_int.html')
    @asyncio.coroutine
    def get(self):
        flows_form = FlowsForm()
        return {'form': flows_form}

    @aiohttp_jinja2.template('templates/flows_int.html')
    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        flows_form = FlowsForm(posted_data)
        file_to_upload = posted_data.get('table')
        filename = file_to_upload[1]
        savefile(filename, file_to_upload[2].read())
        try:
            real_path = os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, filename)
            sep = guess_separator(real_path)
            df = pd.read_csv(real_path, sep=sep)
            headers = list(df.columns)
            if 'Unnamed: 0' in headers[0]:
                headers = headers[1:]
            headers_fields = list(zip(headers, headers))
            suite = flows_form.next_field.append_entry()
            suite.field_i.choices = headers_fields
            suite.field_j.choices = headers_fields
            suite.field_fij.choices = headers_fields
            content = '<div>' + df.head(15).to_html().replace('\n', '') + '</div>'
        except Exception as err:
            print(err)
            content = str(err)
        return {'form': flows_form, 'content': content}

##########################################################
#### Qucik views to wrap "SpatialPosition" functionnalities :

class StewartForm(Form):
    point_layer = FileField('Observation point layer')
                            #,[FileAllowed(['geojson', 'topojson'], 'JSON Geoms only!')])
    mask_layer = FileField('Mask (contour) layer')
    #, [FileAllowed(['geojson', 'topojson'], 'JSON Geoms only!')])
    var_name = StringField('Variable name')
    span = IntegerField('Span (meter)',  [validators.NumberRange(min=0, max=100000)])
    beta = IntegerField('Beta', [validators.NumberRange(min=0, max=5)])
    type_fun = RadioField(choices=[('exponential', 'Exponential'), ('pareto', 'Pareto')])
    resolution = IntegerField('Resolution (meter)',  [validators.NumberRange(min=0, max=100000)])


class StewartPage(web.View):
    @aiohttp_jinja2.template('templates/stewart.html')
    @asyncio.coroutine
    def get(self):
        stewart_form = StewartForm()
        return {'form': stewart_form, 'content': ''}

    @aiohttp_jinja2.template('templates/display_result.html')
    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        stewart_form = StewartForm(posted_data)
        if stewart_form.validate():
            filenames = []  # Following code is probably totally insecure to deal with user inputs :
            for file_ph in ('point_layer', 'mask_layer'):
                file_to_upload = self.request.POST[file_ph]
                if file_to_upload:
                    savefile(os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, file_to_upload[1]), file_to_upload[2].read())
                    filenames.append(file_to_upload[1])
                else:
                    filenames.append('NULL')
            form_data = stewart_form.data
            key = find_port()
            pt_name = os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, filenames[0])
            if filenames[1]:
                mask_name = os.path.join(g2.app_real_path, g2.UPLOAD_FOLDER, filenames[1])
            else:
                mask_name = 'NULL'
            r_command = (
                "stewart_to_json('{}', {}, {}, '{}', '{}', {}, {}, {}, {}, '{}')"
                .format(pt_name, 'NULL', 'NULL', form_data['var_name'],
                        form_data['type_fun'], form_data['span'],
                        form_data['beta'], form_data['resolution'],
                        'FALSE', mask_name))

            content = R_client_return(url_client, r_command, g2.context, key)
            print('content : ', content)
        return {'content': content}

##########################################################
#### Qucik views to wrap "MTA" functionnalities :

class MTA_form_global(Form):
    json_df = TextAreaField('The jsonified data.frame')
    var1 = StringField('First variable name')
    var2 = StringField('Second variable name')
    ref = FloatField('The reference ratio (optionnal)')
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')])

class MTA_globalDev(web.View):
    @asyncio.coroutine
    @aiohttp_jinja2.template('templates/MTA_dev.html')
    def get(self):
        gbd_form = MTA_form_global()
        return {'form': gbd_form, 'title': 'MTA Global Dev. Example'}

    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        gbd_form = MTA_form_global(posted_data) # Using the prepared WTForm allow to fetch the value with the good datatype
        form_data = gbd_form.data
        result = mta_json.global_dev(
            form_data['json_df'], form_data['var1'],
            form_data['var2'], form_data['ref'], form_data['type_fun'])
        return web.Response(text=result)
#        result = mta_json.global_dev(posted_data['json_df'], posted_data['var1'],
#            posted_data['var2'], posted_data['ref'], posted_data['type_fun'])
#        return web.Response(text=result)

class MTA_form_medium(Form):
    json_df = TextAreaField('The jsonified data.frame')
    var1 = StringField('First variable name')
    var2 = StringField('Second variable name')
    key = FloatField('Name of the column containg the aggregation key')
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')])

class MTA_mediumDev(web.View):
    @asyncio.coroutine
    @aiohttp_jinja2.template('templates/MTA_dev.html')
    def get(self):
        meddev_form = MTA_form_medium()
        return {'form': meddev_form, 'title': 'MTA Medium Dev. Example'}

    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        meddev_form = MTA_form_medium(posted_data)
        form_data = meddev_form.data
        result = mta_json.global_dev(
            form_data['json_df'], form_data['var1'],
            form_data['var2'], form_data['key'], form_data['type_fun'])
        return web.Response(text=result)

class MTA_form_local(Form):
    geojs = TextAreaField('GeoJSON layer with data attributes')
    var1 = StringField('First variable name')
    var2 = StringField('Second variable name')
    order = FloatField('Contiguity order (optionnal)')
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')])

class MTA_localDev(web.View):
    @asyncio.coroutine
    @aiohttp_jinja2.template('templates/MTA_dev.html')
    def get(self):
        locdev_form = MTA_form_local()
        return {'form': locdev_form, 'title': 'MTA Medium Dev. Example'}

    @asyncio.coroutine
    def post(self):
        posted_data = yield from self.request.post()
        locdev_form = MTA_form_local(posted_data)
        form_data = locdev_form.data
        result = mta_json.local_dev(
            form_data['geojs'], var1=form_data['var1'],
            var2=form_data['var2'], order=form_data['order'], type=form_data['type_fun'])
        return web.Response(text=result)
    
@asyncio.coroutine
def init(loop):
    app = web.Application(middlewares=[session_middleware(
        EncryptedCookieStorage(b'aWM\\PcrlZwfrMW^varyDtKIeMkNnkgQv'))])
    aiohttp_debugtoolbar.setup(app)
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('.'))
    app.router.add_route('GET', '/', handler)
    app.router.add_route('*', '/upload', UploadFile)
    app.router.add_route('*', '/Rr', rdisplay)
    app.router.add_route('GET', '/Rr/{pattern}', r_handler)
    app.router.add_route('POST', '/RrCommande', r_post_handler)
    app.router.add_route('*', '/R_console', R_console)
    app.router.add_route('*', '/R_console/', R_console)
    app.router.add_route('*', '/Rpy2_console', Rpy2_console)
    app.router.add_route('*', '/Rpy2_console/', Rpy2_console)
    app.router.add_route('POST', '/clear_R_session', clear_r_session)
    app.router.add_route('*', '/R/wrapped/flows/int', FlowsPage)
    app.router.add_route('*', '/R/wrapped/SpatialPosition/stewart', StewartPage)
    app.router.add_route('*', '/R/wrapped/MTA/globalDev', MTA_globalDev)
    app.router.add_route('*', '/R/wrapped/MTA/mediumDev', MTA_mediumDev)
    srv = yield from loop.create_server(
        app.make_handler(), '0.0.0.0', 9999)
    return srv

if __name__ == '__main__':
    if not os.path.isdir('/tmp/feeds'):
        try:
            os.mkdir('/tmp/feeds')
        except Exception as err:
            print(err)
            sys.exit()

    if not hasattr(g2, 'context'):
        def init_R_workers(nb_workers):
            r_process = prepare_worker(nb_workers)
            context = zmq.Context()
            g2.context = context
            g2.broker = threading.Thread(target=launch_broker, args=(g2.context, r_process, None))
            g2.broker.start()
        ## Todo : find a better way to lauch the broker (and rewrite it using zmq.asyncio)
        # and to initialize the R workers (using asyncio-related methods
        # instead of launching a thread)
        init_R_workers(2)

    if not hasattr(g2, 'thread_q'):
        def init_Rpy2_console_broker():
            g2.thread_q = threading.Thread(target=launch_queue, args=("ipc:///tmp/feeds/rpy2_clients", ))
            g2.thread_q.start()
        # Todo : refactor this ugly launcher of the broker (and refactor the broker itself!)
        init_Rpy2_console_broker()

    # In order to get an async zmq context object without using the zmq event loop:
    zmq.asyncio.install()
    g2.async_ctx = zmq.asyncio.Context(2) # It will be use to launch the rClient_async object

    loop = asyncio.get_event_loop()
    srv = loop.run_until_complete(init(loop))

    print('serving on', srv.sockets[0].getsockname())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass

#def connect_db():
#    conn = sqlite3.connect(g.DATABASE)
#    g2.sqlite_db = conn
#    return conn
#
#def get_db():
#    if not hasattr(g, 'sqlite_db'):
#        g2.sqlite_db = connect_db()
#    return g2.sqlite_db
#
#@asyncio.coroutine
#def db_reader(request):
#    table_name = request.match_info['table_name']
#    trans_rule = str.maketrans('', '', '()')
#    db = get_db()
#    try:
#        cur = db.execute('SELECT * FROM {};'.format(table_name))
#        result = '<br>'.join([str(i).replace(',', '|') for i in cur.fetchall()])
#    except Exception as err:
#        result = str(err)
#    return web.Response(body=('<div>'+result.translate(trans_rule)+'</div>').encode())
#
#@asyncio.coroutine
#def load_table(request):
#    try:
#        table = request.match_info['table']
#        table = table.split('\\n')
#        db = get_db()
#        for line in table:
#            db.execute('INSERT INTO entries (a, b, c, d) values (?, ?, ?, ?)', 
#                       tuple(map(float, line.split(','))))
#        db.commit()
#        content = "Data successfully loaded"
#    except Exception as err:
#        content = str(err)
#    return web.Response(text=content)

#class rdisplay_persist(web.View):
#    @aiohttp_jinja2.template('templates/R_form_persist.html')
#    @asyncio.coroutine
#    def get(self):
#        return {'key': self.request.match_info['key'], 'content': 'None'}
#
#    @asyncio.coroutine
#    def post(self):
#        key = self.request.match_info['key']
#        rcommande = yield from self.request.post()
#        if key in g2.keys_mapping:
#            port, pid = g2.keys_mapping[key]
#            r = rClient(port, init=False, key=key, pid=pid)
#        else:
#            port = find_port()
#            r = rClient(port, init=True, key=key)
#            g2.keys_mapping[key] = port, r.process.pid
#        print(rcommande['rcommande'])
#        rcommande = rcommande['rcommande'].replace(';', '\n').splitlines()
#        rcommande = ';'.join([i for i in rcommande if i])
#        message = r.rEval(rcommande.replace('\r', '').encode())
#        if 'Now exiting R' in message.decode():
#            r.manual_disconnect()
#        return web.Response(text=json.dumps({'Output': message.decode()}))

#@asyncio.coroutine
#def rdisplay_commande(request):
#    rcommande = yield from request.post()
#    port = find_port()
#    r = rClient(port, init=True)
#    message = r.rEval(rcommande['rcommande'].encode())
#    r.disconnect()
#    return web.Response(text=json.dumps(
#        {'status':'OK - Singleton execution / No session',
#         'Commande':rcommande['rcommande'],
#         'Result': message.decode()}
#         ), content_type='application/json')