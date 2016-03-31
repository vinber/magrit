# -*- coding: utf-8 -*-
"""
@author: mz
"""
from hashlib import md5
from random import choice


def try_float(val):
    try:
        return float(val)
    except ValueError:
        return val

def savefile(path, raw_data):
    if '.shp' in path or '.dbf' in path or '.shx' in path:
        with open(path, 'wb') as f:
            f.write(raw_data)
    else:
        with open(path, 'w') as f:
            f.write(raw_data.decode())

def hash_md5_file(path):
    H = md5()
    with open(path, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            H.update(buf)
            buf = f.read(65536)
    return H.hexdigest()

def get_key(var):
    """Find and return an available key (ie. which is not in 'var')"""
    while True:
        k = (b''.join([bytes([choice(list(range(48, 58))+list(range(97, 123)))])
                    for i in range(25)])).decode()
        if k not in var:
            return k

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

