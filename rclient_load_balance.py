# -*- coding: utf-8 -*-
"""
Just some basics tests to make a ZMQ broker trying to do load balancing
between "clients" (frontend) coming from a python environnement requesting
computations to be done in a R environnement (workers / backend-side).

@author: mz
"""
from psutil import Popen, signal
from collections import deque
#import ujson as json
import threading
import time
import zmq
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

def R_client_thread(client_url, expression, context, i):
    """Basic client sending a request (REQ) to a ROUTER (the broker)"""
    socket = context.socket(zmq.REQ)
    socket.connect(client_url)
    socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
    socket.send(expression.encode())
    reply = socket.recv()
    with rlock:
        result_list.append((i, reply))
    socket.close()

def R_client_return(client_url, expression, context, i):
    """Basic client sending a request (REQ) to a ROUTER (the broker)"""
    socket = context.socket(zmq.REQ)
    socket.connect(client_url)
    socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
    print("Client {} send {}".format(i, expression))
    socket.send(expression.encode())
    reply = socket.recv()
    socket.close()
    return reply.decode()

def prepare_worker(nb_worker):
    os.chdir('/home/mz/code/noname')
    # Start the R worker :
    r_process = [
        Popen(['Rscript', '--vanilla', 'R/R_worker_class.R', '{}'.format(i)])
        for i in range(nb_worker)]
    time.sleep(0.5)
    return r_process


def launch_broker(context, r_process, nb_clients):
    NBR_WORKERS = len(r_process)
    frontend = context.socket(zmq.ROUTER)
    frontend.bind(url_client)
    backend = context.socket(zmq.ROUTER)
    backend.bind(url_worker)

    # Queue of available workers (using collections.deque for fast append/pop)
    available_workers = 0
    workers_list = deque()

    # init poller
    poller = zmq.Poller()
    poller.register(backend, zmq.POLLIN)
    poller.register(frontend, zmq.POLLIN)

    while True:
        socks = dict(poller.poll())
        # Handle worker activity on backend
        if (backend in socks and socks[backend] == zmq.POLLIN):
            # Queue worker address for LRU routing
            message = backend.recv_multipart()
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
                frontend.send_multipart([client_addr, b"", reply])
#                nb_clients -= 1
#                if nb_clients < 1: break

        # poll on frontend only if workers are available
        if available_workers > 0:
            if (frontend in socks and socks[frontend] == zmq.POLLIN):

                client_addr, empty, request = frontend.recv_multipart()
                assert empty == b""

                #  Dequeue and drop the next worker address
                available_workers += -1
                worker_id = workers_list.popleft()

                backend.send_multipart([worker_id, b"",
                                        client_addr, b"", request])

#        # As there is neither support for CTRL+C nor a real eventloop in this test:
#        if nb_clients < 1: break

    time.sleep(0.2)
    frontend.close()
    backend.close()
    context.term()

if __name__ == "__main__":
    def test(nb_worker = 4):
        result_list.clear()
        context = zmq.Context()
        # Set a bunch a expression to evaluate (less or more coslty) :
        expressions = [
            'R.Version()', "b<-log1p(seq(1, 200))", "mat <- matrix(runif(400*400, min=-8, max=1379852), 400)",
            "a <- c(1,2,3,4)", "mat12 <- matrix(runif(72*72), 72) / 6", "d<-log1p(seq(7, 250))",
            "mat12 <- matrix(runif(90*90), 90) * matrix(runif(90*90), 90)", "mat4 <- log10(matrix(runif(455*455), 455))",
            "d<-log1p(seq(77, 150))", "mat4 <- log10(matrix(runif(200*200), 200))", "mat4 *12",
            "mat12 <- matrix(runif(72*72), 72) / 6", 'R.Version(); a<-c(1,2,3,4); a*8',
            "sequ <- seq(1,1000)", "ct <- Sys.time()", "matz <- data.frame(matrix(runif(741*741), 654) / 8.6)",
            "matx <- matrix(runif(200*200), 200)", "matz <- matrix(runif(555*555), 555) / 3.5",
            "maty <- matrix(runif(200*200), 200)", "maty <- matrix(runif(200*200), 200)",
            'R.Version()', "b<-log1p(seq(1, 200))", "mat <- matrix(runif(400*400, min=-8, max=1379852), 400)",
            "a <- c(1,2,3,4)", "mat12 <- matrix(runif(72*72), 72) / 6", "d<-log1p(seq(7, 250))",
            "mat12 <- matrix(runif(90*90), 90) * matrix(runif(90*90), 90)", "mat4 <- log10(matrix(runif(455*455), 455))",
            "d<-log1p(seq(77, 150))", "mat4 <- log10(matrix(runif(200*200), 200))",
            "mat12 <- matrix(runif(72*72), 72) / 6", 'R.Version(); a<-c(1,2,3,4); a*8',
            "sequ <- seq(1,1000)", "ct <- Sys.time()", "matz <- data.frame(matrix(runif(741*741), 654) / 8.6)",
            "matx <- matrix(runif(200*200), 200)", "matz <- matrix(runif(555*555), 555) / 3.5",
            "maty <- matrix(runif(200*200), 200)", "maty <- matrix(runif(200*200), 200)"
            ]

        # Launch bakcground R workers :
        r_process = prepare_worker(nb_worker)
        
        ct = time.time()
        # Launch the broker (already knowing the number of clients to come
        # for a more convenient exit) :
        broker = threading.Thread(target=launch_broker, args=(context, r_process, len(expressions)))
        broker.start()
    
        # Launch clients, one per expression to evaluate :
        threads = [
            threading.Thread(target=R_client_thread, args=(url_client, expressions[i], context, i))
            for i in range(len(expressions))
            ]
        [t.start() for t in threads] # They should all try to connect to the broker and be routed to an available worker ...
        [t.join() for t in threads]  # ...then each client add its result to a list and quit
    
        # The broker should have return :
        broker.join()
    
        # Close the bakcground R workers :
        for process in r_process:
            process.send_signal(signal.SIGINT)
    #        process.terminate()
            process.wait()
    
        # Each expression to evaluate should have yielded to a result :
        assert len(result_list) == len(expressions)
        print('\n{:.2f}s\n'.format(time.time()-ct))