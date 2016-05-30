# -*- coding: utf-8 -*-
from .transform import Transformer, Transformer_no_transform

def convert_from_topo(topojson):
    assert isinstance(topojson, dict)
    layer_name = list(topojson['objects'].keys())[0]
    return from_topo(topojson, layer_name)

def from_topo(topo, obj_name):
    TYPEGEOMETRIES = (
        'LineString',
        'MultiLineString',
        'MultiPoint',
        'MultiPolygon',
        'Point',
        'Polygon',
        'GeometryCollection'
    )
    geojson = topo['objects'][obj_name]
    if not "transform" in topo:
        transformer = Transformer_no_transform(topo['arcs'])
    else:
        transformer = Transformer(topo['transform'], topo['arcs'])
    if geojson['type'] in TYPEGEOMETRIES:
        geojson = transformer.geom_dispatch(geojson)
    return geojson