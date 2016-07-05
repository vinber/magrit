# -*- coding: utf-8 -*-
"""
@author: mthh
"""
from libc.stdlib cimport malloc, free
from shapely.geometry import MultiPolygon, Polygon
import shapely.geometry.base


cdef extern from "embed.h":
    void embed_main(int xsize, int ysize, double *dens, double *gridx, double *gridy)

cdef extern from "cart.h":
    void cart_velocity(double rx, double ry, int s, int xsize, int ysize,
                       double *vxp, double *vyp)
    double** cart_dmalloc(int xsize, int ysize)
    void cart_dfree(double **userrho)
    void cart_makews(int xsize, int ysize)
    void cart_freews(int xsize, int ysize)
    void cart_transform(double **userrho, int xsize, int ysize);
    void cart_makecart(double *pointx, double *pointy, int npoints,
    		   int xsize, int ysize, double blur)

cdef extern from "interp_mat.h":
    double* transform_coords(double **gridx, double **gridy,
                             unsigned int xsize, unsigned int ysize,
                             double xin, double yin)
    void reconstruct_grid(double *list_x, double *list_y,
                          double **gridx, double **gridy,
            	          unsigned int xsize, unsigned int ysize)
cdef extern from *:
    pass


cpdef cart_embed(int xsize, int ysize, list density):
    cdef Py_ssize_t nb_cell = <Py_ssize_t> xsize
    cdef Py_ssize_t n_val_density = len(density)
    cdef unsigned int i
    cdef list result_coords = []
    cdef double *dens = <double *>malloc(<unsigned int>n_val_density * sizeof(double))
    cdef double *gridx = <double *>malloc(<unsigned int>(nb_cell+1) * (nb_cell+1) * sizeof(double))
    cdef double *gridy = <double *>malloc(<unsigned int>(nb_cell+1) * (nb_cell+1) * sizeof(double))

    for i in range(n_val_density):
        dens[i] = <double> density[i]
    embed_main(xsize, ysize, dens, gridx, gridy)
    for i in range(n_val_density):
        result_coords.append((gridx[i], gridy[i]))
    free(dens)
    free(gridx)
    free(gridy)
    return result_coords


cpdef interpolate_poly(list list_x, list list_y, list polygons_points, unsigned int xsize, unsigned int ysize):
    cdef unsigned int i, len_li = len(list_x)
    cdef double *res_c = <double *>malloc(<unsigned int>2 * sizeof(double))
    cdef double *li_x = <double *>malloc(<unsigned int>len(list_x) * sizeof(double))
    cdef double *li_y = <double *>malloc(<unsigned int>len(list_y) * sizeof(double))
    cdef double **gridx = <double **>malloc(<unsigned int>(xsize+1) * (ysize+1) * sizeof(double))
    cdef double **gridy = <double **>malloc(<unsigned int>(xsize+1) * (ysize+1) * sizeof(double))
    for i in range(xsize+1):
        gridx[i] = <double *>malloc((ysize + 1) * sizeof(double))
    for i in range(xsize+1):
        gridy[i] = <double *>malloc((ysize + 1) * sizeof(double))
    for i in range(len_li):
        li_x[i] = list_x[i]
        li_y[i] = list_y[i]

    reconstruct_grid(li_x, li_y, gridx, gridy, xsize, ysize)

    for poly in polygons_points:
        for lines in poly:
            if not isinstance(lines[0], float):
                for p in lines:
                    if not isinstance(p[0], float):
                        for _p in p:
                            res_c = transform_coords(gridx,gridy,xsize,ysize, <double> _p[0], <double> _p[1])
                            _p = (res_c[0], res_c[1])
                            free(res_c)
                            res_c = <double *>malloc(<unsigned int>2 * sizeof(double))
                    else:
                        res_c = transform_coords(gridx,gridy,xsize,ysize, <double> p[0], <double> p[1])
                        p = (res_c[0], res_c[1])
                        free(res_c)
                        res_c = <double *>malloc(<unsigned int>2 * sizeof(double))
            else:
                res_c = transform_coords(gridx,gridy,xsize,ysize, <double> lines[0], <double> lines[1])
                lines = (res_c[0], res_c[1])
                free(res_c)
                res_c = <double *>malloc(<unsigned int>2 * sizeof(double))

    free(res_c)
    free(li_x)
    free(li_y)
#    free(grid_x)
#    free(grid_y)
    return polygons_points

def compute_xy1(xsize, ysize, density):
    res = cart_embed(xsize, ysize, density)
    return res

def compute_xy2(xsize, ysize, density):
    res = cart_embed(xsize, ysize, density)
    return ([i[0] for i in res], [i[1] for i in res])

def dump_poly_coords(gdf):
    return [shapely.geometry.base.dump_coords(geom) for geom in gdf.geometry]

def construct_new_gdf(input_gdf, transformed_geoms):
    gdf = input_gdf.copy()
    for ix, d in enumerate(transformed_geoms):
        try:
            if isinstance([0], list) and isinstance(d[0][0], tuple) and len(d) == 1:
                new_geom = Polygon(
                    shell=[g for g in d[0] if isinstance(g, tuple)],
                    holes=[g for g in d[0] if isinstance(g, list)] if isinstance(d[0][-1], list) else None)
                gdf.geometry.loc[ix] = new_geom
            elif isinstance(d[0], list) and len(d) > 1:
                polys = []
                for poly in d[0]:
                    polys.append(Polygon(
                        shell=[g for g in poly if isinstance(g, tuple)],
                        holes=[g for g in poly if isinstance(g, list)] if isinstance(poly[-1], list) else None))
                gdf.geometry.loc[ix] = MultiPolygon(polys)
        except:
            print("Error on ", ix)
    return gdf

def make_cart_from_density(layer_path, density, grid_size=(256, 256), output_geojson=True):
    ## TODO: avoid going back and forth between python and C variables
    list_x, listy = compute_xy2(grid_size[0], grid_size[1], density)
    gdf = GeoDataFrame.from_file(layer_path)
    poly_pts = dump_poly_coords(gdf)
    res_pts = interpolate_poly(list_x, listy, poly_pts, grid_size[0], grid_size[1])
    res_carto = cycart.construct_new_gdf(gdf, res_pts)
    if output_geojson :
        res_carto.to_json(output_geojson)
    else:
        return res_carto
