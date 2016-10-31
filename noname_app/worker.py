# -*- coding: utf-8 -*-
"""
@author: mz
"""
import asyncio
import sys
import pickle
import logging
import time
from zmq import REQ, IDENTITY
from zmq.asyncio import Context, ZMQEventLoop
from geopandas import GeoDataFrame
from helpers.cartogram_doug import make_cartogram
from helpers.geo import olson_transform, make_geojson_links
from helpers.stewart_smoomapy import quick_stewart_mod, resume_stewart
from helpers.grid_layer import get_grid_layer


def default_func(*args):
    return "Invalid request\n Arguments :\n".format(*args).encode()


def make_geojson_cartogram(tmp_path, n_field_name, iterations):
    return make_cartogram(GeoDataFrame.from_file(tmp_path), n_field_name, iterations)


def test_func1(field, values1, values2):
    res = [a + b for a,b in zip(values1, values2)]
    return {field: res}


def test_func2(field, values1, values2):
    time.sleep(2)
    res = [a + b for a,b in zip(values1, values2)]
    return {field: res}


class WorkerTask:
    def __init__(self, worker_id, url_workers, serialization="pickle"):
        self.available_functions = {
            b"quick_stewart_mod": quick_stewart_mod,
            b"make_geojson_links": make_geojson_links,
            b"resume_stewart": resume_stewart,
            b"get_grid_layer": get_grid_layer,
            b"make_geojson_cartogram": make_geojson_cartogram,
            b"olson_transform": olson_transform,
            b"test_func1": test_func1,
            b"test_func2": test_func2,
            }
        self.worker_id = '{}'.format(worker_id)
        self.nb_request = 0
        self.loop = ZMQEventLoop()
        self.logger = logging.getLogger("noname_app.async_brooker")
        asyncio.set_event_loop(self.loop)
        async def run(loop):
            await self.set_ready_worker(url_workers)
        try:
            self.loop.run_until_complete(run(self.loop))
        except KeyboardInterrupt:
            self.socket.close()
            self.context.destroy()
            print("Worker {} closed after {} requests"
                  .format(self.worker_id, self.nb_request))
            return

    async def set_ready_worker(self, url_workers):
        self.context = Context()
        self.socket = self.context.socket(REQ)

        socket = self.socket
        socket.setsockopt_string(IDENTITY, self.worker_id)
        socket.connect(url_workers)

        await socket.send(b"READY")
        while True:
            client_addr, t1, req_func, t2, args = \
                await socket.recv_multipart()
#            assert t1 == t2 == b''
#            assert req_func in self.available_functions
            func = self.available_functions.get(req_func, default_func)
            args = pickle.loads(args)
            try:
                result = func(*args)
            except Exception as err:
                result = err
            await socket.send_multipart([
                client_addr,
                b'',
                pickle.dumps(result)])
            self.nb_request += 1


if __name__ == "__main__":
    print(sys.argv)
    if len(sys.argv) < 3:
        sys.exit()
    worker_id = sys.argv[1]
    address_worker = {
        "ipc": 'ipc:///tmp/feeds/workers',
        "tcp": 'tcp://localhost:5560'
        }.get(sys.argv[2], None)
    if not address_worker:
        sys.exit()
    w = WorkerTask(worker_id, address_worker)
