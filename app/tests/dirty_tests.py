# -*- coding: utf-8 -*-
"""
Created on Thu Mar 10 12:23:52 2016

@author: mz
"""

import requests
import time
import unittest


url_templ = 'http://localhost:9999/R/rnorm/'
HEADERS = {"Content-Type": 'x-www-form-urlencoded'}
time.sleep(1)
 
my_res_list, my_err_list = [], []
st = time.time()
for i in range(300):
    try:
        n = i * 10 if i < 150 else 20 + i
        result = requests.get(url_templ+'n={}&mean=100'.format(n),
                              headers=HEADERS).content.decode().split('\n')[0]
    except Exception as err:
        my_err_list.append('GET / REQ n° {} : {}'.format(i, err))
    else:
        my_res_list.append(result)
 
res_time = time.time() - st
print('{:.4f} s'.format(res_time))