# -*- coding: utf-8 -*-
"""
The same as in the file rclient_load_balance.py but using asyncio / zmq.asyncio
methods for the client function and for the broker.

@author: mz
"""
import asyncio
import time
import zmq
import sys
import os
from collections import deque
from psutil import Popen
from zmq.asyncio import Context, Poller, ZMQEventLoop


url_worker = 'ipc:///tmp/feeds/workers'
url_client = 'ipc:///tmp/feeds/clients'


@asyncio.coroutine
def R_client_fuw_async(client_url, request, data, context, i):
    """Basic client sending a request (REQ) to a ROUTER (the broker)"""
    socket = context.socket(zmq.REQ)
    socket.connect(client_url)
    socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
    socket.setsockopt(zmq.SNDBUF, int(len(request)+len(data)+40))
    socket.setsockopt(zmq.RCVBUF, int(len(request)+len(data))*2)
    yield from socket.send_multipart([request, b'', data])
    reply = yield from socket.recv()
    socket.close()
    return reply

# Todo : re-implement this in a class (with some functionnality to be safely
# managed from the web app and to safely manage the R workers)
@asyncio.coroutine
def run_async_broker(loop, nb_r_process):
    NBR_WORKERS = nb_r_process
    context = Context()
    frontend = context.socket(zmq.ROUTER)
    frontend.bind(url_client)
    backend = context.socket(zmq.ROUTER)
    backend.bind(url_worker)
    print('(async_broker) is ON - expecting {} R workers'.format(NBR_WORKERS))
    available_workers = 0
    workers_list = deque()

    poller = Poller()
    poller.register(backend, zmq.POLLIN)
    poller.register(frontend, zmq.POLLIN)

    while True:
        socks = yield from poller.poll()
        socks = dict(socks)

        # poll on backend (msg/reply from workers) :
        if backend in socks and socks[backend] == zmq.POLLIN:
            message = yield from backend.recv_multipart()
            assert available_workers <= NBR_WORKERS
            worker_addr = message[0]
            available_workers += 1
            workers_list.append(worker_addr)
            # Should always be empty :
            assert message[1] == b""
            # Third frame is 'R' (from a Ready R worker) 
            # ... or else a client reply address
            client_addr = message[2]
            # If it's a reply to a client: 
            if client_addr != b'R':
                assert message[3] == b""
                reply = message[4]  # Send it back to the client :
                yield from frontend.send_multipart([client_addr, b"", reply])

        # poll on frontend (client request) only if workers are available :
        if available_workers > 0:
            if frontend in socks and socks[frontend] == zmq.POLLIN:
                client_addr, empty, request, empty2, data = \
                    yield from frontend.recv_multipart()
                assert empty == b"" and empty2 == b''
                #  Dequeue and drop the next worker address
                available_workers += -1
                worker_id = workers_list.popleft()
                yield from backend.send_multipart(
                    [worker_id, b"", client_addr, b"", request, b"", data])

    yield from asyncio.sleep(0.5)
    frontend.close()
    backend.close()
    # context.term()
    loop.stop()
    print('(async_broker) exiting...')
    return 0


def prepare_worker(nb_worker):
    # Check the path we plan to use for zmq communications is OK :
    if not os.path.isdir('/tmp/feeds'):
        try:
            os.mkdir('/tmp/feeds')
        except Exception as err:
            print(err)
            sys.exit()

    # Start the R workers :
    r_process = [
        Popen(['Rscript', '--vanilla', 'R/R_worker_class.R', '{}'.format(i)])
        for i in range(nb_worker)]
    time.sleep(0.4)
    return r_process

def launch_async_broker(nb_r_process, *args):
    try:
        loop = ZMQEventLoop()
        asyncio.set_event_loop(loop)

        @asyncio.coroutine
        def run(loop):
            yield from run_async_broker(loop, nb_r_process)
        loop.run_until_complete(run(loop))

    except Exception as err:
        print('(async_broker) interupted with {}'.format(err))
