# # -*- coding: utf-8 -*-
# """
# @author: mz
# """
# from osgeo import ogr, osr
# from math import ceil
# import rtree
# import numpy as np
# import os
#
# def idx_generator_func(bounds):
#     for i, bound in enumerate(bounds):
#         yield (i, bound, i)
#
#
# def make_index(bounds):
#     return rtree.index.Index([z for z in idx_generator_func(bounds)],
#                              Interleaved=False)
#
#
# def get_square_grid_layer(input_file, height, field_name, output="GeoJSON"):
#     proj4_eck4 = ("+proj=eck4 +lon_0=0 +x_0=0 +y_0=0 "
#                   "+ellps=WGS84 +datum=WGS84 +units=m +no_defs")
#
#     geojson_drv = ogr.GetDriverByName('GeoJSON')
#     mem_drv = ogr.GetDriverByName('Memory')
#
#     spref_wgs84 = osr.SpatialReference()
#     spref_wgs84.ImportFromEPSG(4326)
#
#     spref_eck4 = osr.SpatialReference()
#     spref_eck4.ImportFromProj4(proj4_eck4)
#
#     coords_transform = osr.CoordinateTransformation(spref_wgs84, spref_eck4)
#     back_transform = osr.CoordinateTransformation(spref_eck4, spref_wgs84)
#
#     f_in = geojson_drv.Open(input_file)
#     input_layer = f_in.GetLayer()
#
#     f_out = mem_drv.CreateDataSource('out')
#     output_layer = f_out.CreateLayer('temp_data', spref_eck4)
#
#     output_driver = ogr.GetDriverByName('GeoJSON')
#     if os.path.exists('/tmp/grid_layer.geojson'):
#         os.remove('/tmp/grid_layer.geojson')
#     out_grid = output_driver.CreateDataSource('/tmp/grid_layer.geojson')
#     grid_layer = out_grid.CreateLayer('grid_layer', spref_wgs84)
#
#     value_field = ogr.FieldDefn(field_name, ogr.OFTReal)
#     output_layer.CreateField(value_field)
#     output_lyr_defn = output_layer.GetLayerDefn()
#
#     dens_field_name = '_'.join([field_name, 'km'])
#     density_field1 = ogr.FieldDefn('densitykm', ogr.OFTReal)
#     grid_layer.CreateField(density_field1)
#     density_field2 = ogr.FieldDefn(dens_field_name, ogr.OFTReal)
#     grid_layer.CreateField(density_field2)
#     stock_field = ogr.FieldDefn('stock', ogr.OFTReal)
#     grid_layer.CreateField(stock_field)
#
#     grid_layer_defn = grid_layer.GetLayerDefn()
#
#     # array_values = np.ndarray(shape=(input_layer.GetFeatureCount(),))
#     bounds = []
#     for ix, inFeature in enumerate(input_layer):
#         geom = inFeature.GetGeometryRef()
#         geom.Transform(coords_transform)
#         bounds.append(geom.GetEnvelope())
#         # val = float(inFeature.GetField(field_name))
#         # array_values[ix] = val
#         outFeature = ogr.Feature(output_lyr_defn)
#         outFeature.SetGeometry(geom)
#         outFeature.SetField(field_name, float(inFeature.GetField(field_name)))
#         output_layer.CreateFeature(outFeature)
#         outFeature.Destroy()
#         inFeature.Destroy()
#     f_in.Destroy()
#
#     xmin, xmax, ymin, ymax = output_layer.GetExtent()
#     rows = ceil((ymax-ymin) / height)
#     cols = ceil((xmax-xmin) / height)
#
#     x_left_origin = xmin
#     x_right_origin = xmin + height
#     y_top_origin = ymax
#     y_bottom_origin = ymax - height
#
#     index = make_index(bounds)
#     mask = ogr.Geometry(ogr.wkbPolygon)
# #    UnionCascaded would have been faster but I can get it to work here (??)
#     for ft in output_layer:
#         mask = mask.Union(ft.GetGeometryRef())
#
#     idx_intersects = index.intersection
#
#     for countcols in range(cols):
#         y_top = y_top_origin
#         y_bottom = y_bottom_origin
#         for countrows in range(rows):
#             idx_poly = list(idx_intersects(
#                 (x_left_origin, x_right_origin, y_bottom, y_top), objects='raw'))
#             if idx_poly:
#                 poly_wkt = \
#                     "POLYGON (({} {}, {} {}, {} {}, {} {}, {} {}))".format(
#                         x_left_origin, y_top,
#                         x_right_origin, y_top,
#                         x_right_origin, y_bottom,
#                         x_left_origin, y_bottom,
#                         x_left_origin, y_top)
#                 poly = ogr.CreateGeometryFromWkt(poly_wkt)
#                 if mask.Intersects(poly):
#                     poly = mask.Intersection(poly)
#                     density_values = []
#                     for ix in idx_poly:
#                         ft = output_layer[ix]
#                         geom = ft.GetGeometryRef()
#                         if geom.Intersects(poly):
#                             rap = geom.Area() / geom.Intersection(poly).Area()
#                             density_values.append(ft.GetField(field_name) * rap)
#                         ft.Destroy()
#                     # features = [output_layer[i] for i in idx_poly]
#                     # density_values = []
#                     # for ft in features:
#                     #     geom = ft.GetGeometryRef()
#                     #     if geom.Intersects(poly):
#                     #         rap = geom.Area() / geom.Intersection(poly).Area()
#                     #         density_values.append(array_values[ft.GetFID()] * rap)
#                     if density_values:
#                         stock = sum(density_values)
#                         density = stock / poly.Area()
#                         outFeature = ogr.Feature(grid_layer_defn)
#                         poly.Transform(back_transform)
#                         outFeature.SetGeometry(poly)
#                         outFeature.SetField('densitykm', density)
#                         outFeature.SetField(dens_field_name, density * 1000000)
#                         outFeature.SetField('stock', stock)
#                         grid_layer.CreateFeature(outFeature)
#                         outFeature.Destroy()
#
#             y_top = y_top - height
#             y_bottom = y_bottom - height
#         x_left_origin = x_left_origin + height
#         x_right_origin = x_right_origin + height
#
#     f_out.Destroy()
#     out_grid.Destroy()
