# -*- coding: utf-8 -*-
"""
@author: mz
"""
import asyncio
import sys
import ujson as json
from zmq import REQ, IDENTITY
from zmq.asyncio import Context, ZMQEventLoop
from helpers.cartogram_doug import make_cartogram
from helpers.geo import olson_transform
from helpers.stewart_smoomapy import quick_stewart_mod, resume_stewart
from helpers.grid_layer import get_grid_layer


def default_func(*args):
    return "Invalid request".encode()


class WorkerTask:
    def __init__(self, worker_id, url_workers='ipc:///tmp/feeds/workers'):
        self.available_functions = {
            b"quick_stewart_mod": quick_stewart_mod,
            b"resume_stewart": resume_stewart,
            b"get_grid_layer": get_grid_layer,
            b"make_cartogram": make_cartogram,
            b"olson_transform": olson_transform
            }
        self.worker_id = '{}'.format(worker_id)
        self.nb_request = 0
        self.loop = ZMQEventLoop()
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
            client_addr, t1, req_func, t2, args = await socket.recv_multipart()
            print(client_addr, t1, req_func, t2, args)
#            assert t1 == t2 == b''
#            assert req_func in self.available_functions
            func = self.available_functions.get(req_func, default_func)
            args = json.loads(args)
            result = func(*args)
            await socket.send_multipart([client_addr, b'', result])
            self.nb_request += 1


if __name__ == "__main__":
    print(sys.argv)
    if len(sys.argv) < 2:
        sys.exit()
    worker_id = sys.argv[1]
    w = WorkerTask(worker_id)
