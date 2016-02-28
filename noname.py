# -*- coding: utf-8 -*-
"""
@author: mz
"""
import os
import sys
#import sqlite3
import fiona
import pandas as pd
import ujson as json

from random import randint
from datetime import datetime
#from contextlib import closing

#Todo : Some clean-up in the import + use Session and cookies
from flask import (
    Flask, request, session, g, redirect, url_for,
    abort, render_template, send_from_directory, Response)
from werkzeug import secure_filename
from wtforms import (FloatField, FieldList, Form, FormField, IntegerField, RadioField,
    SelectField, StringField, TextAreaField, validators)
from flask_wtf.file import FileAllowed, FileRequired, FileField
from rclient import rClient
from rclient_load_balance import *
from rpy2_console_client import client_Rpy
from rpy2_console_queue import launch_queue
from rpy2_function import *

app_real_path = '/home/mz/code/noname'

UPLOAD_FOLDER = 'tmp/users_uploads'
EXPORT_FOLDER = 'tmp/exp'
MAX_CONTENT_LENGTH = 4 * 1024 ** 2
ALLOWED_EXTENSIONS = set(['csv', 'geojson', 'topojson', 'txt', 'tsv',
                          'shp', 'dbf', 'shx', 'prj', 'cpg', 'json'])
#DATABASE = 'tmp/db.db'
DEBUG = True

class g2:
    keys_mapping = {}

app = Flask("noname")
app.config.from_object("noname")
app.secret_key = b'\x17|\xc8$>\\\x146\xafp\x1c!\xd19\x14LZ\xf2\xf7\x83:\x92\x8f\x03'

@app.before_request
def before_request():
    if not hasattr(g2, 'broker'):
        init_R_workers()
    if not hasattr(g2, 'thread_q'):
        init_Rpy2_console_broker()
#    g.db = connect_db()

@app.teardown_request
def teardown_request(exception):
    pass
#    db = getattr(g, 'db', None)
#    if db is not None:
#        db.close()
#

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


#####################################################
#####################################################
### Some functions to allow to execute R statements
### ... in a basic form or directly in the url
### ... with or without persistence

@app.route('/Rr/<pattern>')
def Rrapp(pattern):
    if len(g2.keys_mapping) > 100:
        return '<html><b>Too many sessions/users ....</b><html>'.encode()
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
        custom_message = '<br><br>Stand_alone session!'
    message = r.rEval(pattern.encode())
    message = '<html>'+str(message).replace('\n','<br>')+custom_message+'</html>'
    if not key:
        r.disconnect()
    return message.encode()

@app.route('/Rr', methods=['GET'])
def Rrapp_prez():
    if request.method == 'GET':
        return render_template('R_form.html')

@app.route('/RrCommande', methods=['POST'])
def Rrapp_prez_commande():
    rcommande = request.form['rcommande'];
    port = find_port()
    r = rClient(port, init=True)
    message = r.rEval(rcommande.encode())
    r.disconnect()
    return json.dumps({'status': 'OK - One shot R session / No session',
                       'Commande': rcommande,
                       'Result': message.decode().replace('\n', '<br>')})

#####################################################
### Some views to make two poor R consoles
### (one using a remote R instance, the other using rpy2)
### Each user has its own session (based on session id on cookies)
### The rpy2 version is currently the only able to display the plot
### eventually requested.
#####################################################

class RstatementForm(Form):
    rcommande = TextAreaField('R console',
                          [validators.Length(min=1, max=4000),
                           validators.DataRequired(True)],
                          default=u'R.Version()')


@app.route('/R_console')
@app.route('/R_console/', methods=['GET', 'POST'])
def R_console():
    R_form = RstatementForm(request.form)
    if request.method == 'POST' and R_form.validate():
        rcommande = R_form['rcommande'].data
        print(rcommande)
        print('g2.keys_mapping :', g2.keys_mapping, '\nsession : ', session)
        if 'R_session' in session and session['R_session'] in g2.keys_mapping:
            key = session['R_session']
            port, pid = g2.keys_mapping[key]
            r = rClient(port, init=False, key=key, pid=pid)
        else:
            port = find_port()
            key = get_key()
            r = rClient(port, init=True, key=key)
            g2.keys_mapping[key] = port, r.process.pid
            session['R_session'] = key
            print('g2.keys_mapping :', g2.keys_mapping)
        message = r.rEval(rcommande.replace('\r', '').encode())
        content = message.decode()
        if "exiting R" in content:
            g2.keys_mapping.pop(session['R_session'])
            r.manual_disconnect()
            session.pop('R_session')
            content += " - Reload the page to get a new session"
        return json.dumps({'Result': content, 'Status': 'OK'})

    if request.method == 'GET':
        if len(g2.keys_mapping) > 100:
            return '<html><b>Too many sessions/users ....</b><html>'.encode()
        else:
            return render_template('R_form_persist2.html',
                                   form=R_form)


@app.route('/Rpy2_console')
@app.route('/Rpy2_console/', methods=['GET', 'POST'])
def rpy2_console():
    R_form = RstatementForm(request.form)
    content = ''
    if request.method == 'POST' and R_form.validate():
        rcommande = R_form['rcommande'].data
        print(rcommande)
        print('g2.keys_mapping :', g2.keys_mapping, '\nsession : ', session)
        if 'rpy2_session' in session and session['rpy2_session'] in g2.keys_mapping:
            key = session['rpy2_session']
            port, pid = g2.keys_mapping[key]
            cRpy = client_Rpy("ipc:///tmp/feeds/rpy2_clients", port, init=False, worker_pid=pid)
        else:
            port = find_port()
            key = get_key()
            cRpy = client_Rpy("ipc:///tmp/feeds/rpy2_clients", port)
            g2.keys_mapping[key] = port, cRpy.worker_process.pid
            session['rpy2_session'] = key
        if rcommande == "CLOSE":
            print('before')
            cRpy.disconnect_close()
            print('after')
            g2.keys_mapping.pop(session['rpy2_session'])
            session.pop('rpy2_session')
            print('g2.keys_mapping :', g2.keys_mapping, '\nsession : ', session)
            return json.dumps({'Status': 'Disconnected', 'Result': ''})
        else:
            print('g2.keys_mapping :', g2.keys_mapping)
            message = cRpy.reval(rcommande.replace('\r', ''))
            return message

    if request.method == 'GET':
        if len(g2.keys_mapping) > 100:
            return '<html><b>Too many sessions/users ....</b><html>'.encode()
        else:
            return render_template('R_form_persist2.html',
                                   form=R_form,
                                   content=content)


@app.route('/clear_R_session', methods=['POST'])
def clear_r_session():
    posted_data = request.data
    print('session : ', session, '\nposted_data : ', posted_data)
    if 'rpy2_session' in request.data:
        g2.keys_mapping.pop(session['rpy2_session'])
        session.pop('rpy2_session')
    elif 'R_session' in request.data:
        g2.keys_mapping.pop(session['R_session'])
        session.pop('R_session')
    return json.dumps({'Status': 'Done'})

#####################################################
#####################################################

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    date = ''
    if 'last_visit' in session:
        date = 'Last visit : {}'.format(
            datetime.fromtimestamp(
                session['last_visit']).strftime("%B %d, %Y at %H:%M:%S"))
    session['last_visit'] = time.time()
    return render_template('index.html', date = date)

@app.route('/d3_nico/<path:path>')
def d3(path):
    return send_from_directory('d3_nico', path)

@app.route('/database/<path:path>')
def serve_data(path):
    return send_from_directory('database', path)

@app.route('/static/<path:path>') # Serve all static files 
def serve_static(path):
    return send_from_directory('static', path)

##########################################################
#### A few function to open (server side) a table or
#### ... a geo layer uploaded by the user and display
#### ... some informations.
##########################################################

@app.route('/summary/<filename>')
def uploaded_file_summary(filename):
    infos = ''
    trans_rule = str.maketrans('', '', '[()]')
    basename, ext = filename.split('.')
    if ext in ('shp', 'dbf', 'shx'):
        file = fiona.open(''.join([app.config['UPLOAD_FOLDER'],  os.path.sep,
                                   basename, '.shp']))
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
        file = open(''.join([app.config['UPLOAD_FOLDER'], os.path.sep,
                                   basename, '.', ext]))
        datajs = json.loads(file.read())
        format_file = datajs['type']
        layers = [i for i in datajs['objects'].keys()]
        nb_features = [len(datajs['objects'][lyr]['geometries']) for lyr in layers]
        type_geom = set.union(*[set(
             rec['type'] for rec in datajs['objects'][lyr]['geometries'])
            for lyr in layers])
    elif ext in ('json', 'geojson'):
        file = fiona.open(''.join([app.config['UPLOAD_FOLDER'], os.path.sep,
                                   basename, '.', ext]))
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
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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
    return '<html><body><div>'+infos.translate(trans_rule).replace('\n','<br>')+'</div></body></html>'


def validate_upload_set(files_to_upload):
    alert = ""
    if len(files_to_upload) > 1 \
            and not any(['shp' in file.filename or 'dbf' in file.filename for file in files_to_upload]):
        alert = """<script>
            alert("Layers have to be uploaded one by one")
            </script>"""
    elif len(files_to_upload) < 3 \
            and any(['shp' in file.filename or 'dbf' in file.filename for file in files_to_upload]):
        alert = """<script>
            alert("Associated files (.dbf and .shx) have to be provided with the Shapefile")
            </script>"""
    elif any(['shp' in file.filename or 'dbf' in file.filename for file in files_to_upload]) \
            and any(['json' in file.filename or 'csv' in file.filename for file in files_to_upload]):
        alert = """<script>
            alert("Layers have to be uploaded one by one")
            </script>"""
    return alert

@app.route('/upload', methods=['GET', 'POST']) 
def upload_file():
    """
    It accepts single files (geojson, topojson, csv, tsv, txt,
            or the 3 mandatory files for a Shapefile layer : .shp, .shx, .dbf).
    Mixing types and multi-upload (except the necessary one for Shapefile) are
    not allowed.
    """
    page = """
        <!doctype html>
        <title>Upload new File</title>
        <h1>Upload new File</h1>
        <form action="upload" method="post" enctype=multipart/form-data>
          <p><input type="file" multiple="" name=file[]>
             <input type=submit value=Upload>
        </form>{}
        """
    if request.method == 'POST':
        filenames = []
        files_to_upload = request.files.getlist('file[]')
        alert = validate_upload_set(files_to_upload)
        if alert:
            return page.format(alert)
        for file in files_to_upload:
            print(file, type(file), allowed_file(file.filename))
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                filenames.append(filename)
            else:
                continue
        if len(filenames) > 0:
            return redirect(url_for('uploaded_file_summary', filename=filename))
        else:
            return page.format(alert)
    else:
        return page.format('')

##########################################################
#### Qucik views to wrap "flows" functionnalities :

class FlowsAnalysisForm(Form):
#    colname = SelectField('Column names....')
    field_i = SelectField(choices=[])
    field_j = SelectField(choices=[])
    field_fij = SelectField(choices=[])

class FlowsForm(Form):
    table = FileField('', [FileAllowed(['csv', 'xls', 'tsv', 'txt'], 'JSON Geoms only!')])
    next_field = FieldList(FormField(FlowsAnalysisForm), '')

@app.route('/R/wrapped/flows/int', methods=['GET', 'POST'])
def flows_int():    
    flows_form = FlowsForm(request.form)
    if request.method == 'POST' and flows_form.validate():
        file = request.files['table']
        print(file.filename)
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        try:
            sep = guess_separator(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            df = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], filename), sep=sep)
            headers = list(df.columns)
            if 'Unnamed: 0' in headers[0]:
                headers = headers[1:]
            headers_fields = list(zip(headers, headers))
            suite = flows_form.next_field.append_entry()
            suite.field_i.choices = headers_fields
            suite.field_j.choices = headers_fields
            suite.field_fij.choices = headers_fields
            content = '<div>' + df.to_html().replace('\n', '') + '</div>'
        except Exception as err:
            print(err)
            content = str(err)
        return render_template("flows_int.html",
                               form = flows_form,
                               content = content)
    else:
        return render_template("flows_int.html", form = flows_form)

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

@app.route('/R/wrapped/SpatialPosition/stewart', methods=['GET', 'POST'])
def stewart_page():
    # Todo : try to build a rpy2 class holding the main utility function 
    # in order to compute in one call the values requested
    # and communicate via a ZMQ socket with them :
    stewart_form = StewartForm(request.form)
    if request.method == 'POST' and stewart_form.validate():
        filenames = []
        for file_ph in ('point_layer', 'mask_layer'):
            file = request.files[file_ph]
            if file:
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                filenames.append(filename)
                print(filename)
            else:
                filenames.append('NULL')
        form_data = stewart_form.data
        key = get_key()
        pt_name = os.path.join(app_real_path, app.config['UPLOAD_FOLDER'], request.files['point_layer'].filename)
        if request.files['mask_layer'].filename:
            mask_name = os.path.join(app_real_path, app.config['UPLOAD_FOLDER'], request.files['mask_layer'].filename)
        else: mask_name = 'NULL'
        r_command = (
            "stewart_to_json('{}', {}, {}, '{}',"
                            "'{}', {}, {}, {}, {}, '{}')".format(
                pt_name, 'NULL', 'NULL', form_data['var_name'],
                form_data['type_fun'], form_data['span'], form_data['beta'],
                form_data['resolution'], 'FALSE', mask_name)
            )
        print(r_command)
        content = R_client_return(url_client, r_command, g2.context, key)
        return render_template('display_result.html', content=content)
    return render_template('stewart.html', form=stewart_form)

##########################################################
#### Qucik views to wrap "MTA" functionnalities :

class MTA_form_global(Form):
    json_df = TextAreaField('The jsonified data.frame')
    var1 = StringField('First variable name')
    var2 = StringField('Second variable name')
    ref = FloatField('The reference ratio (optionnal)')
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')])

@app.route('/R/wrapped/MTA/globalDev', methods=['GET', 'POST'])
def MTA_globalDev():
    gbd_form = MTA_form(request.form)
    if request.method == 'POST':
        form_data = gbd_form.data
        return mta_json.global_dev(
            form_data['json_df'], form_data['var1'],
            form_data['var2'], form_data['ref'], form_data['type_fun'])

    else:
        return render_template('MTA_dev.html', form=gbd_form,
                               title='MTA Global Dev. Example')

class MTA_form_medium(Form):
    json_df = TextAreaField('The jsonified data.frame')
    var1 = StringField('First variable name')
    var2 = StringField('Second variable name')
    key = FloatField('Name of the column containg the aggregation key')
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')])

@app.route('/R/wrapped/MTA/mediumDev', methods=['GET', 'POST'])
def MTA_mediumDev():
    meddev_form = MTA_form_medium(request.form)
    if request.method == 'POST':
        form_data = meddev_form.data
        return mta_json.global_dev(
            form_data['json_df'], form_data['var1'],
            form_data['var2'], form_data['key'], form_data['type_fun'])

    else:
        return render_template('MTA_dev.html', form=meddev_form,
                               title='MTA Medium Dev. Example')


class MTA_form_local(Form):
    geojs = TextAreaField('GeoJSON layer with data attributes')
    var1 = StringField('First variable name')
    var2 = StringField('Second variable name')
    order = FloatField('Contiguity order (optionnal)')
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')])


@app.route('/R/wrapped/MTA/localDev', methods=['GET', 'POST'])
def MTA_localDev():
    locdev_form = MTA_form_local(request.form)
    if request.method == 'POST':
        form_data = locdev_form.data
        result = mta_json.local_dev(
            form_data['geojs'], var1=form_data['var1'],
            var2=form_data['var2'], order=form_data['order'], type=form_data['type_fun'])
        return result
    else:
        return render_template('MTA_dev.html', form=locdev_form,
                               title= 'MTA Medium Dev. Example')
    

@app.route('/display/<content>')
def display_result(content):
    return render_template('display_result.html', content=content)

if __name__ == '__main__':
    def init_R_workers():
        r_process = prepare_worker(4)
        context = zmq.Context()
        g2.context = context
        g2.broker = threading.Thread(target=launch_broker, args=(context, r_process, None))
        g2.broker.start()

    def init_Rpy2_console_broker():
        g2.thread_q = threading.Thread(target=launch_queue, args=("ipc:///tmp/feeds/rpy2_clients", ))
        g2.thread_q.start()

    init_R_workers()
    init_Rpy2_console_broker()

    if len(sys.argv) > 1:
        port = sys.argv[1]
    else:
        port = 7979
    app.run(debug=True, port=port, host='0.0.0.0')

#def connect_db():
#    conn = sqlite3.connect(app.config['DATABASE'])
#    return conn
#
#def init_db():
#    with closing(connect_db()) as db:
#        with app.open_resource('schema.sql', mode='r') as f:
#            db.cursor().executescript(f.read())
#        db.commit()

#def get_db():
#    if not hasattr(g, 'sqlite_db'):
#        g.sqlite_db = connect_db()
#    return g.sqlite_db

#@app.route('/load_entries/<table>')
#def load_table(table):
#    try:
#        table = table.split('\\n')
#        db = get_db()
#        for line in table:
#            db.execute('INSERT INTO entries (a, b, c, d) values (?, ?, ?, ?)', 
#                       tuple(map(float, line.split(','))))
#        db.commit()
#        content = "Data successfully loaded"
#    except Exception as err:
#        content = err
#    return content

#@app.route('/show/<table_name>')
#def show_table(table_name):
#    trans_rule = str.maketrans('', '', '()')
#    db = get_db()
#    try:
#        cur = db.execute('SELECT * FROM {};'.format(table_name))
#        result = '<br>'.join([str(i).replace(',', '|') for i in cur.fetchall()])
#    except Exception as err:
#        result = err
#    return '<html><body><div>'+result.translate(trans_rule)+'</div></body></html>'

#def export(filename):
#    if 'shp' in filename[-5:]:
#        # Doing something for packing (ziping)
#        # the 3/4 mandatory files (shp, shx, dbf + prj)
#        basename = filename[:-4]
#        filename = basename + '.zip'
#        zipf = zipfile.ZipFile(
#            '{}/{}.zip'.format(app.config['UPLOAD_FOLDER'], basename), 'w')
#        zip_batch_files('tmp', basename, zipf)
#        zipf.close()
#        return send_from_directory(app.config['UPLOAD_FOLDER'],
#                               "{}.zip".format(basename))
#    else:
#        return send_from_directory(app.config['UPLOAD_FOLDER'],
#                                   filename)
#
#def zip_batch_files(path, name, ziph):
#    # ziph is zipfile handle
#    for root, dirs, files in os.walk(path):
#        for file in files:
#            if name in file:
#                ziph.write(os.path.join(root, file))

#@app.route('/RrPersist/<key>', methods=['GET', 'POST'])
#def Rapp_prez_persist(key):
#    content = ''
#    if request.method == 'POST':
#        rcommande = request.form['rcommande'];
#        referer = request.headers['Referer']
#        key = referer[referer.find('key')+4:]
#        if key in g2.keys_mapping:
#            port, pid = g2.keys_mapping[key]
#            r = rClient(port, init=False, key=key, pid=pid)
#        else:
#            port = find_port()
#            r = rClient(port, init=True, key=key)
#            g2.keys_mapping[key] = port, r.process.pid
#        message = r.rEval(rcommande.replace('\r', '').encode())
#        content = message.decode()
#        return render_template('R_form_persist.html',
#                                   key=key, content=content)
#
#    if request.method == 'GET':
#        if len(g2.keys_mapping) > 100:
#            return '<html><b>Too many sessions/users ....</b><html>'.encode()
#        else:
#            return render_template('R_form_persist.html',
#                                   key=key, content=content)
