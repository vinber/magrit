# -*- coding: utf-8 -*-
"""
@author: mz
"""
from geopandas import GeoDataFrame
from shapely.geometry import Polygon
from math import ceil
from shapely.ops import cascaded_union
import rtree


def idx_generator_func(bounds):
    for i, bound in enumerate(bounds):
        yield (i, bound, i)


def make_index(bounds):
    return rtree.index.Index([z for z in idx_generator_func(bounds)],
                             Interleaved=True)


def get_grid_layer(input_file, height, field_name, grid_shape="square",  output="GeoJSON"):
    proj4_eck4 = ("+proj=eck4 +lon_0=0 +x_0=0 +y_0=0 "
                  "+ellps=WGS84 +datum=WGS84 +units=m +no_defs")

    gdf = GeoDataFrame.from_file(input_file)
    gdf.to_crs(crs=proj4_eck4, inplace=True)
    gdf[field_name]  = gdf[field_name].astype(float)

    res_geoms = {
        "square": get_square_dens_grid,
        "diamond": get_diams_dens_grid,
        "hexagon": get_hex_dens_grid
        }[grid_shape](gdf, height, field_name)

    n_field_name = "".join([field_name, "_density"])
    grid = GeoDataFrame(
        index=range(len(res_geoms)),
        data={n_field_name: [i[1] for i in res_geoms]},
        geometry=[i[0] for i in res_geoms],
        crs=gdf.crs
        )
    grid["densitykm"] = grid[n_field_name] * 1000000

    return grid.to_crs({"init": "epsg:4326"}) \
        if output.lower() == "geodataframe" \
        else grid.to_crs({"init": "epsg:4326"}).to_json()


def get_diams_dens_grid(gdf, height, field_name):
    xmin, ymin, xmax, ymax = gdf.total_bounds
    height = height * 1.45
    rows = ceil((ymax-ymin) / height) + 1
    cols = ceil((xmax-xmin) / height) + 2

    x_left_origin = xmin - height
    y_bottom_origin = ymin - height

    half_height = (height / 2)
    geoms = gdf.geometry
    index = make_index([g.bounds for g in geoms])
    mask = cascaded_union(gdf.geometry).buffer(5).buffer(-5)
    array_values = gdf[field_name].values

    res = []
    for col in range((cols * 2) - 1):
        t = col % 2
        x1 = x_left_origin + ((col + 0) * half_height)
        x2 = x_left_origin + ((col + 1) * half_height)
        x3 = x_left_origin + ((col + 2) * half_height)
        for row in range(rows):
            y1 = y_bottom_origin + (((row * 2) + t) * half_height)
            y2 = y_bottom_origin + (((row * 2) + t + 1) * half_height)
            y3 = y_bottom_origin + (((row * 2) + t + 2) * half_height)

            p = Polygon([
                    (x1,  y2), (x2,  y1),
                    (x3,  y2), (x2,  y3), (x1,  y2)
                    ])

            idx_poly = list(index.intersection(p.bounds, objects='raw'))
            if idx_poly:
                p = p.intersection(mask)
                if p:
                    idx = geoms[idx_poly].intersects(p)
                    idx = idx[idx].index
                    areas_part = geoms[idx].intersection(p).area.values / geoms[idx].area.values
                    density = (array_values[idx] * areas_part).sum() / p.area
                    res.append((p, density))

    return res


def get_hex_dens_grid(gdf, height, field_name):
    xmin, ymin, xmax, ymax = gdf.total_bounds
    rows = ceil((ymax-ymin) / height) + 1
    cols = ceil((xmax-xmin) / height)

    x_left_origin = xmin - height
    y_bottom_origin = ymin - height

    half_height = (height / 2)
    geoms = gdf.geometry
    index = make_index([g.bounds for g in geoms])
    mask = cascaded_union(gdf.geometry).buffer(5).buffer(-5)
    array_values = gdf[field_name].values

    xvertexlo = 0.288675134594813 * height
    xvertexhi = 0.577350269189626 * height
    xspacing = xvertexlo + xvertexhi
    res = []

    for col in range((cols*2) + 1):
        x1 = x_left_origin + (col * xspacing)	# far left
        x2 = x1 + (xvertexhi - xvertexlo)	# left
        x3 = x_left_origin + ((col + 1) * xspacing)	# right
        x4 = x3 + (xvertexhi - xvertexlo)	# far right
        t = col % 2
        for row in range(rows + 1):
            y1 = y_bottom_origin + (((row * 2) + t) * half_height)	# hi
            y2 = y_bottom_origin + (((row * 2) + t + 1) * half_height)	# mid
            y3 = y_bottom_origin + (((row * 2) + t + 2) * half_height)	# lo

            p = Polygon([
                (x1, y2), (x2, y1), (x3, y1),
                (x4, y2), (x3, y3), (x2, y3), (x1, y2)
                ])

            idx_poly = list(index.intersection(p.bounds, objects='raw'))
            if idx_poly:
                p = p.intersection(mask)
                if p:
                    idx = geoms[idx_poly].intersects(p)
                    idx = idx[idx].index
                    areas_part = geoms[idx].intersection(p).area.values / geoms[idx].area.values
                    density = (array_values[idx] * areas_part).sum() / p.area
                    res.append((p, density))

    return res


def get_square_dens_grid(gdf, height, field_name):
    xmin, ymin, xmax, ymax = gdf.total_bounds
    rows = ceil((ymax-ymin) / height)
    cols = ceil((xmax-xmin) / height)

    x_left_origin = xmin
    x_right_origin = xmin + height
    y_top_origin = ymax
    y_bottom_origin = ymax - height

    geoms = gdf.geometry
    index = make_index([g.bounds for g in geoms])
    idx_intersects = index.intersection
    mask = cascaded_union(gdf.geometry).buffer(5).buffer(-5)
    array_values = gdf[field_name].values

    res = []
    for countcols in range(cols):
        y_top = y_top_origin
        y_bottom = y_bottom_origin
        for countrows in range(rows):
            p = Polygon([
                    (x_left_origin, y_top), (x_right_origin, y_top),
                    (x_right_origin, y_bottom), (x_left_origin, y_bottom)
                    ])
            idx_poly = list(idx_intersects(p.bounds, objects='raw'))
            if idx_poly:
                p = p.intersection(mask)
                if p:
                    idx = geoms[idx_poly].intersects(p)
                    idx = idx[idx].index
                    areas_part = geoms[idx].intersection(p).area.values / geoms[idx].area.values
                    density = (array_values[idx] * areas_part).sum() / p.area
                    res.append((p, density))

            y_top = y_top - height
            y_bottom = y_bottom - height
        x_left_origin = x_left_origin + height
        x_right_origin = x_right_origin + height

    return res
