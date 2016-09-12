# -*- coding: utf-8 -*-
from smoomapy import SmoothStewart
import pickle


def resume_stewart(dumped_obj, nb_class=8, disc_kind=None,
                   user_defined_breaks=None, mask=None):
    """
    Function allowing to recompute contour limits
    from a pickle-dumped SmoothStewart instance.
    """
    StePot = pickle.loads(dumped_obj)
    result = StePot.render(nb_class,
                           disc_kind,
                           user_defined_breaks,
                           func_grid="scipy",
                           output="GeoDataFrame",
                           new_mask=mask)
    _min, _max = result[["min", "max"]].values.T.tolist()
    return (result[::-1].to_json().encode(),
            {"min": _min[::-1], "max": _max[::-1]})

def quick_stewart_mod(input_geojson_points, variable_name, span,
                      beta=2, typefct='exponential',
                      nb_class=None, disc_kind=None, resolution=None,
                      mask=None, variable_name2=None,
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
    StePot = SmoothStewart(input_geojson_points, variable_name, span,
                           beta, typefct, resolution, variable_name2, mask)
    result = StePot.render(nb_class,
                           disc_kind,
                           user_defined_breaks,
                           func_grid="scipy",
                           output="GeoDataFrame")
    _min, _max = result[["min", "max"]].values.T.tolist()
    return (result[::-1].to_json().encode(),
            {"min": _min[::-1], "max": _max[::-1]},
            pickle.dumps(StePot))
