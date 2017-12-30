# -*- coding: utf-8 -*-
try:
    from .transform import from_topo
except:
    from magrit_app.helpers.transform import from_topo

def convert_from_topo(topojson):
    """
    Convert a TopoJSON layer to a GeoJSON FeatureCollection.

    Parameters
    ----------
    topojson: dict
        The TopoJSON (loaded as a python dict) to be converted. Should only
        contain one layer, as only the first one will be converted to GeoJSON.

    Returns
    -------
    geojson: dict
        The resulting GeoJSON FeatureCollection (loaded as a python dict).
    """
    # assert isinstance(topojson, dict)
    layer_name = list(topojson['objects'].keys())[0]
    return from_topo(topojson, layer_name)
