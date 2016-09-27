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


#async def client_fuw_async(request, data, context, i, client_url):
#    """Basic client sending a request (REQ) to a ROUTER (the broker)"""
#    socket = context.socket(zmq.REQ)
#    socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
#    socket.setsockopt(zmq.SNDBUF, int(len(request)+len(data)+40))
#    socket.setsockopt(zmq.RCVBUF, int(len(request)+len(data))*2)
#    socket.setsockopt(zmq.LINGER, 0)
#    socket.connect(client_url)
#    await socket.send_multipart([request, b'', data])
#    reply = await socket.recv()
#    socket.close()
#    return reply


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


class WorkerPoolQueue:
    # TODO: write some tests
    def __init__(self, n_process, urls, start_broker=True):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("noname_app.async_brooker")
        self.logpipe = LogPipe(self.logger)
        self.available_workers = deque()
        self.worker_process = {}
        self.init_nb = n_process
        self.url_client, self.url_worker = urls
        self.protocol = "ipc" if "ipc" in self.url_client else "tcp"
        # Check the path we plan to use for zmq communications is OK :
        if "ipc" in self.url_client:
            if not os.path.isdir('/tmp/feeds'):
                try:
                    os.mkdir('/tmp/feeds')
                except Exception as err:
                    print(err)
                    sys.exit()

        # Start the workers :
        if start_broker:
            self.start_broker(n_process)

    @property
    def available(self):
        return len(self.available_workers)

    def start_broker(self, n_process):
        self.loop = ZMQEventLoop()
        asyncio.set_event_loop(self.loop)

        async def run(loop):
            await self.run_async_broker(loop, n_process)

        try:
            self.loop.run_until_complete(run(self.loop))
        except KeyboardInterrupt:
            self.logpipe.close()
            self.logger.info('(async_broker) Interrrupting...')
            return

    def launch_worker(self, nb=1):
        for i in range(nb):
            id_ = str(len(self.worker_process)+1)
            p = Popen([sys.executable, "worker.py", id_, self.protocol],
                      stdout=self.logpipe, stderr=self.logpipe)
            # TODO: Use something like prlimit to control processus ressource
            self.worker_process[id_] = p

    async def run_async_broker(self, loop, n_process=None):
        self.context = Context()
        frontend = self.context.socket(zmq.ROUTER)
        frontend.bind(self.url_client)
        backend = self.context.socket(zmq.ROUTER)
        backend.bind(self.url_worker)
        self.logger.info('(async_broker) is ON - Starting with {} workers'
                         .format(self.init_nb))
        self.logger.info('(async_broker) Protocol used : {}'
                         .format(self.protocol))
        poller = Poller()
        poller.register(backend, zmq.POLLIN)
        poller.register(frontend, zmq.POLLIN)

        if n_process and isinstance(n_process, int):
            self.launch_worker(n_process)

        while True:
            socks = await poller.poll(5000)
            socks = dict(socks)
            # poll on backend (msg/reply from workers) :
            if backend in socks and socks[backend] == zmq.POLLIN:
                message = await backend.recv_multipart()
                assert self.available <= len(self.worker_process)
                worker_addr = message[0]
                self.available_workers.append(worker_addr)
                # Should always be empty :
                assert message[1] == b""
                # Third frame is 'READY' (from a Ready worker)
                # ... or else a client reply address
                client_addr = message[2]
                # If it's a reply to a client:
                if client_addr != b'READY':
                    assert message[3] == b""
                    reply = message[4:]  # Send it back to the client :
                    asyncio.ensure_future(
                        frontend.send_multipart([client_addr, b""] + reply))
                    if b'exiting' in reply:
                        self.available_workers.remove(worker_addr)

            # poll on frontend (client request) only if workers are available :
            if frontend in socks and socks[frontend] == zmq.POLLIN:
                client_addr, empty, request, empty2, data, empty3, serializ = \
                    await frontend.recv_multipart()
                assert empty == b"" and empty2 == b''
                #  Dequeue and drop the next worker address
                worker_id = self.available_workers.popleft()
                asyncio.ensure_future(backend.send_multipart(
                    [worker_id, b"", client_addr, b"", request, b"", data, b"", serializ]))

        await asyncio.sleep(0.5)
        frontend.close()
        backend.close()
        self.loop.stop()
        self.logger.info('(async_broker) exiting...')
        return 0


def start_queue(nb_process=4,
                urls=('ipc:///tmp/feeds/clients', 'ipc:///tmp/feeds/workers')):
    Q = WorkerPoolQueue(nb_process, urls, True)
    # Penser a changer la limite du nombre de descripteurs de fichiers et du
    # nombre de fichiers ouverts pour l'utitilisateur qui execute ce programme
    # si beaucoup de workers sont lancés
    # ... Changement dans /etc/security/limits.conf et dans /etc/sysctl.conf


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit()
    nb_process = int(sys.argv[1])
    urls = {
        "ipc": ('ipc:///tmp/feeds/clients', 'ipc:///tmp/feeds/workers'),
        "tcp": ('tcp://127.0.0.1:5559', 'tcp://127.0.0.1:5560')
    }.get(sys.argv[2], None)
    if not urls:
        sys.exit()

    start_queue(nb_process, urls)
