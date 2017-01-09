#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-
"""
@author: mthh
"""
import pytest
import ujson as json
#import subprocess
#import time
from noname_app.app import rawcsv_to_geo
from noname_app.helpers.topo_to_geo import convert_from_topo
from noname_app.helpers.geo import check_projection
#from selenium import webdriver
pytest_plugins = 'aiohttp.pytest_plugin'


@pytest.fixture
def read_topo():
    with open("noname_app/static/data_sample/simplified_land_polygons.topojson", "r") as f:
        data = json.loads(f.read())
    return data


@pytest.fixture
def read_verif_topo():
    with open("tests/sample_result.topojson", "r") as f:
        verif = json.loads(f.read())
    return verif

@pytest.fixture
def read_csv():
    with open("tests/test_xy.csv", "r") as f:
        data_csv = f.read()
    return data_csv

async def test_convert_csv(read_csv):
    res = await rawcsv_to_geo(read_csv)
    "FeatureCollection" in res

def test_convert_from_topo(read_topo, read_verif_topo):
    assert json.loads(json.dumps(convert_from_topo(read_topo))) \
            == read_verif_topo

def test_check_proj4_string():
    assert check_projection("foobar") is False
    assert check_projection("epsg:3035") == '+init=epsg:3035'
    assert check_projection("epsg:12345") is False


#@pytest.fixture
#def cli(loop, test_client):
#    return loop.run_until_complete(test_client(
#        create_app, loop, "12345", 1))
#
#
#async def test_get_pages(cli):
#    resp = await cli.get('/')
#    assert resp.status == 200
#    content = await resp.text()
#    assert "GeoPossum" in content
#
#    resp = await cli.get('/modules')
#    assert resp.status == 200
#    content = await resp.text()
#    assert "Add your data" in content
#
#    resp = await cli.get('/about')
#    assert resp.status == 200
#    content = await resp.text()
#    assert "<html>" in content
#
#
#async def test_calc_helper_int(cli):
#    data = {
#        "var1": "[1, 2, 3, 4, 5, 6]",
#        "var2": "[6, 5, 4, 3, 2, 1]",
#        "operator": "+"
#    }
#    resp = await cli.post('/helpers/calc', data=data)
#    assert resp.status == 200
#    assert await resp.text() == '[7,7,7,7,7,7]'
#
#    data = {
#        "var1": "[1, 2, 3, 4, 5, 6]",
#        "var2": "[6, 5, 4, 3, 2, 1]",
#        "operator": "^"
#    }
#    resp = await cli.post('/helpers/calc', data=data)
#    assert resp.status == 200
#    assert await resp.text() == '[1,32,81,64,25,6]'
#
#async def test_calc_helper_float(cli):
#    data = {
#        "var1": "[1.32,2.36,3.36,4.78,5.45,6.98]",
#        "var2": "[6.1,5.2,4.3,3.4,2.5,1.6]",
#        "operator": "/"
#    }
#    resp = await cli.post('/helpers/calc', data=data)
#    assert resp.status == 200
#    assert await resp.text() \
#        == '[0.2163934426,0.4538461538,0.7813953488,1.4058823529,2.18,4.3625]'
