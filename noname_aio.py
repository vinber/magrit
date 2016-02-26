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
import json
import time
import jinja2
import asyncio
import sqlite3
import aiohttp_jinja2
#import zmq.asyncio
from copy import deepcopy
from random import randint
from datetime import datetime
from aiohttp import web
import aiohttp_debugtoolbar
from aiohttp_session import get_session, session_middleware, SimpleCookieStorage
from rclient import rClient
from rpy2_executor import Rpy2_evaluator, rpy2_result
from rpy2_function import *
from rclient_load_balance import *
from wtforms import (FileField, IntegerField,
    Form, TextAreaField, validators, StringField, FloatField,
    RadioField)

app_real_path = '/home/mz/code/noname'

class g2:
    DATABASE = 'tmp/db.db'
    UPLOAD_FOLDER = 'tmp/users_uploads'
    keys_mapping = {}

def connect_db():
    conn = sqlite3.connect(g.DATABASE)
    g2.sqlite_db = conn
    return conn

def get_db():
    if not hasattr(g, 'sqlite_db'):
        g2.sqlite_db = connect_db()
    return g2.sqlite_db

def find_port():
    while True:
        port = randint(0,10000)
        if port not in g2.keys_mapping.values():
            return port

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

@asyncio.coroutine
def db_reader(request):
    table_name = request.match_info['table_name']
    trans_rule = str.maketrans('', '', '()')
    db = get_db()
    try:
        cur = db.execute('SELECT * FROM {};'.format(table_name))
        result = '<br>'.join([str(i).replace(',', '|') for i in cur.fetchall()])
    except Exception as err:
        result = str(err)
    return web.Response(body=('<div>'+result.translate(trans_rule)+'</div>').encode())

@aiohttp_jinja2.template('templates/index.html')
@asyncio.coroutine
def handler(request):
    session = yield from get_session(request)
    try:
        date = '<br><br>Last visit : {}'.format(
            datetime.fromtimestamp(
                session['last_visit']).strftime("%B %d, %Y at %H:%M:%S"))
    except Exception as err:
        date = str(err)
    session['last_visit'] = time.time()
    return {'date': date}


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

@aiohttp_jinja2.template('templates/R_form.html')
@asyncio.coroutine
def rdisplay(request):
    return {}

@asyncio.coroutine
def rdisplay_commande(request):
    rcommande = yield from request.post()
    port = find_port()
    r = rClient(port, init=True)
    message = r.rEval(rcommande['rcommande'].encode())
    r.disconnect()
    return web.Response(text=json.dumps(
        {'status':'OK - Singleton execution / No session',
         'Commande':rcommande['rcommande'],
         'Result': message.decode()}
         ), content_type='application/json')


class rdisplay_persist(web.View):
    @aiohttp_jinja2.template('templates/R_form_persist.html')
    @asyncio.coroutine
    def get(self):
        return {'key': self.request.match_info['key'], 'content': 'None'}

    @asyncio.coroutine
    def post(self):
        key = self.request.match_info['key']
        rcommande = yield from self.request.post()
        if key in g2.keys_mapping:
            port, pid = g2.keys_mapping[key]
            r = rClient(port, init=False, key=key, pid=pid)
        else:
            port = find_port()
            r = rClient(port, init=True, key=key)
            g2.keys_mapping[key] = port, r.process.pid
        print(rcommande['rcommande'])
        rcommande = rcommande['rcommande'].replace(';', '\n').splitlines()
        rcommande = ';'.join([i for i in rcommande if i])
        message = r.rEval(rcommande.replace('\r', '').encode())
        if 'Now exiting R' in message.decode():
            r.manual_disconnect()
        return web.Response(text=json.dumps({'Output': message.decode()}))

#@aiohttp_jinja2.template('templates/R_form_persist.html')
#@asyncio.coroutine
#def rdisplay_persist(request):
#    if 'GET' in request.method:
#        return {'key': request.match_info['key'],
#                'content': ''}
#
#    elif 'POST' in request.method:
#        key = request.match_info['key']
#        rcommande = yield from request.post()
#        if key in g.keys_mapping:
#            port, pid = g.keys_mapping[key]
#            r = rClient(port, init=False, key=key, pid=pid)
#        else:
#            port = find_port()
#            r = rClient(port, init=True, key=key)
#            g.keys_mapping[key] = port, r.process.pid
#        print(rcommande['rcommande'])
#        rcommande = rcommande['rcommande'].replace(';', '\n').splitlines()
#        rcommande = ';'.join([i for i in rcommande if i])
#        message = r.rEval(rcommande.replace('\r', '').encode())
#        if 'Now exiting R' in message.decode():
#            r.manual_disconnect()
#        return  {'key': request.match_info['key'],
#                'content': message}

class RstatementForm(Form):
    rcommande = TextAreaField('R commande',
                          [validators.Length(min=1, max=4000),
                           validators.DataRequired(True)],
                          default=u'R.Version()')

class R_console(web.View):
#    R_form = RstatementForm()
#    content = ''

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
            print(rcommande)
            print(g2.keys_mapping)
            key = self.request.match_info['key']
            print(key)
            if key in g2.keys_mapping:
                port, pid = g2.keys_mapping[key]
                r = rClient(port, init=False, key=key, pid=pid)
            else:
                port = find_port()
                r = rClient(port, init=True, key=key)
                g2.keys_mapping[key] = port, r.process.pid
            message = r.rEval(rcommande.replace('\r', '').encode())
            content = message.decode()
            return web.Response(text=json.dumps({'Result': content,
                                                 'Status': 'OK'}))

@aiohttp_jinja2.template('templates/R_form_persist.html')
@asyncio.coroutine
def rpy2_display_persist(request):
    context = {'key': '', 'content': ''}
    if 'GET' in request.method:
        return context

    elif 'POST' in request.method:
        rcommande = yield from request.post()
        rp = Rpy2_evaluator(rcommande['rcommande'].splitlines())
        rp.start()
        rp.join()
        context['content'] = deepcopy(rpy2_result)
        print(context['content'])
        rpy2_result.clear()
        return context

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

@asyncio.coroutine
def R_console_redirect(request):
    response = web
    return

#@asyncio.coroutine  # Currently only accepting a single file
#def upload_file():                              # ... and not a set of file (like required for uploading a Shapefile)
#    page = """
#        <!doctype html>
#        <title>Upload new File</title>
#        <h1>Upload new File</h1>
#        <form action="upload" method="post" enctype=multipart/form-data>
#          <p><input type="file" multiple="" name=file[]>
#             <input type=submit value=Upload>
#        </form>{}
#        """
#    if request.method == 'POST':
#        filenames = []
#        files_to_upload = request.files.getlist('file[]')
#        alert = validate_upload_set(files_to_upload)
#        if alert:
#            return page.format(alert)
#        for file in files_to_upload:
#            print(file, type(file))
#            if file and allowed_file(file.filename):
#                filename = secure_filename(file.filename)
#                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
#                filenames.append(filename)
#        return  web.Response(body=filename.encode())
#    else:
#        return web.Response(body=page.encode())


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
            filenames = []
            for file_ph in ('point_layer', 'mask_layer'):
                file_to_upload = self.request.POST[file_ph]
                if file_to_upload:
                    with open(os.path.join(app_real_path, g2.UPLOAD_FOLDER, file_to_upload[1]), 'wb') as f:
                        f.write(file_to_upload[2].read())
                    filenames.append(file_to_upload[1])
                else:
                    filenames.append('NULL')
            form_data = stewart_form.data
            key = find_port()
            pt_name = os.path.join(app_real_path, g2.UPLOAD_FOLDER, filenames[0])
            if filenames[1]:
                mask_name = os.path.join(app_real_path, g2.UPLOAD_FOLDER, filenames[1])
            else:
                mask_name = 'NULL'
            r_command = (
                "stewart_to_json('{}', {}, {}, '{}',"
                                "'{}', {}, {}, {}, {}, '{}')".format(
                    pt_name, 'NULL', 'NULL', form_data['var_name'],
                    form_data['type_fun'], form_data['span'], form_data['beta'],
                    form_data['resolution'], 'FALSE', mask_name)
                )
#            print(r_command)
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
#        result = mta_json.global_dev(
#            posted_data['json_df'], posted_data['var1'],
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


@asyncio.coroutine
def init_R_workers(loop):
    g2.r_process = prepare_worker(4)
    g2.context = zmq.Context()
    broker = yield from launch_broker(g2.context, g2.r_process, None)
    return broker

@asyncio.coroutine
def init(loop):
    app = web.Application(middlewares=[session_middleware(
        SimpleCookieStorage())])
    aiohttp_debugtoolbar.setup(app)
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('.'))
    app.router.add_route('GET', '/', handler)
#    app.router.add_route('GET', '/show/{table_name}', db_reader)
    app.router.add_route('*', '/Rr', rdisplay)
#    app.router.add_route('GET', '/load_entries/{table}', load_table)
    app.router.add_route('*', '/RrPersist/{key}', rdisplay_persist)
    app.router.add_route('GET', '/Rr/{pattern}', r_handler)
    app.router.add_route('*', '/Rpy2_single', rpy2_display_persist)
    app.router.add_route('POST', '/RrCommande', r_post_handler)
    app.router.add_route('GET', '/R_console', R_console_redirect)
    app.router.add_route('GET', '/R_console/', R_console_redirect)
    app.router.add_route('*', '/R_console/{key}', R_console)
#    app.router.add_route('GET', '/R/{rpy2_pattern}', rpy2_handler)
    app.router.add_route('*', '/R/wrapped/SpatialPosition/stewart', StewartPage)
    app.router.add_route('*', '/R/wrapped/MTA/globalDev', MTA_globalDev)
    app.router.add_route('*', '/R/wrapped/MTA/mediumDev', MTA_mediumDev)
    srv = yield from loop.create_server(
        app.make_handler(), '0.0.0.0', 9999)
#    rworkers = yield from loop.create_task(init_R_workers())
    return srv

if __name__ == '__main__':
    if not os.path.isdir('/tmp/feeds'):
        try:
            os.mkdir('/tmp/feeds')
        except Exception as err:
            print(err)
            sys.exit()

    if not hasattr(g2, 'context'):
        def init_R_workers():
            r_process = prepare_worker(4)
            context = zmq.Context()
            g2.context = context
            g2.broker = threading.Thread(target=launch_broker, args=(context, r_process, None))
            g2.broker.start()
        init_R_workers()
        ## Todo : find a better way to lauch the broker
        # and to initialize the R workers (using asyncio-related methods
        # instead of launching a thread)
    loop = asyncio.get_event_loop()
    srv = loop.run_until_complete(init(loop))

    print('serving on', srv.sockets[0].getsockname())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass