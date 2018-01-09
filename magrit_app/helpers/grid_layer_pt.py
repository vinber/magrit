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
from .grid_generator import square_grid_gen, diams_grid_gen, hex_grid_gen

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


def get_func(func):
    if func == 'mean':
        f = lambda a: np.mean(a[0])
        # value = np.mean(array_values[idx])
    elif func == 'density':
        f = lambda a: (np.sum(a[0]) / a[1]) * 100000
        # value = np.sum(array_values[idx]) / cell.area
    elif func == 'density_count':
        f = lambda a: (len(a[0]) / a[1]) * 100000
        # value = np.sum(array_values[idx]) / cell.area
    return f


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

    cell_generator = {
        "square": square_grid_gen,
        # "square2": get_square_dens_grid,
        "diamond": diams_grid_gen,
        # "diamond2": get_diams_dens_grid,
        "hexagon": hex_grid_gen,
        # "hexagon2": get_hex_dens_grid
        }[grid_shape]
    res_geoms = get_dens_grid_pt(gdf, height, field_name, mask, func, cell_generator)
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


def get_dens_grid_pt(gdf, height, field_name, mask, func, cell_generator):
    f = get_func(func)
    if mask:
        xmin, ymin, xmax, ymax = mask.bounds
        total_bounds = mask.bounds
    else:
        xmin, ymin, xmax, ymax = gdf.total_bounds
        xmin = xmin - (xmax - xmin) / 8
        xmax = xmax + (xmax - xmin) / 8
        ymin = ymin - (ymax - ymin) / 8
        ymax = ymax + (ymax - ymin) / 8
        total_bounds = (xmin, ymin, xmax, ymax)

    gdf = multi_to_single(gdf)
    geoms = gdf.geometry
    index = make_index([g.buffer(0.1).bounds for g in geoms])
    idx_intersects = index.intersection
    array_values = gdf[field_name].values

    res = []
    for rect, _cell in cell_generator(total_bounds, height):
        value = 0
        cell = Polygon(_cell)
        idx_pts = list(idx_intersects(rect, objects='raw'))
        if idx_pts:
            idx = geoms[idx_pts].intersects(cell).index
            value = f((array_values[idx], cell.area))
        res.append((cell, value))

    return res
