# -*- coding: utf-8 -*-
"""
@author: mz
"""
from geopandas import GeoDataFrame, GeoSeries
from shapely.geometry import Polygon
from math import ceil
from shapely.ops import cascaded_union
from shapely import speedups
import rtree
import numpy as np
import ujson as json
from .geo import repairCoordsPole, TopologicalError, multi_to_single


def idx_generator_func(bounds):
    for i, bound in enumerate(bounds):
        yield (i, bound, i)


def make_index(bounds):
    return rtree.index.Index([z for z in idx_generator_func(bounds)],
                             Interleaved=True)


def to_float(v):
    try:
        return float(v)
    except:
        return np.NaN


def get_grid_layer_pt(input_file, height, field_name,
                      grid_shape="square", mask_layer=None, func='density'):
    if speedups.available and not speedups.enabled:
        speedups.enable()
    proj_robinson = (
            "+proj=robin +lon_0=0 +x_0=0 +y_0=0 "
            "+ellps=WGS84 +datum=WGS84 +units=m +no_defs")
    gdf = GeoDataFrame.from_file(input_file)

    if not gdf[field_name].dtype in (int, float):
        # gdf.loc[:, field_name] = gdf[field_name].replace('', np.NaN)
        # gdf.loc[:, field_name] = gdf[field_name].astype(float)
        gdf.loc[:, field_name] = gdf[field_name].apply(to_float)
    gdf = gdf[gdf[field_name].notnull()]
    gdf = gdf[gdf.geometry.notnull()]
    gdf = gdf[~gdf.geometry.is_empty]
    gdf.index = range(len(gdf))

    if mask_layer:
        _mask = GeoDataFrame.from_file(mask_layer)

        mask = GeoSeries(
            cascaded_union(_mask.geometry.buffer(0)),
            crs=_mask.crs,
            ).to_crs(crs=proj_robinson).values[0]

        try:
            mask = mask.buffer(1).buffer(-1)
        except TopologicalError:
            mask = mask.buffer(0)
    else:
        mask = None

    gdf.to_crs(crs=proj_robinson, inplace=True)

    res_geoms = {
        "square": get_square_dens_grid2_pt,
        # "square2": get_square_dens_grid,
        "diamond": get_diams_dens_grid2_pt,
        # "diamond2": get_diams_dens_grid,
        "hexagon": get_hex_dens_grid2_pt,
        # "hexagon2": get_hex_dens_grid
        }[grid_shape](gdf, height, field_name, mask, func)

    grid = GeoDataFrame(
        index=range(len(res_geoms)),
        data={'id': [i for i in range(len(res_geoms))],
              func: [i[1] for i in res_geoms]},
        geometry=[i[0] for i in res_geoms],
        crs=gdf.crs
        )
    if mask:
        grid.geometry = grid.geometry.intersection(mask)
        grid = grid[~grid.geometry.is_empty]

    grid = grid.to_crs({"init": "epsg:4326"})

    total_bounds = gdf.total_bounds
    if total_bounds[0] < -179.9999 or total_bounds[1] < -89.9999 \
            or total_bounds[2] > 179.9999 or total_bounds[3] > 89.9999:
        result = json.loads(grid.to_json())
        repairCoordsPole(result)
        return json.dumps(result)
    else:
        return grid.to_json()

        
def get_diams_dens_grid2_pt(gdf, height, field_name, mask, func):
    xmin, ymin, xmax, ymax = mask.bounds
    height = height * 1.45
    half_height = height / 2
    if mask:
        xmin, ymin, xmax, ymax = mask.total_bounds
    else:
        xmin, ymin, xmax, ymax = gdf.total_bounds
        xmin = xmin - (xmax - xmin) / 8
        xmax = xmax + (xmax - xmin) / 8
        ymin = ymin - (ymax - ymin) / 8
        ymax = ymax + (ymax - ymin) / 8

    rows = ceil((ymax-ymin) / height) + 1
    cols = ceil((xmax-xmin) / height) + 2

    x_left_origin = xmin

    y_bottom_origin = ymax - height

    gdf = multi_to_single(gdf)
    geoms = gdf.geometry
    index = make_index([g.buffer(0.1).bounds for g in geoms])
    idx_intersects = index.intersection
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

            value = 0
            cell = Polygon([
                        (x1,  y2), (x2,  y1),
                        (x3,  y2), (x2,  y3), (x1,  y2)
                        ])
            idx_pts = list(idx_intersects(
                (x1, y1, x3, y3), objects='raw'))
            if idx_pts:
                idx = geoms[idx_pts].intersects(cell).index
                if func == 'mean':
                    value = np.mean(array_values[idx])
                elif func == 'density':
                    value = np.sum(array_values[idx]) / cell.area
            res.append((cell, value))

    return res

def get_hex_dens_grid2_pt(gdf, height, field_name, mask, func):
    if mask:
        xmin, ymin, xmax, ymax = mask.bounds
    else:
        xmin, ymin, xmax, ymax = gdf.total_bounds
        xmin = xmin - (xmax - xmin) / 8
        xmax = xmax + (xmax - xmin) / 8
        ymin = ymin - (ymax - ymin) / 8
        ymax = ymax + (ymax - ymin) / 8

    rows = ceil((ymax-ymin) / height) + 1
    cols = ceil((xmax-xmin) / height)
    half_height = height / 2
    x_left_origin = xmin
    y_bottom_origin = ymax - height

    gdf = multi_to_single(gdf)
    geoms = gdf.geometry
    index = make_index([g.buffer(0.1).bounds for g in geoms])
    idx_intersects = index.intersection
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

            value = 0
            cell = Polygon([
                    (x1, y2), (x2, y1), (x3, y1),
                    (x4, y2), (x3, y3), (x2, y3), (x1, y2)
                    ])
            idx_pts = list(idx_intersects(
                (x1, y1, x4, y3), objects='raw'))
            if idx_pts:
                idx = geoms[idx_pts].intersects(cell).index
#                    intersected_geoms = geoms[idx]
                if func == 'mean':
                    value = np.mean(array_values[idx])
                elif func == 'density':
                    value = np.sum(array_values[idx]) / cell.area
            res.append((cell, value))

    return res


def get_square_dens_grid2_pt(gdf, height, field_name, mask, func):
    if mask:
        xmin, ymin, xmax, ymax = mask.bounds
    else:
        xmin, ymin, xmax, ymax = gdf.total_bounds
        xmin = xmin - (xmax - xmin) / 8
        xmax = xmax + (xmax - xmin) / 8
        ymin = ymin - (ymax - ymin) / 8
        ymax = ymax + (ymax - ymin) / 8

    rows = ceil((ymax-ymin) / height)
    cols = ceil((xmax-xmin) / height)

    x_left_origin = xmin
    x_right_origin = xmin + height
    y_top_origin = ymax
    y_bottom_origin = ymax - height

    gdf = multi_to_single(gdf)
    geoms = gdf.geometry
    index = make_index([g.buffer(0.1).bounds for g in geoms])
    idx_intersects = index.intersection
    array_values = gdf[field_name].values

    res = []
    for countcols in range(cols):
        y_top = y_top_origin
        y_bottom = y_bottom_origin
        for countrows in range(rows):
            value = 0
            cell = Polygon([
                        (x_left_origin, y_top), (x_right_origin, y_top),
                        (x_right_origin, y_bottom), (x_left_origin, y_bottom)
                        ])
            idx_pts = list(idx_intersects(
                (x_left_origin, y_bottom, x_right_origin, y_top), objects='raw'))
            if idx_pts:
                idx = geoms[idx_pts].intersects(cell).index
#                    intersected_geoms = geoms[idx]
                if func == 'mean':
                    value = np.mean(array_values[idx])
                elif func == 'density':
                    value = np.sum(array_values[idx]) / cell.area
            res.append((cell, value))

            y_top = y_top - height
            y_bottom = y_bottom - height
        x_left_origin = x_left_origin + height
        x_right_origin = x_right_origin + height

    return res
