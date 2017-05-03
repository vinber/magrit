#!/usr/bin/env python3.6
# -*- coding: utf-8 -*-
import re
import numpy as np
import ujson as json
import cchardet as chardet
from functools import partial
from osgeo.ogr import GetDriverByName, Feature as OgrFeature
from osgeo.osr import SpatialReference, CoordinateTransformation
from pyproj import transform as pyproj_transform, Proj as pyproj_Proj
from shapely.geos import TopologicalError
from shapely.geometry import shape, mapping, MultiPolygon
from shapely.ops import transform
from shapely.affinity import scale
from os.path import exists
from pandas import read_json as pd_read_json
from geopandas import GeoDataFrame
from struct import unpack
from subprocess import Popen, PIPE
from .cartogram_doug import make_cartogram


def _compute_centroids(geometries, argmax=np.argmax):
    res = []
    for geom in geometries:
        if hasattr(geom, '__len__'):
            ix_biggest = argmax([g.area for g in geom])
            res.append(geom[ix_biggest].centroid)
        else:
            res.append(geom.centroid)
    return res


def get_proj4_string(wkt_proj):
    if not wkt_proj:
        return None
    else:
        a = SpatialReference(wkt_proj)
        a.MorphFromESRI()
        res = a.ExportToProj4()
        return None if \
            '+proj=longlat +ellps=WGS84 +no_defs' in res \
            or '+proj=longlat +datum=WGS84 +no_defs' in res \
            else res


def convert_ogr_to_geojson(file_path, file_format):

    regex_field_name = re.compile("[^a-zA-Z0-9_-ëêàáâãæêéèñòóô]+")

    in_driver = GetDriverByName(file_format)
    out_driver = GetDriverByName('MEMORY')

    f_in = in_driver.Open(file_path)
    input_layer = f_in.GetLayer()

    outSpRef = SpatialReference()
    outSpRef.ImportFromEPSG(4326)
    coords_transform = CoordinateTransformation(
        input_layer.GetSpatialRef(), outSpRef)

    f_out = out_driver.CreateDataSource('')
    output_layer = f_out.CreateLayer('', outSpRef)

    input_lyr_defn = input_layer.GetLayerDefn()
    for i in range(input_lyr_defn.GetFieldCount()):
        fieldDefn = input_lyr_defn.GetFieldDefn(i)
        fieldDefn.SetName(regex_field_name.sub('_', fieldDefn.GetNameRef()))
        output_layer.CreateField(fieldDefn)

    output_lyr_defn = output_layer.GetLayerDefn()
    nb_field = output_lyr_defn.GetFieldCount()
    field_names = [output_lyr_defn.GetFieldDefn(i).GetNameRef()
                   for i in range(nb_field)]

    res = []
    for inFeature in input_layer:
        geom = inFeature.GetGeometryRef()
        geom.Transform(coords_transform)
        outFeature = OgrFeature(output_lyr_defn)
        outFeature.SetGeometry(geom)
        outFeature.SetFID(inFeature.GetFID())
        for i in range(output_lyr_defn.GetFieldCount()):
            outFeature.SetField(
                field_names[i],
                inFeature.GetField(i))
        res.append(outFeature.ExportToJson())
        outFeature.Destroy()
        inFeature.Destroy()

    f_in.Destroy()
    f_out.Destroy()

    return ''.join([
        '''{"type":"FeatureCollection","features":[''',
        ','.join(res),
        ''']}'''
        ]).encode()


def get_encoding_dbf(file_path):
    with open(file_path, 'rb') as f:
        nb_records, len_header = unpack('<xxxxLH22x', f.read(32))
        f.seek(len_header)
        encoding = chardet.detect(f.read())
    return encoding['encoding']


def ogr_to_geojson(file_path):
    if 'kml' in file_path:
        file_format = "KML"
    elif 'gml' in file_path:
        file_format = "GML"
    elif 'geojson' in file_path:
        file_format = "GeoJSON"
    elif 'shp' in file_path:
        file_format = "ESRI ShapeFile"
    else:
        return None

    if file_format == "ESRI ShapeFile" \
            and not exists(file_path.replace('.shp', '.cpg')):
        file_path_cpg = file_path.replace('.shp', '.cpg')
        encoding = get_encoding_dbf(file_path.replace('.shp', '.dbf'))

        with open(file_path_cpg, 'wb') as f:
            f.write(encoding.encode())

    elif file_format == "GeoJSON":
        with open(file_path, 'rb') as f:
            raw_content = f.read()
        encoding = chardet.detect(raw_content)
        if encoding['encoding'] is not 'UTF-8':
            content = raw_content.decode(encoding['encoding'])
            with open(file_path, 'wb') as f:
                f.write(content.encode())

    try:
        result = convert_ogr_to_geojson(file_path, file_format)
    except Exception as err:
        print(err)
        result = None
    return result

#def ogr_to_geojson(filepath):
#    res = []
#    reproject = True
#    change_field_name = True
#    with fiona.open(filepath) as f:
#        if not f.crs:
#            reproject = False
#        if not any(' ' in field_name for field_name in f.schema['properties']):
#            change_field_name = False
#
#        if reproject and change_field_name:
#            project = partial(pyproj_transform, pyproj_Proj(f.crs), pyproj_Proj({'init': 'epsg:4326'}))
#            for item in f.values():
#                item['geometry'] = mapping(transform(project, shape(item['geometry'])))
#                item['properties'] = OrderedDict(
#                    (k.replace(' ', '_'), v) for k, v in item['properties'].items())
#                res.append(item)
#        elif change_field_name:
#            for item in f.values():
#                item['properties'] = OrderedDict(
#                    (k.replace(' ', '_'), v) for k, v in item['properties'].items())
#                res.append(item)
#        elif reproject:
#            project = partial(pyproj_transform, pyproj_Proj(f.crs), pyproj_Proj({'init': 'epsg:4326'}))
#            for item in f.values():
#                item['geometry'] = mapping(transform(project, shape(item['geometry'])))
#                res.append(item)
#        else:
#            res = [item for item in f.values()]
#
#    return ''.join(
#        ('''{"type":"FeatureCollection", "features":''',
#         json.dumps(res),
#         '''}''')).encode()

def make_geojson_links(ref_layer_geojson, csv_table, field_i, field_j, field_fij, join_field):
    gdf = GeoDataFrame.from_features(ref_layer_geojson["features"])
    gdf.set_index(join_field, inplace=True, drop=False)
    gdf.geometry = _compute_centroids(gdf.geometry)
    table = pd_read_json(csv_table)
    table = \
        table[table[field_i].isin(gdf.index) & table[field_j].isin(gdf.index)]
    geoms_loc = gdf.geometry.loc
    ft_template_start = \
        '''{"type":"Feature","geometry":{"type":"LineString","coordinates":['''
    geojson_features = []
    for n, id_i, id_j, fij in table[[field_i, field_j, field_fij]].itertuples():
        pts = \
            list(geoms_loc[id_i].coords)[0] + list(geoms_loc[id_j].coords)[0]
        geojson_features.append(''.join([
                ft_template_start,
                '''[{0},{1}],[{2},{3}]'''.format(*pts),
                ''']},"properties":{"''',
                '''{0}":"{1}","{2}":"{3}","{4}":"{5}"'''
                .format(field_i, id_i, field_j, id_j, field_fij, fij),
                '''}}'''
                ])
            )

    return ''.join([
        '''{"type":"FeatureCollection","features":[''',
        ','.join(geojson_features),
        ''']}'''
        ]).encode()


def make_carto_doug(file_path, field_name, iterations):
    gdf = GeoDataFrame.from_file(file_path)
    if not gdf[field_name].dtype in (int, float):
        gdf.loc[:, field_name] = gdf[field_name].replace('', np.NaN)
        gdf.loc[:, field_name] = gdf[field_name].astype(float)
    gdf = gdf[gdf[field_name].notnull()]
    gdf = gdf.iloc[gdf[field_name].nonzero()]
    gdf.index = range(len(gdf))
    result_json = json.loads(make_cartogram(gdf.copy(), field_name, iterations))
    repairCoordsPole(result_json)
    return json.dumps(result_json).encode()


def olson_transform(geojson, scale_values):
    """
    Inplace scaling transformation of each polygon of the geojson provided
    according to the "scale values" also provided.

    Args:
        geojson, dict:
            The geojson of polygon to transform
            (it might be useful to have choosen an appropriate projection as we
            want to deal with the area)
        scale_values:
            The pre-computed scale values for olson transformation
            (1 = no transformation)
    Return:
        Nothing
    """
    if len(geojson["features"]) != len(scale_values):
        raise ValueError("Inconsistent number of features/values")
    for val, feature in zip(scale_values, geojson['features']):
        geom = shape(feature["geometry"])
        feature['properties']['ref_area'] = geom.area
        if hasattr(geom, '__len__'):
            feature["geometry"] = mapping(
                MultiPolygon([scale(g, xfact=val, yfact=val) for g in geom]))
        else:
            feature["geometry"] = mapping(scale(geom, xfact=val, yfact=val))
    geojson['features'].sort(
        key=lambda x: x['properties']['ref_area'], reverse=True)


def reproj_convert_layer_kml(geojson_path):
    process = Popen(["ogr2ogr", "-f", "KML",
                     "-preserve_fid",
                     "-t_srs", "EPSG:4326",
                     "/dev/stdout", geojson_path], stdout=PIPE)
    stdout, _ = process.communicate()
    return stdout


def reproj_convert_layer(geojson_path, output_path,
                         file_format, output_crs, input_crs="epsg:4326"):
    layer_name = output_path.split('/')
    layer_name = layer_name[len(layer_name) - 1].split('.')[0]

    in_driver = GetDriverByName("GeoJSON")
    out_driver = GetDriverByName(file_format)

    inSpRef = SpatialReference()
    inSpRef.ImportFromEPSG(int(input_crs.split("epsg:")[1]))

    outSpRef = SpatialReference()
    ret_val = outSpRef.ImportFromProj4(output_crs)
    if not ret_val == 0:
        raise ValueError("Error when importing the output crs")

    coords_transform = CoordinateTransformation(inSpRef, outSpRef)

    f_in = in_driver.Open(geojson_path)
    input_layer = f_in.GetLayer()
    f_out = out_driver.CreateDataSource(output_path)
    output_layer = f_out.CreateLayer(layer_name, outSpRef)

    input_lyr_defn = input_layer.GetLayerDefn()
    for i in range(input_lyr_defn.GetFieldCount()):
        fieldDefn = input_lyr_defn.GetFieldDefn(i)
        output_layer.CreateField(fieldDefn)

    output_lyr_defn = output_layer.GetLayerDefn()

    for inFeature in input_layer:
        geom = inFeature.GetGeometryRef()
        geom.Transform(coords_transform)
        outFeature = OgrFeature(output_lyr_defn)
        outFeature.SetGeometry(geom)
        for i in range(output_lyr_defn.GetFieldCount()):
            outFeature.SetField(output_lyr_defn.GetFieldDefn(i).GetNameRef(),
                                inFeature.GetField(i))
        output_layer.CreateFeature(outFeature)
        outFeature.Destroy()
        inFeature.Destroy()
    f_in.Destroy()
    f_out.Destroy()

    if "Shapefile" in file_format:
        outSpRef.MorphToESRI()
        with open(output_path.replace(".shp", ".prj"), 'w') as file_proj:
            file_proj.write(outSpRef.ExportToWkt())
        with open(output_path.replace(".shp", ".cpg"), "w") as encoding_file:
            encoding_file.write("UTF-8")
    return 0


def reproj_layer(geojson, output_crs, input_crs="epsg:4326"):
    reproj = partial(pyproj_transform,
                     pyproj_Proj(init=input_crs),
                     pyproj_Proj(output_crs))
    for feature in geojson["features"]:
        feature["geometry"] = mapping(transform(
            reproj, shape(feature["geometry"])))


def check_projection(proj4string):
    if not isinstance(proj4string, str):
        return False
    if proj4string[0] == '"' and proj4string[len(proj4string) - 1] == '"':
        proj4string = proj4string[1:len(proj4string) - 1]
    if "epsg:" in proj4string[:5]:
        proj4string = "".join(["+init=", proj4string])
    try:
        pyproj_Proj(proj4string)
        outSpRef = SpatialReference()
        ret_val = outSpRef.ImportFromProj4(proj4string)
        if not ret_val == 0:
            return False
        return proj4string
    except:
        return False


def on_geom(geom):
    for pts in geom:
        for pt in pts:
            if pt[0] > 179.9999:
                pt[0] = 179.9999
            elif pt[0] < -179.9999:
                pt[0] = -179.9999
            if pt[1] > 89.9999:
                pt[1] = 89.9999
            elif pt[1] < -89.9999:
                pt[1] = -89.9999


def repairCoordsPole(geojson):
    for ft in geojson['features']:
        geom = ft["geometry"]
        if "MultiPolygon" in geom["type"]:
            for poly in geom['coordinates']:
                # exterior = poly[:1]
                on_geom(poly[:1])
                if(len(poly) > 2):
                    # interiors  = poly[1:]
                    on_geom(poly[1:])
        elif "Polygon" in geom["type"]:
            # poly = geom['coordinates']
            # exterior = poly[:1]
            on_geom(geom['coordinates'][:1])
            if(len(geom['coordinates']) > 2):
                # interiors  = poly[1:]
                on_geom(geom['coordinates'][1:])


def multi_to_single(gdf, columns=None):
    values = gdf[[i for i in gdf.columns if i != 'geometry']]
    geom = gdf.geometry
    geoms, attrs = [], []

    for i in range(len(gdf)):
        try:  # if hasattr(geom, '__len__'):
            for single_geom in geom.iloc[i]:
                geoms.append(single_geom)
                attrs.append(values.iloc[i])
        except:  # else:
            geoms.append(geom.iloc[i])
            attrs.append(values.iloc[i])

    return GeoDataFrame(
        attrs,
        index=range(len(geoms)),
        geometry=geoms,
        columns=columns or [i for i in gdf.columns if i != 'geometry']
        )
