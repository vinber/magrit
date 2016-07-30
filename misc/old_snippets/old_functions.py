# -*- coding: utf-8 -*-

def topojson_to_geojson(data):
    """
    Topojson to geojson back-conversion
    (using "official" TopoJSON cli tool)
    """
    layer_name = list(data['objects'].keys())[0]
    f_path = ''.join(['/tmp/', layer_name, '.topojson'])
    with open(f_path, 'wb') as f:
        f.write(json.dumps(data).encode())
    new_path = f_path.replace('topojson', 'json')
    process = Popen(["topojson-geojson", f_path, "-o", '/tmp'])
    process.wait()
    with open(new_path, 'r') as f:
        data = f.read()
    os.remove(f_path)
    os.remove(new_path)
    return data

async def charmod_helper(request):
    posted_data = await request.post()
    val1 = json.loads(posted_data['var1'])
    operator = posted_data["operator"]

    if "truncate" in operator:
        size = posted_data['opt']
        if size < 0:
            result = [val[len(val)+size:] for val in val1]
        else:
            result = [val[:size] for val in val1]
    else:  # operator == "concatenate"
        sep = posted_data['opt']
        val2 = json.loads(posted_data['var2'])
        if sep:
            sep = str(sep)
            result = [sep.join(pair_values) for pair_values in zip(val1, val2)]
        else:
            result = [''.join(pair_values) for pair_values in zip(val1, val2)]
    return web.Response(
        text=json.dumps(result) if result else '{"Error": "Unknown error"}')

def hash_md5_file(path):
    H = md5()
    with open(path, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            H.update(buf)
            buf = f.read(65536)
    return H.hexdigest()


def try_float(val):
    try:
        return float(val)
    except ValueError:
        return val


def zip_and_clean(dir_path, layer_name):
    zip_stream = BytesIO()
    myZip = zipfile.ZipFile(zip_stream, "w", compression=zipfile.ZIP_DEFLATED)
    for ext in [".shp", ".dbf", ".prj", ".shx"]:
        f_name = "".join([dir_path, "/", layer_name, ext])
        myZip.write(f_name, ''.join([layer_name, ext]), zipfile.ZIP_DEFLATED)
        os.remove(f_name)
    myZip.close()
    zip_stream.seek(0)
    os.removedirs(dir_path)
    return zip_stream, ''.join([layer_name, ".zip"])


#"""
#Make many (non concurrent) requests to a local noname webapp instance in order
#to see if all requests are served
#"""
from collections import deque
import aiohttp
import asyncio
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


#def check_layer_name(name, session_redis):
#    existing_layers = session_redis['user_layers']
#    if name not in existing_layers:
#        return name
#    else:
#        tmp = re_findall("_\d+$", name)
#        if tmp:
#            i = tmp[0][1:]
#            name = name[:len(name)-len(i)]
#            return check_layer_name(
#                    ''.join([name, str(int(i)+1)]), session_redis)
#        else:
#            name = '_'.join([name, "1"])
#            return check_layer_name(name, session_redis)


#"""
#Make many (non concurrent) requests to a local Ocpu instance in order
#to see if all requests are served
#"""
#import requests
#import time
#
#url_templ = 'http://localhost/ocpu/library/stats/R/rnorm'
#HEADERS = {"Content-Type": 'x-www-form-urlencoded'}
#
#def test_regular(nb_request):
#    my_res_list, my_err_list = [], []
#    st = time.time()
#    for i in range(nb_request):
#        try:
#            n = i * 10 if i < 150 else 20 + i
#            result = requests.post(url_templ, data = 'n={}&mean=100'.format(n),
#                                   headers=HEADERS).content.decode().split('\n')[0]
#        except Exception as err:
#            my_err_list.append('GET / REQ n° {} : {}'.format(i, err))
#        else:
#            if not '/ocpu/tmp' in result:
#                my_err_list.append('GET / REQ n° {} : {}'.format(i, result))
#                continue
#            try:
#                re_result = requests.get('http://localhost' + result)
#            except Exception as err2:
#                my_err_list.append('POST / REQ n° {} : {}'.format(i, err2))
#            else:
#                my_res_list.append(re_result.content.decode())
#    res_time = time.time() - st
#    print('{:.4f} s'.format(res_time))
#    return my_res_list, my_err_list
#
#import aiohttp
#import asyncio
#
#def test_async(nb_request, nb_concurrent):
#    st = time.time()
#    urls = [(url_templ, 'n={}&mean=100'.format(i * 10 if i < 150 else 20 + i))
#            for i in range(nb_request)]
#    jf = ResponseFetcher(urls, nb_concurrent, HEADERS)
#    result = jf.run()
#    res_time = time.time() - st
#    print('{:.4f} s'.format(res_time))
#    return result
#
#class ResponseFetcher:
#    def __init__(self, urls, concurrent_requests, headers):
#        self.urls = urls
#        self.concurrent_requests = concurrent_requests
#        self.headers = headers
#        self.results = []
#        self.errors = []
#
#    def run(self, clean_older=False):
#        if clean_older:
#            self.results = []
#        semaphore = asyncio.Semaphore(self.concurrent_requests)
#        loop = asyncio.get_event_loop()
#        loop.run_until_complete(asyncio.wait([self.worker(u, semaphore) for u in self.urls]))
#        return self.results, self.errors
#
#    @asyncio.coroutine
#    def worker(self, url, semaphore):
#        # Aquiring/releasing semaphore using context manager.
#        with (yield from semaphore):
#            try:
#                response = yield from aiohttp.request(
#                    'POST', url[0], data=url[1], connector=aiohttp.TCPConnector(
#                        share_cookies=True, verify_ssl=False),
#                    headers=self.headers)
#                body = yield from response.text()
##                self.results.append(body)
#                if 'ocpu/tmp' in body:
#                    yield from self.coworker('http://localhost' + body.split('\n')[0])
#                else:
#                    self.errors.append('Error on POST request : {}'.format(body))
#            except Exception as err:
#                self.errors.append('Error on POST request : {}'.format(err))
#
#    @asyncio.coroutine
#    def coworker(self, url):
#        try:
#            res = yield from aiohttp.request(
#                    'GET', url, connector=aiohttp.TCPConnector(
#                        share_cookies=True, verify_ssl=False),
#                    headers=self.headers)
#            data = yield from res.text()
#            self.results.append(data)
#        except Exception as err:
#            self.errors.append('Error on GET request : {}'.format(err))
