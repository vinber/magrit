#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-
"""
@author: mz
"""
import os
import sys
from uuid import uuid4
from shutil import copy
from subprocess import Popen, PIPE

def build_js_file(use_minified):
    copy('.babelrc', '../../magrit_app/static/js')
    os.chdir('../../magrit_app/static/js')

    p = Popen(['babel',
               'main.js',
               'colors_helpers.js',
               'context-menu.js',
               'discretization_panel.js',
               'discrtiz_links_discont.js',
               'function.js',
               'helpers.js',
               'helpers_calc.js',
               'interface.js',
               'join_popup.js',
               'layers_style_popup.js',
               'layout_features.js',
               'legend.js',
               'map_project.js',
               'symbols_picto.js',
               'projections.js',
               'tables.js'], stderr=PIPE, stdout=PIPE)
    r = p.communicate()
    if len(r[1]) > 0 or len(r[0]) == 0:
        print(r[1])
        sys.exit(1)

    previous_files = [i for i in os.listdir() if 'app.' in i]
    for f_path in previous_files:
        os.remove(f_path)

    _id = uuid4().hex[10:22]
    with open('app.{}.js'.format(_id), 'wb') as f:
        f.write(r[0])

    p = Popen(['uglifyjs',
           'app.{}.js'.format(_id),
           '-o',
           'app.{}.min.js'.format(_id)], stderr=PIPE, stdout=PIPE)
    r = p.communicate()
    if len(r[1]) > 0:
        print(r[1])
        sys.exit(1)

    name = 'app.{}.js'.format(_id) if not use_minified \
        else 'app.{}.min.js'.format(_id)

    with open('../../templates/modules.html', 'r') as f:
        lines = f.readlines()
    ix = [ix for ix, ln in enumerate(lines) if 'src="/static/js/app.' in ln][0]
    lines[ix] = '  \t<script  src="/static/js/{}"></script>\n'.format(name)
    with open('../../templates/modules.html', 'w') as f:
        f.writelines(lines)
    os.remove('.babelrc')
    print('OK')

if __name__ == "__main__":
    use_minified = True if len(sys.argv) > 1 and '-m' in sys.argv[1] else False
    build_js_file(use_minified)
