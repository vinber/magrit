# -*- coding: utf-8 -*-
"""
R client (through Rpy2) trying to be used in a background for a WebPage
providing a R interactive console.
@author: mz
"""
import asyncio
import time
import zmq
import sys
import os
from psutil import Popen, Process

if not os.path.isdir('/tmp/feeds'):
    try:
        os.mkdir('/tmp/feeds')
    except Exception as err:
        print(err)
        sys.exit()

url_worker = "ipc:///tmp/feeds/rpy2_workers"

class client_Rpy_async:
    """
    Basic request-reply ZMQ client sending R expression to evaluate
    by a Rpy2 worker and receiving json response (console output / status)
    """
    def __init__(self, client_url, i, ctx=None, init=True, worker_pid=None):
        if init:
            os.chdir('/home/mz/code/noname')
            # Start the R worker :
            self.worker_process = Popen(['python3', 'rpy2_console_worker.py', '{}'.format(i)])
            time.sleep(0.4)
        else:
            self.worker_process = Process(worker_pid)
        if not ctx:
            self.ctx = zmq.asyncio.Context()
        else:
            self.ctx = ctx
        self.socket = self.ctx.socket(zmq.REQ)

        self.socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
        self.socket.connect(client_url)
        self.i = i

    @asyncio.coroutine
    def reval(self, expression):
        yield from self.socket.send(expression.encode())
        return (yield from self.socket.recv())

    @asyncio.coroutine
    def disconnect_close(self):
        yield from self.socket.send(b'CLOSE')
        yield from asyncio.sleep(0.3)
        self.worker_process.terminate()
#        self.worker_process.wait()
        self.socket.close()
#        self.context.term()
#        sys.exit(0)


class client_Rpy:
    """
    Basic request-reply ZMQ client sending R expression to evaluate
    by a Rpy2 worker and receiving json response (console output / status)
    """
    def __init__(self, client_url, i, init=True, worker_pid=None):
        if init:
            os.chdir('/home/mz/code/noname')
            # Start the R worker :
            self.worker_process = Popen(['python3', 'rpy2_console_worker.py', '{}'.format(i)])
            time.sleep(0.4)
        else:
            self.worker_process = Process(worker_pid)
        self.context = zmq.Context.instance()
        self.socket = self.context.socket(zmq.REQ)

        self.socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
        self.socket.connect(client_url)
        self.i = i

    def reval(self, expression):
        self.socket.send(expression.encode())
        self.reply = self.socket.recv()
        return self.reply

    def disconnect_close(self):
        self.socket.send(b'CLOSE')
        time.sleep(0.3)
        self.worker_process.terminate()
#        self.worker_process.wait()
        self.socket.close()
        self.context.term()
#        sys.exit(0)
