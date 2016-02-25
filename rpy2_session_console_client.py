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
from collections import deque
from psutil import Popen, Process
from zmq.eventloop.ioloop import IOLoop
from zmq.eventloop.zmqstream import ZMQStream

if not os.path.isdir('/tmp/feeds'):
    try:
        os.mkdir('/tmp/feeds')
    except Exception as err:
        print(err)
        sys.exit()

url_worker = "ipc:///tmp/feeds/rpy2_workers"

class client_Rpy:
    """
    Basic request-reply ZMQ client sending R expression to evaluate
    by a Rpy2 worker and receiving json response (console output / status)
    """
    def __init__(self, client_url, i, init=True, worker_pid=None):
        if init:
            self.worker_process = prepare_worker(i)
        else:
            self.worker_process = Process(worker_pid)
        time.sleep(1)
        self.context = zmq.Context.instance()
        self.socket = self.context.socket(zmq.REQ)

        self.socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
        self.socket.connect(client_url)
        self.i = i

    def reval(self, expression):
        self.socket.send(expression.encode())
        print("{} send {}".format(self.i, expression))
        self.reply = self.socket.recv()
        print(self.reply.decode())
        return self.reply

    def disconnect_close(self):
        self.socket.send(b'CLOSE')
        time.sleep(0.5)
        self.worker_process.terminate()
#        self.worker_process.wait()
        self.socket.close()
#        self.context.term()
#        sys.exit(0)

class Rpy2_Queue(object):
    """Worker Queue class using ZMQStream/IOLoop for event dispatching"""

    def __init__(self, url_client, url_worker):
#        self.total_workers = total_workers
        self.available_workers = 0
        self.workers = set()

        context = zmq.Context()
        frontend = context.socket(zmq.ROUTER)
        frontend.bind(url_client)
        backend = context.socket(zmq.ROUTER)
        backend.bind(url_worker)

        self.backend = ZMQStream(backend)
        self.frontend = ZMQStream(frontend)
        self.backend.on_recv(self.handle_backend)
        self.loop = IOLoop.instance()

    def handle_backend(self, msg):
        # Queue worker address for routing clients/workers:
        worker_addr, empty, client_addr = msg[:3]
#        print('h_bakend', msg)
#        assert self.available_workers < self.total_workers
        # Add worker back to the list of workers
#        self.available_workers += 1
        self.workers.add(worker_addr)

        assert empty == b""
        # Third frame is READY or else a client reply address
        # If client reply, send rest back to frontend
    
        if client_addr != b"READY":
            empty, reply = msg[3:]
            assert empty == b""
#            assert worker_addr == client_addr
            self.frontend.send_multipart([worker_addr, b'', reply])

        else:
            self.frontend.on_recv(self.handle_frontend)

    def handle_frontend(self, msg):
        client_addr, empty, request = msg
#        print('h_frontend', msg)
        assert empty == b""

        assert client_addr in self.workers
#        worker_id = self.workers.remove(client_addr)

        self.backend.send_multipart([client_addr, b'', client_addr, b'', request])

        if request == b'CLOSE':
            self.workers.remove(client_addr)
            return
            
#        if self.available_workers == 0:
#            # stop receiving until workers become available again
#            self.frontend.stop_on_recv()

def prepare_worker(ident):
    os.chdir('/home/mz/p2/rpy2')
    # Start the R worker :
    r_process = Popen(['python3', 'rpy2_session_console_worker.py', '{}'.format(ident)])
    time.sleep(0.3)
    return r_process

def launch_queue(url_client):
    queue = Rpy2_Queue(url_client, url_worker)
    loop = IOLoop.instance().start()

#def launch_rpy_queue_worker(url_client):
#    rpy2_worker = prepare_worker(1)
#    thread_q = threading.Thread(target=launch_queue, args=(url_client))
#    thread_q.start()
#    time.sleep(0.3)
#    return rpy2_worker, thread_q

def test():
    from random import randint
    url_client = "ipc:///tmp/feeds/rpy2_clients"
    thread_q = threading.Thread(target=launch_queue, args=(url_client, ))
    thread_q.start()
    time.sleep(1)
    crp = client_Rpy(url_client, randint(1,7889))
    time.sleep(1)
    crp.reval('R.Version()')
    crp.reval('a<-c(1,2,3)')
    crp.reval('b<- c(19,22,33) * a *9')
    crp2 = client_Rpy(url_client, randint(8888,9999))
    crp2.reval('R.Version()')
    crp.reval('d <- data.frame(b)')
    crp.reval('print(d)')
    try:
        crp2.reval('b <- c(19,22,33) * a * 9')
    except: pass
    crp2.disconnect_close()
    crp.reval('plot(d)')
    crp.reval('d <- data.frame(b)')
    crp.disconnect_close()

if __name__ == '__main__':
    test()

