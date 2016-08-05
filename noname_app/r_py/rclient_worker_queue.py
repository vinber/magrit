#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-
import asyncio
import logging
import zmq
import sys
import os
from collections import deque
from psutil import Popen
from threading import Thread
from zmq.asyncio import Context, Poller, ZMQEventLoop

url_worker = 'ipc:///tmp/feeds/workers'
url_client = 'ipc:///tmp/feeds/clients'


async def R_client_fuw_async(client_url, request, data, context, i):
    """Basic client sending a request (REQ) to a ROUTER (the broker)"""
    socket = context.socket(zmq.REQ)
    socket.connect(client_url)
    socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
    socket.setsockopt(zmq.SNDBUF, int(len(request)+len(data)+40))
    socket.setsockopt(zmq.RCVBUF, int(len(request)+len(data))*2)
    socket.setsockopt(zmq.LINGER, 0)
    await socket.send_multipart([request, b'', data])
    reply = await socket.recv()
    socket.close()
    return reply

class LogPipe(Thread):
    '''
    Code taken from
    http://codereview.stackexchange.com/questions/6567/redirecting-subprocesses-output-stdout-and-stderr-to-the-logging-module
    '''
    def __init__(self, logger):
        """
        Setup the object with an existing logger and start the thread
        """
        Thread.__init__(self)
        self.daemon = False
        self.logger = logger
        self.fdRead, self.fdWrite = os.pipe()
        self.pipeReader = os.fdopen(self.fdRead)
        self.start()

    def fileno(self):
        """Return the write file descriptor of the pipe
        """
        return self.fdWrite

    def run(self):
        """Run the thread, logging everything.
        """
        for line in iter(self.pipeReader.readline, ''):
            self.logger.info(line.strip('\n'))
        self.pipeReader.close()

    def close(self):
        """Close the write end of the pipe.
        """
        os.close(self.fdWrite)

class RWorkerQueue:
    # TODO: write some tests
    def __init__(self, init_R_process=2, start_broker=True, *args):
        # Check the path we plan to use for zmq communications is OK :
        if not os.path.isdir('/tmp/feeds'):
            try:
                os.mkdir('/tmp/feeds')
            except Exception as err:
                print(err)
                sys.exit()

        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("noname_app.async_brooker")
        self.logpipe = LogPipe(self.logger)
        self.available_workers = deque()
        self.r_process = {}
        self.init_nb = init_R_process

        # Start the R workers :
        if start_broker:
            self.start_broker(init_R_process)

    @property
    def available(self):
        return len(self.available_workers)

    def start_broker(self, nb_r_process):
        self.loop = ZMQEventLoop()
        asyncio.set_event_loop(self.loop)

        async def run(loop):
            await self.run_async_broker(loop, nb_r_process)

        try:
            self.loop.run_until_complete(run(self.loop))
        except KeyboardInterrupt:
            self.logpipe.close()
            self.logger.info('(async_broker) Interrrupting...')
            return

    def launch_r_worker(self, nb=1):
        for i in range(nb):
            id_ = str(len(self.r_process)+1)
            p = Popen(['Rscript', '--vanilla', 'R/R_worker_class.R', id_],
                      stdout=self.logpipe, stderr=self.logpipe)
            # TODO: Use something like prlimit to control processus ressource
            self.r_process[id_] = p

    async def run_async_broker(self, loop, init_r_process=None):
        self.context = Context()
        frontend = self.context.socket(zmq.ROUTER)
        frontend.bind(url_client)
        backend = self.context.socket(zmq.ROUTER)
        backend.bind(url_worker)
        self.logger.info('(async_broker) is ON - Starting with {} R workers'
                         .format(self.init_nb))

        poller = Poller()
        poller.register(backend, zmq.POLLIN)
        poller.register(frontend, zmq.POLLIN)

        if init_r_process and isinstance(init_r_process, int):
            self.launch_r_worker(init_r_process)

        while True:
            socks = await poller.poll(5000)
            socks = dict(socks)
            # poll on backend (msg/reply from workers) :
            if backend in socks and socks[backend] == zmq.POLLIN:
                message = await backend.recv_multipart()
                assert self.available <= len(self.r_process)
                worker_addr = message[0]
                self.available_workers.append(worker_addr)
                # Should always be empty :
                assert message[1] == b""
                # Third frame is 'R' (from a Ready R worker)
                # ... or else a client reply address
                client_addr = message[2]
                # If it's a reply to a client:
                if client_addr != b'R':
                    assert message[3] == b""
                    reply = message[4]  # Send it back to the client :
                    await frontend.send_multipart([client_addr, b"", reply])
                    if b'exiting' in reply:
                        self.available_workers.remove(worker_addr)

            # poll on frontend (client request) only if workers are available :
            if frontend in socks and socks[frontend] == zmq.POLLIN:
                client_addr, empty, request, empty2, data = \
                    await frontend.recv_multipart()
                assert empty == b"" and empty2 == b''
                #  Dequeue and drop the next worker address
                worker_id = self.available_workers.popleft()
                await backend.send_multipart(
                    [worker_id, b"", client_addr, b"", request, b"", data])

        await asyncio.sleep(0.5)
        frontend.close()
        backend.close()
        self.loop.stop()
        self.logger.info('(async_broker) exiting...')
        return 0


def start_queue(nb_process=4):
    Q = RWorkerQueue(nb_process, True)
    # Penser a changer la limite du nombre de descripteurs de fichiers et du
    # nombre de fichiers ouverts pour l'utitilisateur qui execute ce programme
    # si beaucoup de workers R sont lancés
    # ... Changement dans /etc/security/limits.conf et dans /etc/sysctl.conf

if __name__ == "__main__":
    if len(sys.argv) == 2:
        start_queue(int(sys.argv[1]))
    else:
        start_queue()
