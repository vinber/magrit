# -*- coding: utf-8 -*-
"""
Some wrappers around R packages functionnalities
(or around a set of functionnalities) using there Rpy2 mapping
in order accept and output JSON-like objects from a python environnement

@author: mz
"""
#import rpy2.rinterface as rinterface
import rpy2.robjects as robjects
from rpy2.robjects.packages import importr
from pandas.rpy import common as com
from collections import OrderedDict
import numpy as np
import pandas as pd
import os
try:
    import ujson as json
except:
    import json
#from functools import wraps
#from random import randint, choice
#import os
#from helpers import guess_seperator

r_flows = importr("flows")
r_SpatialPosition = importr('SpatialPosition')
r_geojsonio = importr('geojsonio')
rjsonlite = importr('jsonlite')
rMTA = importr('MTA')
sp = importr('sp')
rgdal = importr('rgdal')
raster = importr('raster')

def guess_separator(file):
    """
    Ugly helper function to return the (guessed) separator of a csv file
    (TODO: replace by something better)
    """
    with open(file, 'r') as f:
        l = f.readline()
        l2 = f.readline()
    c_comma1 = l.count(',')
    c_smcol1 = l.count(';')
    if '\t' in l and not (c_comma1 or c_smcol1):
        return '\t'
    elif c_comma1 and not c_smcol1:
        return ','
    elif c_smcol1 and not c_comma1:
        return ';'
    else:
        c_comma2 = l2.count(',')
        c_smcol2 = l2.count(';')
        if c_comma2 == c_comma1:
            if c_smcol1 != c_smcol2:
                return ','
            else:
                return None
        elif c_smcol2 == c_smcol1:
            if c_comma2 != c_comma1:
                return ';'
            else:
                return None


class spatialposition_json:
    """
    Just a class used as a namespace to hold some wrapped functionnality from
    R "SpatialPosition" package (each one accepting and returning JSON array)
    (With the faith of making a service-based load-balancer between various
    needed R functions ?)
    """
    def rpy2_stewart(knownpts_json, varname,  span,
                     beta, resolution, mask_json,
                     unknownpts_json=None, matdist=None,
                     typefct="exponential", longlat=False):
        """
        Python function using only R methods through Rpy2.
        Wrapper to 'stewart potential' functionnalities
        from SpatialPosition R package in order to
        fetch directly an output as GeoJSON.

        Parameters
        ----------
        knownpts_json : file path to a GeoJSON
            The point layer to use
        varname : string
            The name of the variable to use
        span : integer or float
            The span (see doc.)
        beta : integer or float
            The beta value
        resolution : integer or float
            The grid resolution                f.write('')
    
        unknownpts_json : file path to a GeoJSON, default None
            The point layer to use instead of the grid (override resolution param)
        matdist : array or DataFrame, default None
            The distance matrix to use (override both resolution and unknownpts_json)
        typefct : {'exponential', 'pareto'}, default 'exponential'
            The function to use.
        longlat : boolean, default=False
            Is the layer in geographic coords ? Not in use currently
    
        Returns
        -------
        stewart_geojson : GeoJSON layer
            The stewart potential result as (minified) GeoJSON string (unicode).
        """    
        # Nasty way to write a R function and use it in python :
        # (in order to avoid the use of the SpatialPosition builtin plotStewart
        # when only fetching the break values) :
        break_val_stewart = robjects.reval("""
            break_val_stewart <- function(x, typec = "equal", nclass = 5){
              if (typec == "equal") bks <- seq(raster::cellStats(x, min), raster::cellStats(x, max), length.out = nclass+1)
              else if (typec == "quantile") bks <- stats::quantile (x, probs = seq(0,1, by = 1/nclass))
              else stop('Enter a proper discretisation type: "equal" or "quantile"')
              return(invisible(unique(bks)))
            }""")
    
        latlong_string = "+init=epsg:4326"
        web_mercator = "+init=epsg:3857"
        knownpts_layer = r_geojsonio.geojson_read(knownpts_json, what='sp')
        mask_layer = r_geojsonio.geojson_read(mask_json, what='sp')

        if raster.isLonLat(knownpts_layer)[0]:
            knownpts_layer = sp.spTransform(knownpts_layer, sp.CRS(web_mercator))

        if raster.isLonLat(mask_layer)[0]:
            mask_layer = sp.spTransform(mask_layer, sp.CRS(web_mercator))

        globalAccessibility = r_SpatialPosition.stewart(
            knownpts=knownpts_layer, varname=varname, typefct=typefct,
            span=span, beta=beta, resolution=resolution,
            longlat=longlat, mask=mask_layer)

        rasterAccessibility = \
            r_SpatialPosition.rasterStewart(x=globalAccessibility,
                                            mask=mask_layer)

        breakValues = break_val_stewart(x=rasterAccessibility, nclass=6)
        contLines = r_SpatialPosition.contourStewart(x=rasterAccessibility,
                                                     breaks=breakValues)

        result = r_geojsonio.geojson_json(sp.spTransform(
            contLines, sp.CRS(latlong_string)))
        return result[0]


class mta_json:
    """
    Wrap some function from "MTA" R package in order to output JSON arrays.
    """
    def global_dev(x, var1, var2, ref = None, type_dev = 'rel'):
        """
        Parameter
        ---------

        x : JSON string,
            JSON representation of the data.frame [like dumped with
              - jsonlite::toJSON(df) in R
              - pandas.DataFrame.to_json(df.reset_index(drop=False), orient='records') ]
        var1 : string,
            A column name
        var2 : string,
            A column name
        ref : integer or float or None, default None
            The reference ratio
        type_dev : {'rel', 'abs'}, default 'rel'
            The type of deviation

        Return
        ------

        globalDev : JSON array,
            The JSON representation (1 dim. array) of the deviation computed

        Example
        -------
        > df_json[:400]
        '[
          {"id":"AT111","birth_2008":272,"death_2008":445.0,"gdppps1999":509,
               "gdppps2008":641,"pop1999":39148.91,"pop2008":37452},
          {"id":"AT112","birth_2008":1195,"death_2008":1480.0,"gdppps1999":2262,
               "gdppps2008":3272,"pop1999":137469.46,"pop2008":146383}
          ... ]
        > mta_json.global_dev(df_json, 'pop1999', 'pop2008', None, 'abs')
        '[108.3791,97.3681,106.6248,102.6098,100.8494,101.4324,103.475,101.203,
          95.763,94.718,95.4696,101.4783,105.969,106.0705,95.623,105.6816,108.0605,
          ... ]
        """
        
        assert type_dev in {"abs", "rel"}
        if ref is None or ref == "NULL" or ref == "":
            ref = robjects.NULL
        x = rjsonlite.fromJSON(x)
        return rjsonlite.toJSON(rMTA.globalDev(x, var1, var2, ref, type_dev))[0]

    def medium_dev(x, var1, var2, key, type_dev = 'rel'):
        """
        Parameter
        ---------

        x : JSON string,
            JSON representation of the data.frame [like dumped with
              - jsonlite::toJSON(df) in R
              - pandas.DataFrame.to_json(df.reset_index(drop=False), orient='records') ]
        var1 : string,
            A column name
        var2 : string,
            A column name
        key : string,
            A column name, containing the name of the aggregation key field
        type_dev : {'rel', 'abs'}, default 'rel'
            The type of deviation

        Return
        ------

        globalDev : JSON array,
            The JSON representation (1 dim. array) of the deviation computed

        """
        x = rjsonlite.fromJSON(x)
        return rjsonlite.toJSON(rMTA.mediumDev(x, var1, var2, key, type_dev))[0]

    def local_dev(gdf, var1, var2, order=None, dist=None, type_dev='rel'):
        """
        Parameter
        ---------

        gdf : GeoJSON string,
            GeoJSON representation of the polygons layers
            (including relevant attributes)
        var1 : string,
            A column name
        var2 : string,
            A column name
        order : integer or float, default None
            The order of contiguity (order OR dist should be set)
        dist : integer or float, default None
            The distance defining the contiguity (order OR dist should be set)
        type_dev : {'rel', 'abs'}, default 'rel'
            The type of deviation

        Return
        ------

        localDev : JSON array,
            The JSON representation (1 dim. array) of the deviation computed

        """
#        filename = '/tmp/{}.geojson'.format(abs(hash(tmp_key)))
#        print(filename)
#        with open(filename, 'w') as f:
#            f.write(gdf)
#        spdf = r_geojsonio.geojson_read(filename, what='sp')
        spdf = rgdal.readOGR(gdf, 'OGRGeoJSON', verbose=False)
        if not order and not dist:
            return json.dumps({'Result': 'Error'})
        if order is None or order == "NULL" or order == "":
            order = robjects.NULL
        if dist is None or dist == "NULL" or dist == "":
            dist = robjects.NULL
#        os.remove(filename)
        return rjsonlite.toJSON(
            rMTA.localDev(spdf, spdf.do_slot('data'), var1=var1, var2=var2,
                          order=order, dist=dist, type=type_dev))[0]

class flows_json:
    """
    Just a class used as a namespace to hold some wrapped functionnality from
    R "flows" package (each one accepting and returning JSON array)
    (With the faith of making a service-based load-balancer between various
    needed R functions ?)
    """
    def init_load(table_file):
        if '.csv' in table_file:
            sep = guess_separator(table_file)
            table = pd.read_csv(table_file, sep=sep)
        elif '.xls' in table_file or '.xlsx' in table_file:
            table = pd.read_excel(table_file)
        else:
            raise ValueError(
                'Unable to understand the type of input file')
        return table

    def prepare(table, colnames={'i': 'i', 'j': 'j', 'fij': 'fij'},
                remove_diag=True, return_type='numpy', copy='deep'):
        """
        Return the prepared array (preferably as JSON array)
        from an incoming table (preferably a pd.DataFrame, as opened before)
        """
        if isinstance(table, pd.DataFrame):
            pass
        else:
            try:
                table = np.array(table)
            except:
                raise ValueError(
                    'Having difficulties with the matrix format...')

        Rflows_data = com.convert_to_r_dataframe(table)
        myflows = r_flows.prepflows(Rflows_data, **colnames)

        if remove_diag:
            myflows_np = np.asarray(myflows)
            np.fill_diagonal(myflows_np, 0)

        if return_type == 'json-array':
            return rjsonlite.toJSON(myflows)[0]
        elif return_type == 'json-obj':
            return rjsonlite.serializeJSON(myflows)[0]
        if return_type == 'numpy' and copy == 'deepcopy':
            return np.array(myflows)
        elif return_type == 'numpy' and copy == 'shallow':
            return myflows_np
        elif return_type == 'rpy2':
            return myflows

    def stat_mat(mat, output='none', verbose=True):
        """
        Parameter
        ---------

        mat : JSON array
            The matrix to use
        output : {'none', 'lorentz', 'all'}, default 'none'
            Other behavior than 'none' are not yet implemented
        verbose : bollean, default True
            Return the summary computed (Only functionnality wrapped yet)

        Return
        ------

        mystats: JSON object
            Summary as JSON with named results (matdim, nblinks, etc.)
        """

        if not verbose and output.lower() == 'none':
            return json.dumps({})
        mat = com.convert_to_r_matrix(pd.DataFrame(data=json.loads(mat), dtype=float))
        last_stat = r_flows.statmat(mat, output = output, verbose = verbose)
        return json.dumps(OrderedDict([
                ("matdim", last_stat[0][0]),
                ("nblinks", last_stat[1][0]),
                ("density", last_stat[2][0]),
                ("connectcomp", last_stat[3][0]),
                ("connectcompx", last_stat[4][0]),
                ("sumflows", last_stat[8][0]),
                ("min", last_stat[9][0]),
                ("Q1", last_stat[10][0]),
                ("median", last_stat[11][0]),
                ("Q3", last_stat[12][0]),
                ("max", last_stat[13][0]),
                ("mean", last_stat[14][0]),
                ("sd", last_stat[15][0])
                ]))

    def firstflows(mat, k, method='nfirst', ties_method='first'):
        """
        Parameter
        ---------

        mat : JSON array
            The matrix to use
        k: integer
            Thresehold

        Return
        ------
            flowSel : JSON array
                The selected flows as JSON array
        """
        mat = com.convert_to_r_matrix(pd.DataFrame(data=json.loads(mat), dtype=float))
        res = r_flows.firstflows(mat, method=method,
                                 ties_method=ties_method, k=k)
        return rjsonlite.toJSON(res)[0]

    def firstflowsg(mat, k, method='nfirst', ties_method='first'):
        """
        Parameter
        ---------

        mat : JSON array
            The matrix to use
        k: integer
            Thresehold

        Return
        ------
            flowSel : JSON array
                The selected flows as JSON array
        """
        mat = com.convert_to_r_matrix(pd.DataFrame(data=json.loads(res), dtype=float))
        res = r_flows.firstflowsg(mat, method=method,
                                  ties_method=ties_method, k=k)
        return rjsonlite.toJSON(res)[0]

    def domflows(mat, weight, k):
        """
        Parameter
        ---------

        mat : JSON array
            The matrix to use
        weight : integer or float
            A weight (see doc.)
        k: integer
            Thresehold

        Return
        ------
            flowSel : JSON array
                The selected flows as JSON array
        """
        mat = com.convert_to_r_matrix(np.array(mat))
        res = r_flows.domflows(mat, w=weight, k=k)
        return rjsonlite.toJSON(res)[0]


def test():
    knownpts_json = '/home/mz/code/noname/tmp/geom/hamburg_pts.geojson'
    mask_json = '/home/mz/code/noname/tmp/geom/hamburg_mask.geojson'
    varname = 'value1'
    span, beta, resolution = 1250, 3, 750
    typefct = 'exponential'

    result = spatialposition_json.rpy2_stewart(
        knownpts_json, varname, span, beta,
        resolution, mask_json, typefct=typefct)

    print(result[:500])

#class flows_routine:
#    """
#    Some python wrappers around R flows package
#    """
#    r_flows = importr("flows")
#    r_base = importr("base")
#    grdevices = importr('grDevices')
#
#    def __init__(self, table_file, return_graphics=True):
#        if return_graphics:
#            self.prepare_device()
#            self.return_graphics = True
#        else:
#            self.return_graphics = False
#        self.prepared = (False, )
#        if '.xls' in table_file:
#            self.table = pd.read_excel(table_file)
#        elif '.csv' or '.tsv' or '.txt' in table_file:
#            sep = guess_separator(table_file)
#            if sep is None:
#                raise ValueError(
#                'Unable to understand the type of input file\n'
#                '(Should have been comma-seperated-values)')
#            self.table = pd.read_csv(table_file)
#        else:
#            raise ValueError(
#                'Unable to understand the type of input file')
#
#    @property
#    def is_prepared(self):
#        return self.prepared[0]
#
#    def prepare_device(self):
#        self.key = ''.join([bytes([choice(
#                [randint(65,90), randint(48, 57), randint(97, 122)])
#            ]).decode() for _ in range(25)])
#        self.out_path = '/tmp/flows_graphics{}.svg'.format(self.key)
#        grdevices.svg(file=self.out_path)
#        if not os.path.exists(self.out_path):
#            with open(self.out_path, 'w') as f:
#                f.write('')
#        self.graphics_last_mod = os.stat(self.out_path).st_mtime
#
#    def prepare(self, colnames={'i': 'i', 'j': 'j', 'fij': 'fij'},
#                remove_diag = True):
#        self.Rflows_data = com.convert_to_r_dataframe(self.table)
#        self.myflows = r_flows.prepflows(self.Rflows_data, **colnames)
#        self.prepared = (True, )
#        if remove_diag:
#            myflows_np = np.asarray(self.myflows)
#            np.fill_diagonal(myflows_np, 0)
#            self.prepared = (True, 'Removed diagonals')
#
#    def stat_mat(self, output='none', verbose=True, mat=None):
#        if not mat and not self.is_prepared:
#            return -1
#        if not verbose and output.lower() == 'none':
#            return
#        if not mat:
#            self.last_stat = r_flows.statmat(self.myflows, output = output, verbose = verbose)
#        else:
#            self.last_stat = r_flows.statmat(mat, output = output, verbose = verbose)
#        return OrderedDict([
#                ("matdim", self.last_stat[0][0]),
#                ("nblinks", self.last_stat[1][0]),
#                ("density", self.last_stat[2][0]),
#                ("connectcomp", self.last_stat[3][0]),
#                ("connectcompx", self.last_stat[4][0]),
#                ("sumflows", self.last_stat[8][0]),
#                ("min", self.last_stat[9][0]),
#                ("Q1", self.last_stat[10][0]),
#                ("median", self.last_stat[11][0]),
#                ("Q3", self.last_stat[12][0]),
#                ("max", self.last_stat[13][0]),
#                ("mean", self.last_stat[14][0]),
#                ("sd", self.last_stat[15][0])
#            ])
#    
#    def firstflows(self, k, method='nfirst', ties_method='first'):
#        assert method in {'nfirst', 'xfirst', 'xsumfirst'}
#        assert method in {'first', 'random'}
#        return r_flows.firstflows(self.myflows, method=method,
#                                  ties_method=ties_method, k=k)
#
#    def firstflowsg(self, k, method='nfirst', ties_method='first'):
#        assert method in {'nfirst', 'xfirst', 'xsumfirst'}
#        assert method in {'first', 'random'}
#        return r_flows.firstflowsg(self.myflows, method=method,
#                                  ties_method=ties_method, k=k)
#
#    def domflows(self, weight, k):
#        return r_flows.domflows(self.myflows, w=weight, k=k)
#
#    @staticmethod
#    def is_modified(f, file_to_monitor, last_modified):
#        @wraps(f)
#        def wrapper(*args, **kwargs):
#            return f(*args, **kwargs)
#        w = wrapper
#        if os.stat(file_to_monitor).st_mtime != last_modified:
#            print('A graphical output is dispo')
#            grdevices.dev_off()
#            with open(file_to_monitor, "r") as f:
#                img = f.read()
#            grdevices.svg(file_to_monitor)
#            return w, img
#        else:
#            print('Nope')
#            return w
