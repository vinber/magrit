# -*- coding: utf-8 -*-
"""
Three very basic variations to launch a R instance and connect
a python "rClient" instance to it (1-to-1) via a ZMQ (ipc) socket in order
to get results from statements evaluated by the R instance.

@author: mz
"""
from psutil import Popen, Process
import zmq
import sys
import os

if not os.path.isdir('/tmp/feeds'):
    try:
        os.mkdir('/tmp/feeds')
    except Exception as err:
        print(err)
        sys.exit()


class rClient:
    """Class for connecting with R zmq socket (REQ/REP pattern)"""
    def __init__(self, port, init, key=None, pid=None):
        global g2
        if init:
            self.process = Popen([
                'Rscript',
                '--vanilla',
                'R/Rserv_zmq2.R',
                '{}'.format(port)])
        elif pid:
            self.process = Process(pid)
        else:
            raise AttributeError('Something wrong happened, the client have '
                                 'to be initialised or have a pid')
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REQ)
        self.socket.connect('ipc:///tmp/feeds/'+str(port))
        self.key = key

    def rEval(self, command):
        self.socket.send(command)
        self.last_reply = self.socket.recv()
        return self.last_reply

    def disconnect(self):
        command = b"exitR()"
        self.socket.send(command)
        self.socket.recv()
        try:
            if self.key:
                g2.keys_mapping.pop(self.key)
            print('Exited session from {}'.format(self.key or self))
            self.process.kill()
            self.process.wait()
            self.socket.close()
        except Exception as err:
            print(err)

    def manual_disconnect(self):
        self.process.kill()
        self.process.wait()
        self.socket.close()


class rClient_pushpull:
    """Class for connecting with R zmq socket (PULL/PUSH pattern)"""
    def __init__(self, port, init, key=None, pid=None):
        global g2
        if init:
            self.process = Popen([
                'Rscript',
                '--vanilla',
                'R/Rserv_zmq_push_pull.R',
                '{}'.format(port)])
        elif pid:
            self.process = Process(pid)
        else:
            raise AttributeError('Something wrong happened, the client have '
                                 'to be initialised or have a pid')
        self.context = zmq.Context()
        self.socket_recv = self.context.socket(zmq.PULL)
        self.socket_send = self.context.socket(zmq.PUSH)
        self.socket_recv.connect('ipc:///tmp/feeds/'+str(port))
        self.socket_send.connect('ipc:///tmp/feeds/'+str(port+1))
        self.key = key

    def rEval(self, command):
        self.socket_send.send(command)
        self.last_reply = self.socket_recv.recv()
        return self.last_reply

    def disconnect(self):
        command = b"exitR()"
        self.socket_send.send(command)
        self.socket_recv.recv()
        try:
            print('Exited session from {}'.format(self.key or self))
            self.process.kill()
            self.process.wait()
            self.socket_send.close()
            self.socket_recv.close()
        except Exception as err:
            print(err)

    def manual_disconnect(self):
        self.socket_send.close()
        self.socket_recv.close()
        self.process.kill()
        self.process.wait()


import asyncio
import zmq.asyncio

class rClient_async:
    """Class for connecting with R zmq.asyncio socket (REQ/REP pattern)"""
    def __init__(self, port, init, ctx=None, key=None, pid=None):
        if init:
            self.process = Popen([
                'Rscript',
                '--vanilla',
                'R/Rserv_zmq2.R',
                '{}'.format(port)])
        elif pid:
            self.process = Process(pid)
        else:
            raise AttributeError('Something wrong happened, the client have '
                                 'to be initialised or have a pid')
        if not ctx:
            self.ctx = zmq.asyncio.Context()
        else:
            self.ctx = ctx
        self.socket = self.ctx.socket(zmq.REQ)
        self.socket.connect('ipc:///tmp/feeds/'+str(port))

    @asyncio.coroutine
    def rEval(self, command):
        yield from self.socket.send(command)
        return (yield from self.socket.recv())

    @asyncio.coroutine
    def disconnect(self):
        command = b"exitR()"
        yield from self.socket.send(command)
        yield from self.socket.recv()
        try:
            print('Exited session from {}'.format(self.key or self))
            self.process.kill()
            self.process.wait()
            self.socket.close()
        except Exception as err:
            print(err)

    def manual_disconnect(self):
        self.process.kill()
        self.process.wait()
        self.socket.close()


if __name__ == '__main__':  # Quick and dirty tests ...
    from random import randint
    from threading import Thread, Lock
    from time import time

    class g2:
        keys_mapping = {}

    seen_port = set()
    lock = Lock()

    def choose_port():
        while True:
            p = randint(1, 9999)
            if p not in seen_port:
                with lock:  
                    seen_port.add(p)
                return p

    def test_rep_req():
        p = choose_port()
        r = rClient(p, True)
        print(r.process)
        result = r.rEval(b'a <- c(1,2,3)*2')
        assert result == b'2, 4, 6'  # The server is running correctly,
        result = r.rEval(b'a * 10')  # ... success to do multiplication
        assert result ==  b'20, 40, 60'  # ... and to remember variable 
        r.disconnect()  # Let's try to disconnect it
        assert not r.process.is_running()  # Now the R process shouldn't be running
        return

    def test_pull_push():
        p = choose_port()
        r = rClient_pushpull(p, True)
        print(r.process)
        result = r.rEval(b'a <- c(1,2,3)*2')
        assert result == b'2, 4, 6'  # The server is running correctly,
        result = r.rEval(b'a * 10')  # ... success to do multiplication
        assert result ==  b'20, 40, 60'  # ... and to remember variable 
        r.disconnect()  # Let's try to disconnect it
        assert not r.process.is_running()  # Now the R process shouldn't be running
        return

    def test_async():
        ctx = zmq.asyncio.Context()  # Could probably have been in the rClient_async class too ?
        loop = zmq.asyncio.ZMQEventLoop()  # zmq.asyncio provides his own EventLoop
        asyncio.set_event_loop(loop)

        @asyncio.coroutine
        def process():
            p = choose_port()
            r = rClient_async(p, True, ctx)
            print(r.process)
            result = yield from r.rEval(b'a <- c(1,2,3)*2')
            assert result == b'2, 4, 6'  # The server is running correctly,
            result = yield from r.rEval(b'a * 10')  # ... success to do multiplication
            assert result ==  b'20, 40, 60'  # ... and to remember variable 
            yield from r.disconnect()  # Let's try to disconnect it (its also a coroutine)
            assert not r.process.is_running()  # Now the R process shouldn't be running
            return

        loop.run_until_complete(process())
        return

    def test_both():
        """
        Use python threads to launch the 3 tests together
        """
        st = time()
        threads = [
            Thread(target=test_rep_req),
            Thread(target=test_pull_push),
            Thread(target=test_async)]
        [t.start() for t in threads]
        [t.join() for t in threads]
        return '{:.3f} s\n'.format(time()-st)

    def test_many(fun=test_rep_req, launcher_threads=4):
        """
        Use python threads to launch many concurrent R process
        (-> high CPU usage)
        """
        st = time()
        threads = [Thread(target=fun) for i in range(launcher_threads)]
        [t.start() for t in threads]
        [t.join() for t in threads]
        return '{:.3f} s\n'.format(time()-st)

    def test_more(nb=50, **kwargs):
        for i in range(nb):
            test_many(**kwargs)
