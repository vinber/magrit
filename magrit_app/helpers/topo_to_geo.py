#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-
try:
    from .transform import from_topo
except:
    from magrit_app.helpers.transform import from_topo

def convert_from_topo(topojson):
    assert isinstance(topojson, dict)
    layer_name = list(topojson['objects'].keys())[0]
    result = from_topo(topojson, layer_name)
    return result
