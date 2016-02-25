# -*- coding: utf-8 -*-
"""
Version using asyncio
Just some basics tests to make a ZMQ broker trying to do load balancing
between "clients" (frontend) coming from a python environnement requesting
computations to be done in a R environnement (workers / backend-side).

@author: mz
"""
from psutil import Popen, signal
from collections import deque
import threading
import time
import asyncio
import zmq
import zmq.asyncio
import sys
import os

url_worker = 'ipc:///tmp/feeds/workers'
url_client = 'ipc:///tmp/feeds/clients'

result_list = []  # Results will be added as soon as a R worker will have send back the reply
rlock = threading.RLock()  # In order to safely add the results 

if not os.path.isdir('/tmp/feeds'):
    try:
        os.mkdir('/tmp/feeds')
    except Exception as err:
        print(err)
        sys.exit()

@asyncio.coroutine
def R_client_aio(client_url, expression, context, i):
    """Basic client sending a request (REQ) to a ROUTER (the broker)"""
    socket = context.socket(zmq.REQ)
    print(i)
    socket.connect(client_url)
    socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
    yield from socket.send(expression.encode())
    reply = yield from socket.recv()
    with rlock:
        result_list.append((i, reply))
    socket.close()

def prepare_worker(nb_worker):
    os.chdir('/home/mz/code/noname')
    # Start the R worker :
    r_process = [
        Popen(['Rscript', '--vanilla', 'R/R_worker_class.R', '{}'.format(i)])
        for i in range(nb_worker)]
    time.sleep(1)
    return r_process


@asyncio.coroutine
def launch_broker(loop, context, r_process, nb_clients):
    NBR_WORKERS = len(r_process)
    frontend = context.socket(zmq.ROUTER)
    frontend.bind(url_client)
    backend = context.socket(zmq.ROUTER)
    backend.bind(url_worker)

    # Queue of available workers (using collections.deque for fast append/pop)
    available_workers = 0
    workers_list = deque()

    # init poller
    poller = zmq.asyncio.Poller()
    poller.register(backend, zmq.POLLIN)
    poller.register(frontend, zmq.POLLIN)

    while True:
        socks = yield from poller.poll()
        socks = dict(socks)
        # Handle worker activity on backend
        if (backend in socks and socks[backend] == zmq.POLLIN):
            # Queue worker address for LRU routing
            message = yield from backend.recv_multipart()
            assert available_workers <= NBR_WORKERS
            worker_addr = message[0]

            # add worker back to the list of workers :
            available_workers += 1
            workers_list.append(worker_addr)

            # Should always be empty :
            empty = message[1]
            assert empty == b""

            # Third frame is 'R' (from a Ready R worker) or else a client reply address
            client_addr = message[2]
            # If it's a reply to a client: 
            if client_addr != b'R':
                empty = message[3]
                assert empty == b""
                reply = message[4]  # Send it back to the client :
                yield from frontend.send_multipart([client_addr, b"", reply])
                nb_clients -= 1
                if nb_clients < 1: break

        # poll on frontend only if workers are available
        if available_workers > 0:
            if (frontend in socks and socks[frontend] == zmq.POLLIN):

                client_addr, empty, request = yield from frontend.recv_multipart()
                assert empty == b""

                #  Dequeue and drop the next worker address
                available_workers += -1
                worker_id = workers_list.pop()

                yield from backend.send_multipart([worker_id, b"",
                                        client_addr, b"", request])

        # As there is neither support for CTRL+C nor a real eventloop in this test:
        if nb_clients < 1: break

    yield from asyncio.sleep(1)

    frontend.close()
    backend.close()
    context.term()


def start_async_broker(ctx, r_process, nb_clients):
    try:
        loop = zmq.asyncio.ZMQEventLoop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(launch_broker(loop, ctx, r_process, nb_clients))
    except KeyboardInterrupt:
        print('\nFinished (interrupted)')


def test(nb_worker = 4):
    result_list.clear()
    ctx = zmq.asyncio.Context()
    # Set a bunch a expression to evaluate (less or more coslty) :
    expressions = [
        'R.Version()', "b<-log1p(seq(1, 200))", "mat <- matrix(runif(400*400, min=-8, max=1379852), 400)",
        "a <- c(1,2,3,4)", "mat12 <- matrix(runif(72*72), 72) / 6", "d<-log1p(seq(7, 250))",
        "mat12 <- matrix(runif(90*90), 90) * matrix(runif(90*90), 90)",
        "d<-log1p(seq(77, 150))", "mat4 <- log10(matrix(runif(200*200), 200))",
        "log10(diag(matrix(123*123), 123))", "sequ <- seq(1,1000)", "ct <- Sys.time()",
        "abs(data.frame(log10(diag(matrix(runif(500*425), 500))) * cospi((1:500)**-0.3))) #! 0.01",
        "matx <- matrix(runif(200*200), 200)", "matz <- matrix(runif(555*555), 555) / 3.5",
        "maty <- matrix(runif(200*200), 200)", "maty <- matrix(runif(200*200), 200)",
        'R.Version();diag(matrix(runif(700*700), 350)) * sd(diag(matrix(runif(200*200), 200)))**-0.5',
        "b <- log1p(seq(1, 200))", "mat <- matrix(runif(400*400), 400)",
        "a <- c(1, 2, 3, 4, 5); b <- c(6, 4, 7, 8, 9); a * 2 + 3 * b",   # << If persitance is needed a block of statements can be given separate by semi-colon
        "a<-c(1,2,3,4)", "mat12 <- matrix(runif(72*72), 72) / 6", "d<-log1p(seq(7, 250))",
        "mat12 <- matrix(runif(90*90), 90) * matrix(runif(90*90), 90)",
        "d<-log1p(seq(77, 150))", "mat4 <- matrix(runif(200*200), 200)", "ct",
        "w <- data.frame(1:200 %*% matrix(runif(200*200), 200))",
        "matx <- matrix(runif(200*200), 200)", "std_matz <- sd(matrix(runif(200*200), 200))",
        "maty <- matrix(runif(200*200), 200)"]
    
    # Launch bakcground R workers :
    r_process = prepare_worker(nb_worker)

#    client_tasks = []
#    for i in range(len(expressions)):
#        task = asyncio.ensure_future(R_client_aio(url_client, expressions[i], ctx, i))
#        client_tasks.append(task)


    threads = [
        threading.Thread(target=R_client_aio, args=(url_client, expressions[i], ctx, i))
        for i in range(len(expressions))
        ]
    [t.start() for t in threads] # They should all try to connect to the broker and be routed to an available worker ...
    start_async_broker(ctx, r_process, len(expressions))
    [t.join() for t in threads]  # ...then each client add its result to a list and quit

    # Close the bakcground R workers :
    for process in r_process:
        process.send_signal(signal.SIGINT)
#        process.terminate()
        process.wait()

    # Each expression to evaluate should have yielded to a result :
    assert len(result_list) == len(expressions)