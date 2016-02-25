# -*- coding: utf-8 -*-
"""
Created on Thu Feb 25 13:38:02 2016

@author: mz
"""
import rpy2.rinterface as rinterface
import rpy2.robjects as robjects
import pandas as pd
from rpy2.robjects.packages import importr
from pandas.rpy import common as com
from functools import wraps
import numpy as np
from random import randint, choice
from collections import OrderedDict
import os
#from helpers import guess_seperator

def guess_separator(file):
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


class flows_routine:
    r_flows = importr("flows")
    r_base = importr("base")
    grdevices = importr('grDevices')

    def __init__(self, table_file, return_graphics=True):
        if return_graphics:
            self.prepare_device()
            self.return_graphics = True
        else:
            self.return_graphics = False
        self.prepared = (False, )
        if '.xls' in table_file:
            self.table = pd.read_excel(table_file)
        elif '.csv' or '.tsv' or '.txt' in table_file:
            sep = guess_separator(table_file)
            if sep is None:
                raise ValueError(
                'Unable to understand the type of input file\n'
                '(Should have been comma-seperated-values)')
            self.table = pd.read_csv(table_file)
        else:
            raise ValueError(
                'Unable to understand the type of input file')

    @property
    def is_prepared(self):
        return self.prepared[0]

    def prepare_device(self):
        self.key = ''.join([bytes([choice(
                [randint(65,90), randint(48, 57), randint(97, 122)])
            ]).decode() for _ in range(25)])
        self.out_path = '/tmp/flows_graphics{}.svg'.format(self.key)
        grdevices.svg(file=self.out_path)
        if not os.path.exists(self.out_path):
            with open(self.out_path, 'w') as f:
                f.write('')
        self.graphics_last_mod = os.stat(self.out_path).st_mtime

    def prepare(self, colnames={'i': 'i', 'j': 'j', 'fij': 'fij'},
                remove_diag = True):
        self.Rflows_data = com.convert_to_r_dataframe(self.table)
        self.myflows = r_flows.prepflows(self.Rflows_data, **colnames)
        self.prepared = (True, )
        if remove_diag:
            myflows_np = np.asarray(self.myflows)
            np.fill_diagonal(myflows_np, 0)
            self.prepared = (True, 'Removed diagonals')

    def stat_mat(self, output='none', verbose=True, mat=None):
        if not mat and not self.is_prepared:
            return -1
        if not verbose and output.lower() == 'none':
            return
        if not mat:
            self.last_stat = r_flows.statmat(self.myflows, output = output, verbose = verbose)
        else:
            self.last_stat = r_flows.statmat(mat, output = output, verbose = verbose)
        return OrderedDict([
                ("matdim", self.last_stat[0][0]),
                ("nblinks", self.last_stat[1][0]),
                ("density", self.last_stat[2][0]),
                ("connectcomp", self.last_stat[3][0]),
                ("connectcompx", self.last_stat[4][0]),
                ("sumflows", self.last_stat[8][0]),
                ("min", self.last_stat[9][0]),
                ("Q1", self.last_stat[10][0]),
                ("median", self.last_stat[11][0]),
                ("Q3", self.last_stat[12][0]),
                ("max", self.last_stat[13][0]),
                ("mean", self.last_stat[14][0]),
                ("sd", self.last_stat[15][0])
            ])
#        return {"matdim": self.last_stat[0][0],
#                "nblinks": self.last_stat[1][0],
#                "density": self.last_stat[2][0],
#                "connectcomp": self.last_stat[3][0],
#                "connectcompx": self.last_stat[4][0],
#                "sumflows": self.last_stat[8][0],
#                "min": self.last_stat[9][0],
#                "Q1": self.last_stat[10][0],
#                "median": self.last_stat[11][0],
#                "Q3": self.last_stat[12][0],
#                "max": self.last_stat[13][0],
#                "mean": self.last_stat[14][0],
#                "sd": self.last_stat[15][0]
#                }
    
    def firstflows(self, k, method='nfirst', ties_method='first'):
        assert method in {'nfirst', 'xfirst', 'xsumfirst'}
        assert method in {'first', 'random'}
        return r_flows.firstflows(self.myflows, method=method,
                                  ties_method=ties_method, k=k)

    def firstflowsg(self, k, method='nfirst', ties_method='first'):
        assert method in {'nfirst', 'xfirst', 'xsumfirst'}
        assert method in {'first', 'random'}
        return r_flows.firstflowsg(self.myflows, method=method,
                                  ties_method=ties_method, k=k)

    def domflows(self, weight, k):
        return r_flows.domflows(self.myflows, w=weight, k=k)

    @staticmethod
    def is_modified(f, file_to_monitor, last_modified):
        @wraps(f)
        def wrapper(*args, **kwargs):
            return f(*args, **kwargs)
        w = wrapper
        if os.stat(file_to_monitor).st_mtime != last_modified:
            print('A graphical output is dispo')
            grdevices.dev_off()
            with open(file_to_monitor, "r") as f:
                img = f.read()
            grdevices.svg(file_to_monitor)
            return w, img
        else:
            print('Nope')
            return w
