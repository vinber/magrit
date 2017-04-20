#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import aionotify
import sys
import logging
from subprocess import Popen, PIPE
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger("magrit_app.watch_change")

files_to_watch = [
    'helpers.js',
    'projection_others.js',
    'helpers_calc.js',
    'discrtiz_links_discont.js',
    'layers_style_popup.js',
    'legend.js',
    'layout_features.js',
    'zoom_rect.js',
    'function.js',
    'colors_helpers.js',
    'symbols_picto.js',
    'discretization_panel.js',
    'projections.js',
    'interface.js',
    'main.js',
    'tables.js',
    'context-menu.js',
    'text_import_wizard.js',
    'join_popup.js',
    'map_project.js'
    ]

class JsFileWatcher:
    def __init__(self, files_to_watch=files_to_watch, loop=None, base='static/js/'):
        self.loop = loop or asyncio.get_event_loop()
        watcher = aionotify.Watcher()
        for file in files_to_watch:
            watcher.watch(alias='modif' + file, path=base+file, flags=aionotify.Flags.MODIFY)
        self.watcher = watcher
        self.tp = ThreadPoolExecutor(2)
        asyncio.ensure_future(self.run(), loop=self.loop)
        if not self.loop.is_running():
            try:
                self.loop.run_forever()
            except KeyboardInterrupt:
                pass
            finally:
                self.watcher.close()
                self.loop.stop()
                self.loop.close()

    async def run(self):
        def onchange(event):
            nonlocal working
            working = True
            logger.info('Building JS file ...')
            p = Popen([sys.executable, '../misc/jsbuild/build.py'], stdout=PIPE, stderr=PIPE)
            p.communicate()
            logger.info('Done')
            working = False
            return
        working = False
        await self.watcher.setup(self.loop)
        while True:
            event = await self.watcher.get_event()
            if not working:
                asyncio.ensure_future(self.loop.run_in_executor(self.tp, onchange, event))
            else:
                logger.info('Busy...')
