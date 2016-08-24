# -*- coding: utf-8 -*-
from smoomapy import compute, render_stewart
from geopandas import GeoDataFrame

def quick_stewart_mod(input_geojson_points, variable_name, span,
                            beta=2, typefct='exponential',
                            nb_class=None, resolution=None, mask=None,
                            user_defined_breaks=None):
    """
    Modified function from smoomapy

    Parameters
    ----------
    input_geojson_points: str
        Path to file to use as input (Points/Polygons), must contains
        a relevant numerical field.
    variable_name: str
        The name of the variable to use (numerical field only).
    span: int
        The span!
    beta: float
        The beta!
    typefct: str, default "exponential"
        The type of function in {"exponential", "pareto"}
    nb_class: int, default None
        The number of class, if unset will most likely be 8.
    resolution: int, default None
        The resolution to use (in unit of the input file), if not set a resolution
        will be used in order to make a grid containing around 7560 pts.
    mask: str, default None
        Path to the file (Polygons only) to use as clipping mask.
    user_defined_breaks: list or tuple, default None
        A list of ordered break to use to construct the contours
        (override `nb_class` value if any)

    Returns
    -------
    smoothed_geojson: bytes
        The result dumped as GeoJSON (utf-8 encoded).
    breaks: dict
        The break values used.
    """
    gdf = GeoDataFrame.from_file(input_geojson_points).to_crs(crs="+proj=natearth")

    if mask:
        mask = GeoDataFrame.from_file(mask).to_crs(crs="+proj=natearth") \
                if mask != input_geojson_points else gdf

        if len(set(gdf.type).intersection({"Polygon", "MultiPolygon"})) > 0 \
                and gdf.crs == mask.crs:
            use_mask = True
        else:
            print("Warning: Mask layer have to be (Multi)Polygon geometries"
                  " and use the same CRS as input values")
            use_mask = False
    else:
        use_mask = False

    pot, unknownpts, shape = compute(gdf,
                                     variable_name,
                                     span=span,
                                     beta=beta,
                                     resolution=resolution,
                                     typefct='exponential',
                                     mask=mask if use_mask else None)

    result = render_stewart(
        pot, unknownpts, nb_class if nb_class else 8, mask, shape,
        user_defined_breaks)
    result.crs = gdf.crs
    _min, _max = result[["min", "max"]].values.T.tolist()
    return (result[::-1].to_crs({'init': 'epsg:4326'}).to_json().encode(),
            {"min": _min[::-1], "max": _max[::-1]})

