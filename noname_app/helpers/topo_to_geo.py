# -*- coding: utf-8 -*-
from .transform import from_topo


def convert_from_topo(topojson):
    assert isinstance(topojson, dict)
    layer_name = list(topojson['objects'].keys())[0]
    result = from_topo(topojson, layer_name)
    return result
