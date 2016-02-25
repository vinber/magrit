# -*- coding: utf-8 -*-
"""
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
from wtforms import Form, TextAreaField, validators

def url_for(endpoint, filename, **kwargs):
    namesp = {}

class g2:
    DATABASE = 'tmp/db.db'
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

#@asyncio.coroutine
#def rpy2_handler(request):
#    pattern = request.match_info['rpy2_pattern']
#    port = "5555"
#    context = zmq.Context()
#    socket = context.socket(zmq.REQ)
#    socket.connect("tcp://localhost:%s" % port)
#    socket.send(pattern.encode())
#    message = socket.recv()
#    message = str(message).replace('\n', '<br>')
#    return web.Response(body=message.encode())


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

@aiohttp_jinja2.template('index.html')
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
    R_form = RstatementForm()
    content = ''

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
            return web.Response(text=json.dumps({'Result': content}))

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

@asyncio.coroutine
def load_table(request):
    try:
        table = request.match_info['table']
        table = table.split('\\n')
        db = get_db()
        for line in table:
            db.execute('INSERT INTO entries (a, b, c, d) values (?, ?, ?, ?)', 
                       tuple(map(float, line.split(','))))
        db.commit()
        content = "Data successfully loaded"
    except Exception as err:
        content = str(err)
    return web.Response(text=content)

@aiohttp_jinja2.template('templates/zmq_websocket.html')
@asyncio.coroutine
def zmq_testpage():
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

@asyncio.coroutine
def init(loop):
    app = web.Application(middlewares=[session_middleware(
        SimpleCookieStorage())])
    aiohttp_debugtoolbar.setup(app)
    aiohttp_jinja2.setup(app,
        loader=jinja2.FileSystemLoader('.'))
    app.router.add_route('GET', '/', handler)
    app.router.add_route('GET', '/show/{table_name}', db_reader)
    app.router.add_route('GET', '/zmq_testpage', zmq_testpage)
    app.router.add_route('*', '/Rr', rdisplay)
    app.router.add_route('GET', '/load_entries/{table}', load_table)
    app.router.add_route('*', '/RrPersist/{key}', rdisplay_persist)
    app.router.add_route('GET', '/Rr/{pattern}', r_handler)
    app.router.add_route('*', '/Rpy2_single', rpy2_display_persist)
    app.router.add_route('POST', '/RrCommande', r_post_handler)
    app.router.add_route('*', '/R_console/{key}', R_console)
#    app.router.add_route('GET', '/R/{rpy2_pattern}', rpy2_handler)
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
    loop = asyncio.get_event_loop()
    srv = loop.run_until_complete(init(loop))
    print('serving on', srv.sockets[0].getsockname())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass