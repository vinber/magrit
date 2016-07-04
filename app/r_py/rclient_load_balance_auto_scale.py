import asyncio
import zmq
import sys
import os
from collections import deque
from psutil import Popen
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

        @asyncio.coroutine
        def run(loop):
            yield from self.run_async_broker(loop, nb_r_process)

        try:
            self.loop.run_until_complete(run(self.loop))
        except KeyboardInterrupt:
            print('(async_broker) Interrrupting...')
            return

    def launch_r_worker(self, nb=1):
        for i in range(nb):
            id_ = str(len(self.r_process)+1)
            p = Popen(['Rscript', '--vanilla',
                       'R/R_worker_class.R', id_])
            self.r_process[id_] = p

    @asyncio.coroutine
    def run_async_broker(self, loop, init_r_process=None):
        self.context = Context()
        frontend = self.context.socket(zmq.ROUTER)
        frontend.bind(url_client)
        backend = self.context.socket(zmq.ROUTER)
        backend.bind(url_worker)
        print('(async_broker) is ON - Starting with {} R workers'.format(self.init_nb))

        poller = Poller()
        poller.register(backend, zmq.POLLIN)
        poller.register(frontend, zmq.POLLIN)

        if init_r_process and isinstance(init_r_process, int):
            self.launch_r_worker(init_r_process)

        while True:
            socks = yield from poller.poll(5*1000)
            socks = dict(socks)
            # poll on backend (msg/reply from workers) :
            if backend in socks and socks[backend] == zmq.POLLIN:
                message = yield from backend.recv_multipart()
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
                    yield from frontend.send_multipart([client_addr, b"", reply])
                    if b'exiting' in reply:
                        self.available_workers.remove(worker_addr)

            # poll on frontend (client request) only if workers are available :
            if frontend in socks and socks[frontend] == zmq.POLLIN:
                client_addr, empty, request, empty2, data = \
                    yield from frontend.recv_multipart()
                assert empty == b"" and empty2 == b''
                #  Dequeue and drop the next worker address
                worker_id = self.available_workers.popleft()
                yield from backend.send_multipart(
                    [worker_id, b"", client_addr, b"", request, b"", data])

        yield from asyncio.sleep(0.5)
        frontend.close()
        backend.close()
        self.loop.stop()
        print('(async_broker) exiting...')
        return 0



class SelfManagingWorkerQueue:
    # TODO: write some tests
    def __init__(self, init_R_process=2, start_broker=True,
                 max_workers=8, *args):
        # Check the path we plan to use for zmq communications is OK :
        if not os.path.isdir('/tmp/feeds'):
            try:
                os.mkdir('/tmp/feeds')
            except Exception as err:
                print(err)
                sys.exit()

        self.available_workers = deque()
        self.r_process = {}
        self.init_nb = init_R_process
        self.max_workers = max_workers

        # Start the R workers :
        if start_broker:
            self.start_broker(init_R_process)

    @property
    def available(self):
        return len(self.available_workers)

    def start_broker(self, nb_r_process):
        self.loop = ZMQEventLoop()
        asyncio.set_event_loop(self.loop)

        @asyncio.coroutine
        def run(loop):
            yield from self.run_async_broker(loop, nb_r_process)
        try:
            self.loop.run_until_complete(run(self.loop))
        except KeyboardInterrupt:
            print('(async_broker) Interrrupting...')
            return

    def launch_r_worker(self, nb=1):
        for i in range(nb):
            id_ = str(len(self.r_process)+1)
            p = Popen(['Rscript', '--vanilla',
                       'R/R_worker_class.R', id_])
            self.r_process[id_] = p

    def kill_r_worker(self, which_one=False):
        if which_one and isinstance(which_one, int):  # Kill the worker by its pid
            try:
                k, p = [(k, p) for k, p in self.r_process.items() if p.pid == which_one][0]
                p.terminate()
                p.kill()
                p.wait()
                addr = self.r_process.pop(k)
                try:
                    self.available_workers.remove(addr)
                except Exception as err:
                    print(err)
            except Exception as err:
                print('(async_broker) {}'.format(err))
        elif which_one and isinstance(which_one, (str, bytes)):  # Kill the worker using its identity
            try:
                which_one = which_one.decode()
            except:
                print('nope')
            p = self.r_process[which_one]
            p.terminate()
            p.kill()
            p.wait()
            self.r_process.pop(which_one)

    @asyncio.coroutine
    def run_async_broker(self, loop, init_r_process=None):
        self.context = Context()
        frontend = self.context.socket(zmq.ROUTER)
        frontend.bind(url_client)
        backend = self.context.socket(zmq.ROUTER)
        backend.bind(url_worker)
        print('(async_broker) is ON - Starting with {} R workers'.format(self.init_nb))

        poller = Poller()
        poller.register(backend, zmq.POLLIN)
        poller.register(frontend, zmq.POLLIN)

        if init_r_process and isinstance(init_r_process, int):
            self.launch_r_worker(init_r_process)

        while True: # Todo : refactor in smaller methods the inside of each conditions
            socks = yield from poller.poll(5*1000)
            socks = dict(socks)
            # poll on backend (msg/reply from workers) :
            if backend in socks and socks[backend] == zmq.POLLIN:
                message = yield from backend.recv_multipart()
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
                    yield from frontend.send_multipart([client_addr, b"", reply])
                    if b'exiting' in reply:
                        self.available_workers.remove(worker_addr)
            # poll on frontend (client request) only if workers are available :
            if self.available > 0:
                if frontend in socks and socks[frontend] == zmq.POLLIN:
                    client_addr, empty, request, empty2, data = \
                        yield from frontend.recv_multipart()
                    assert empty == b"" and empty2 == b''
                    #  Dequeue and drop the next worker address
                    worker_id = self.available_workers.popleft()
                    yield from backend.send_multipart(
                        [worker_id, b"", client_addr, b"", request, b"", data])

            elif frontend in socks and socks[frontend] == zmq.POLLIN:
                if len(self.r_process) < self.max_workers:
                # There isn't any workers available but there is pending activity
                # on the frontside, so lets start some new workers
                    self.launch_r_worker(1)
                    print('(async_broker) lauching a new R worker...')

            if not socks:
#                print("(async_broker) Availables workers : {}/{}".format(self.available, len(self.r_process)))
                if self.available >= self.init_nb + 1:
                    # Almost all workers have been started and are idle,
                    # so go back to the initial number of workers:
                    print('(async_broker) killing a R worker...')
                    try:
                        # Only one worker is killed on each "turn" (ie the polling timeout)
                        # to be still ready to handle hypothetic high activity :
                        self.kill_r_worker(self.available_workers.pop())
                    except Exception as err:
                            print('(async_broker) {}'.format(err))

        yield from asyncio.sleep(0.5)
        frontend.close()
        backend.close()
        self.loop.stop()
        print('(async_broker) exiting...')
        return 0


def start_queue(nb_process=4, max_process=12):
    Q = SelfManagingWorkerQueue(nb_process, True, max_process)
    # Penser a changer la limite du nombre de descripteurs de fichiers et du
    # nombre de fichiers ouverts pour l'utitilisateur qui execute ce programme
    # ... Changement dans /etc/security/limits.conf et dans /etc/sysctl.conf


def test():
    # To be launched in another terminal as the SelfManagingWorkerQueue
    # won't return / won't release the terminal used
    # until its end.
    import threading
    import zmq
    import ujson
    import time

    ctx = zmq.Context()
    result, threads = [], []
    rlock = threading.RLock()

    def R_client_fuw(client_url, request, data, context, i):
        """Basic client sending a request (REQ) to a ROUTER (the broker)"""
        socket = context.socket(zmq.REQ)
        socket.connect(client_url)
        socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
        socket.setsockopt(zmq.SNDBUF, int(len(request)+len(data)+40))
        socket.setsockopt(zmq.RCVBUF, int(len(request)+len(data))*2)
        socket.setsockopt(zmq.LINGER, 0)
        socket.send_multipart([request, b'', data])
        reply = socket.recv()
        socket.close()
        with rlock:
            result.append(reply)

    request = 'rnorm(n=x,mean=mean)'.encode()
    for i in range(3000):
        data = ujson.dumps({"x": i+1, "mean": 103-i/2}).encode()
        time.sleep(1/10000)
        t = threading.Thread(target=R_client_fuw,
                             args=('ipc:///tmp/feeds/clients', request,
                                   data, ctx, 'foo{}'.format(i)))
        t.start()
        threads.append(t)

    [th.join() for th in threads]

if __name__ == "__main__":
    if len(sys.argv) == 3:
        start_queue(int(sys.argv[1]), int(sys.argv[2]))
    elif len(sys.argv) == 2:
        start_queue(int(sys.argv[1]))
    else:
        start_queue()