# -*- coding: utf-8 -*-
"""
@author: mthh
"""
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from aiohttp import web
from noname_app import noname_aio

class MyAppTestCase(AioHTTPTestCase):

    def get_app(self, loop):
        """
        override the get_app method to return
        your application.
        """
        app = noname_aio._init(loop=loop)
        return app

    @unittest_run_loop
    async def test_example(self):
        request = await self.client.request("GET", "/")
        assert request.status == 200
        text = await request.text()
        assert "GeoPossum" in text
