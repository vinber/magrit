# -*- coding: utf-8 -*-
"""
Make many (non concurrent) requests to a local noname webapp instance in order
to see if all requests are served
"""
from collections import deque
import requests
import time

url_templ = 'http://localhost:9999/R/rnorm/'
HEADERS = {"Content-Type": 'x-www-form-urlencoded'}

def test_regular(nb_request):
    time.sleep(1)
    my_res_list, my_err_list = [], []
    st = time.time()
    for i in range(nb_request):
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
    return my_res_list, my_err_list

import aiohttp
import asyncio

def test_async(nb_request, nb_concurrent):
    time.sleep(1)
    st = time.time()
    urls = [url_templ+'n={}&mean=100'.format(i * 10 if i < 150 else 20 + i)
            for i in range(nb_request)]
    jf = ResponseFetcher(urls, nb_concurrent, HEADERS)
    result = jf.run()
    res_time = time.time() - st
    print('{:.4f} s'.format(res_time))
    return result

class ResponseFetcher:
    def __init__(self, urls, concurrent_requests, headers):
        self.urls = urls
        self.concurrent_requests = concurrent_requests
        self.headers = headers
        self.results = deque(maxlen=1000)

    def run(self, clean_older=False):
        if clean_older:
            self.results = []
        semaphore = asyncio.Semaphore(self.concurrent_requests)
        loop = asyncio.get_event_loop()
        loop.run_until_complete(asyncio.wait([self.worker(u, semaphore) for u in self.urls]))
        return self.results

    @asyncio.coroutine
    def worker(self, url, semaphore):
        # Aquiring/releasing semaphore using context manager.
        with (yield from semaphore):
            response = yield from aiohttp.request(
                'GET', url, connector=aiohttp.TCPConnector(
                    share_cookies=False, verify_ssl=False),
                headers=self.headers)
            body = yield from response.text()
            self.results.append(body)
