# -*- coding: utf-8 -*-
"""
R client (through Rpy2) trying to be used in a background for a WebPage
providing a R interactive console.
@author: mz
"""
import threading
import time
import zmq
import sys
import os
from zmq.eventloop.ioloop import IOLoop
from zmq.eventloop.zmqstream import ZMQStream
from rpy2_console_client import client_Rpy

if not os.path.isdir('/tmp/feeds'):
    try:
        os.mkdir('/tmp/feeds')
    except Exception as err:
        print(err)
        sys.exit()

url_worker = "ipc:///tmp/feeds/rpy2_workers"


class Rpy2_Queue(object):
    """Worker Queue class using ZMQStream/IOLoop for event dispatching"""

    def __init__(self, url_client, url_worker):
        """
        To route clients (R pseudo-console users)
        to rpy2 workers in a 1-to-1 way.
        """
#        self.available_workers = 0
        self.workers = set()

        context = zmq.Context(4)
        frontend = context.socket(zmq.ROUTER)
        frontend.bind(url_client)
        backend = context.socket(zmq.ROUTER)
        backend.bind(url_worker)

        self.backend = ZMQStream(backend)
        self.frontend = ZMQStream(frontend)
        print('rpy2 broker for console sessions in ON')
        self.backend.on_recv(self.handle_backend)
        self.loop = IOLoop.instance()

    def handle_backend(self, msg):
        # Queue worker address for routing clients/workers:
        worker_addr, empty, client_addr = msg[:3]
        self.workers.add(worker_addr)
        assert empty == b""
        # Third frame is READY or else a client reply address
        # If client reply, send rest back to frontend :
        if client_addr != b"READY":
            empty, reply = msg[3:]
            assert empty == b""
            assert worker_addr == client_addr  # Each client has its own worker
            self.frontend.send_multipart([worker_addr, b'', reply])
        else:
            self.frontend.on_recv(self.handle_frontend)

    def handle_frontend(self, msg):
        client_addr, empty, request = msg
        assert empty == b""
        # If the client address is in the worker queue, its worker is connected
        self.backend.send_multipart([client_addr, b'', client_addr, b'', request])
        # Pop the worker out of the list on the request of the client
        if request == b'CLOSE':
            self.workers.remove(client_addr)
            return

def launch_queue(url_client):
    queue = Rpy2_Queue(url_client, url_worker)
    loop = IOLoop.instance().start()
    return loop, queue

def test():
    from random import randint
    url_client = "ipc:///tmp/feeds/rpy2_clients"
    thread_q = threading.Thread(target=launch_queue, args=(url_client, ))
    thread_q.start()
    time.sleep(1)
    crp = client_Rpy(url_client, randint(1, 7889))
    time.sleep(1)
    crp.reval('R.Version()')
    crp.reval('a<-c(1,2,3)')
    crp.reval('b<- c(19,22,33) * a *9')
    crp2 = client_Rpy(url_client, randint(8888, 9999))
    crp2.reval('R.Version()')
    crp.reval('d <- data.frame(b)')
    crp.reval('print(d)')
    crp.reval('plot(d)')  # Should return a the corresponding svg 
    crp2.reval('b<- c(19,22,33)')
    crp2.reval('b <- c(19,22,33) * a * 9')  # Should complain (as 'a' is not defined)
    crp.reval('d <- data.frame(b)')
    crp.disconnect_close()
    crp2.disconnect_close()

if __name__ == '__main__':
    test()

#import asyncio
#import zmq.asyncio
#
#def launch_queue_async(url_client):
#    queue = Rpy2_Queue_async(url_client, url_worker)
#
#class Rpy2_Queue_async:
#    """Worker Queue class using ZMQStream/IOLoop for event dispatching"""
#
#    def __init__(self, url_client, url_worker):
#        """
#        To route clients (R pseudo-console users)
#        to rpy2 workers in a 1-to-1 way.
#        """
#        self.ctx = zmq.asyncio.Context()
#        self.loop = zmq.asyncio.ZMQEventLoop()
#        asyncio.set_event_loop(self.loop)
##        self.available_workers = 0
#        self.workers = set()
#
#        frontend = self.ctx.socket(zmq.ROUTER)
#        backend = self.ctx.socket(zmq.ROUTER)
#        frontend.bind(url_client)
#        backend.bind(url_worker)
#
##        poll_both = Poller()
##        poll_both.register(frontend, zmq.POLLIN)
##        poll_both.register(backend, zmq.POLLIN)
#
##        context = zmq.Context(4)
##        frontend = context.socket(zmq.ROUTER)
##        frontend.bind(url_client)
##        backend = context.socket(zmq.ROUTER)
##        backend.bind(url_worker)
#
#        self.backend = ZMQStream(backend)
#        self.frontend = ZMQStream(frontend)
#        print('rpy2 broker for console sessions in ON')
##        asyncio.Future(loop=self.loop,
##                       fun=self.backend.on_recv(self.handle_backend))
##        self.backend.on_recv(self.handle_backend)
##        self.loop = IOLoop.instance()
#
#    
#
#    @asyncio.coroutine
#    def handle_backend(self, msg):
#        # Queue worker address for routing clients/workers:
#        worker_addr, empty, client_addr = msg[:3]
#        self.workers.add(worker_addr)
#        assert empty == b""
#        # Third frame is READY or else a client reply address
#        # If client reply, send rest back to frontend :
#        if client_addr != b"READY":
#            empty, reply = msg[3:]
#            assert empty == b""
#            assert worker_addr == client_addr  # Each client has its own worker
#            yield from self.frontend.send_multipart([worker_addr, b'', reply])
#        else:
#            self.frontend.on_recv(self.handle_frontend)
#
#    @asyncio.coroutine
#    def handle_frontend(self, msg):
#        client_addr, empty, request = msg
#        assert empty == b""
#        # If the client address is in the worker queue, its worker is connected
#        assert client_addr in self.workers
#
#        yield from self.backend.send_multipart([client_addr, b'', client_addr, b'', request])
#
#        # Pop the worker out of the list on the request of the client
#        if request == b'CLOSE':
#            self.workers.remove(client_addr)
#            return


#class client_Rpy:
#    """
#    Basic request-reply ZMQ client sending R expression to evaluate
#    by a Rpy2 worker and receiving json response (console output / status)
#    """
#    def __init__(self, client_url, i, init=True, worker_pid=None):
#        if init:
#            self.worker_process = prepare_worker(i)
#        else:
#            self.worker_process = Process(worker_pid)
#        time.sleep(0.2)
#        self.context = zmq.Context.instance()
#        self.socket = self.context.socket(zmq.REQ)
#
#        self.socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
#        self.socket.connect(client_url)
#        self.i = i
#
#    def reval(self, expression):
#        self.socket.send(expression.encode())
##        print("{} send {}".format(self.i, expression))
#        self.reply = self.socket.recv()
#        return self.reply
#
#    def disconnect_close(self):
#        self.socket.send(b'CLOSE')
#        time.sleep(0.3)
#        self.worker_process.terminate()
##        self.worker_process.wait()
#        self.socket.close()
##        self.context.term()
##        sys.exit(0)
