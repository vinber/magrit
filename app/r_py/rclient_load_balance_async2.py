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


class SelfManagingWorkerQueue:
    def __init__(self, nb_r_process = 2, start_broker = True,
                 max_workers = 8, *args):
        # Check the path we plan to use for zmq communications is OK :
        if not os.path.isdir('/tmp/feeds'):
            try:
                os.mkdir('/tmp/feeds')
            except Exception as err:
                print(err)
                sys.exit()

        self.available_workers = deque()
        self.r_process = {}
        self.init_nb = nb_r_process
        self.max_workers = max_workers
        self.idle = 0
        self.waiting_clients = 0
        # Start the R workers :
        if nb_r_process:
            self.launch_r_worker(nb_r_process)

        if start_broker:
            self.loop = ZMQEventLoop()
            asyncio.set_event_loop(self.loop)

            @asyncio.coroutine
            def run(loop):
                yield from self.run_async_broker(loop)
            try:
                self.loop.run_until_complete(run(self.loop))
            except KeyboardInterrupt:
                print('(async_broker) Interrrupting...')
                return

    def launch_r_worker(self, nb=1):
        for i in range(nb):
            p = Popen(['Rscript', '--vanilla',
                       '/home/mz/code/noname-stuff/app/R/R_worker_class.R', '{}'.format(len(self.r_process)+1)])
            self.r_process[str(len(self.r_process)+1)] = p

#    @asyncio.coroutine
    def kill_r_worker(self, which_one=False):
        if which_one and isinstance(which_one, int):  # Kill the worker by its pid
            try:
                k, p = [(k, p) for k, p in self.r_process.items() if p.pid == which_one][0]
                p.terminate()
                p.kill()
                p.wait()
                addr = self.r_process.pop(k)
                try: self.available_workers.remove(addr)
                except ValueError: pass
            except Exception as err:
                print('err')
#            p.wait()
#        elif which_one and isinstance(which_one, (str, bytes)):
#            pass # Not implemented yet 
#        else:
#            socket = self.context.socket(zmq.REQ)
#            socket.connect(url_client)
#            socket.setsockopt_string(zmq.IDENTITY, '{}'.format("ManageR"))
#            yield from socket.send_multipart([b'CLOSE', b'', b''])
#            reply = yield from socket.recv()
#            socket.close()
#            r_pid = reply.split()[0]
#            self.r_process[r_pid].pop()

    @asyncio.coroutine
    def run_async_broker(self, loop):
        self.context = Context()
        frontend = self.context.socket(zmq.ROUTER)
        frontend.bind(url_client)
        backend = self.context.socket(zmq.ROUTER)
        backend.bind(url_worker)
        print('(async_broker) is ON - Starting with {} R workers'.format(self.init_nb))
        available_workers = 0

        poller = Poller()
        poller.register(backend, zmq.POLLIN)
        poller.register(frontend, zmq.POLLIN)

        while True: # Todo : refactor in smaller methods the inside of each conditions
            socks = yield from poller.poll(10*1000)
            socks = dict(socks)

            # poll on backend (msg/reply from workers) :
            if backend in socks and socks[backend] == zmq.POLLIN:
                message = yield from backend.recv_multipart()
                assert available_workers <= len(self.r_process)
                worker_addr = message[0]
                available_workers += 1
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
                        available_workers -= 1
                        self.available_workers.remove(worker_addr)
            # poll on frontend (client request) only if workers are available :
            if available_workers > 0:
                if frontend in socks and socks[frontend] == zmq.POLLIN:
                    client_addr, empty, request, empty2, data = \
                        yield from frontend.recv_multipart()
                    assert empty == b"" and empty2 == b''
                    #  Dequeue and drop the next worker address
                    available_workers += -1
                    worker_id = self.available_workers.popleft()
                    yield from backend.send_multipart(
                        [worker_id, b"", client_addr, b"", request, b"", data])

            elif frontend in socks and socks[frontend] == zmq.POLLIN:
                if len(self.r_process) < self.max_workers:
                # There isn't any workers available but there is pending activity
                # on the frontside, so lets start some new workers
                    self.launch_r_worker(1)
                    print('(async_broker) lauchin a new R worker...')
                    self.waiting_clients = 0

            if not socks:
                print("(async_broker) Idle workers : {}".format(len(self.r_process)))
                if len(self.r_process) >= self.max_workers - 2:
                    self.waiting_clients = 0
                    # Almost all workers have been started and are idle,
                    # so go back to the initial number of workers: 
                    to_kill = len(self.r_process) - self.init_nb + 1
                    for i in range(to_kill):
                        print('(async_broker) killing a R worker...')
                        try:
                            w_pid = list(self.r_process.values())[i].pid
                        except Exception as err:
                            print('(async_broker) {}'.format(err))
                            break
                        self.kill_r_worker(w_pid)

        yield from asyncio.sleep(0.5)
        frontend.close()
        backend.close()
        # context.term()
        self.loop.stop()
        print('(async_broker) exiting...')
        return 0


def test():
    import threading
    import zmq
    import ujson
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
        socket.send_multipart([request, b'', data])
        reply = socket.recv()
        socket.close()
        with rlock:
            result.append(reply)

    request = 'rnorm(x=x,mean=mean)'.encode()
    for i in range(200):
        data = ujson.dumps({"x": i+1, "mean": 103-i/2}).encode()
        t = threading.Thread(target=R_client_fuw, args=
             ('ipc:///tmp/feeds/clients', request, data, ctx, 'foo{}'.format(i))
            )
        t.start()
        threads.append(t)
    
    [t.join() for t in threads]