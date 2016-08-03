#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-
"""
@author: mthh
"""
import pytest
import ujson as json
#import subprocess
#import time
from noname_app.noname_aio import create_app
from noname_app.helpers.topo_to_geo import convert_from_topo
from noname_app.helpers.geo import check_projection
#from selenium import webdriver
pytest_plugins = 'aiohttp.pytest_plugin'


@pytest.fixture
def read_topo():
    with open("database/topojson/simplified_land_polygons.topojson", "r") as f:
        data = json.loads(f.read())
    return data


@pytest.fixture
def read_verif_topo():
    with open("tests/sample_result.topojson", "r") as f:
        verif = json.loads(f.read())
    return verif


def test_convert_from_topo(read_topo, read_verif_topo):
    assert json.loads(json.dumps(convert_from_topo(read_topo))) \
            == read_verif_topo


def test_check_proj4_string():
    assert check_projection("foobar") is False
    assert check_projection("epsg:3035") == '+init=epsg:3035'
    assert check_projection("epsg:12345") is False


@pytest.fixture
def cli(loop, test_client):
    return loop.run_until_complete(test_client(create_app))


async def test_get_pages(cli):
    resp = await cli.get('/')
    assert resp.status == 200
    content = await resp.text()
    assert "GeoPossum" in content

    resp = await cli.get('/modules')
    assert resp.status == 200
    content = await resp.text()
    assert "Add your data" in content

    resp = await cli.get('/about')
    assert resp.status == 200
    content = await resp.text()
    assert "<html>" in content


async def test_helpers(cli):
    data = {
        "var1": "[1, 2, 3, 4, 5, 6]",
        "var2": "[6, 5, 4, 3, 2, 1]",
        "operator": "+"
    }
    resp = await cli.post('/helpers/calc', data = data)
    assert resp.status == 200
    assert await resp.text() == '[7,7,7,7,7,7]'


async def test_convert_csv(cli):
    pass


async def test_convert_geo(cli):
    pass


#def launch_app():
#    p = subprocess.Popen(["noname_app", "12345", "1"],
#                         stderr=subprocess.PIPE,
#                         stdout=subprocess.PIPE)
#    return p
#
#def test_app():
#    time.sleep(1)
#    p = launch_app()
#    time.sleep(5)
#    driver = webdriver.PhantomJS(service_args=['--ignore-ssl-errors=true', '--ssl-protocol=any'])
##    driver = webdriver.PhantomJS("/home/mz/phantomjs-2.1.1-linux-x86_64/bin/phantomjs",
##                                 service_args=['--ignore-ssl-errors=true', '--ssl-protocol=any'])
#
#    driver.implicitly_wait(10)
#    driver.set_window_size(1500, 800)
#    base_url = "http://localhost:9999"
#    driver.get(base_url)
#    button = driver.find_element_by_css_selector("button.button_st3")
#    assert button
#    driver.close()
#    p.terminate()
