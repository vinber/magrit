# -*- coding: utf-8 -*-
"""
Just some tests to have a "custom" rpy2.robject instance (or many concurrent)
to connect later to queue of task.
Actually they both only seems to provide an overhead on the top of rpy2 methods.
@author: mz
"""
from threading import Thread, RLock
import rpy2.robjects as robjects
from rpy2.robjects import pandas2ri
from itertools import islice
import time

rpy2_result = []
rlock = RLock()  # Only access the result list after acquiring the Lock on it (if there is many workers)
pandas2ri.activate()  # On the fly R -> python object conversion is ON 

def chunk(it, size):
    it = iter(it)
    return iter(lambda: tuple(islice(it, size)), ())

# Actually there don't seems to have a gain in subclassing threading.Thread to
# launch this object as a (or many) threads 
class Rpy2_evaluator(Thread):
    def __init__(self, expression, env='.GlobalEnv'):
        super(Rpy2_evaluator, self).__init__()
        self.robjects = robjects
        self.expression = expression
        try:
            self.rversion = self.robjects.r('R.version.string')[0]
#            print("Initialized\n{}".format(self.rversion))
        except Exception as err:
            err(
                "Something wrong happened while initializing the Rpy2 evaluator")
            return -1
        
    def run(self):
        returns = []
        for expr in self.expression:
            with rlock:
                r_return = self.robjects.r(expr)
            try:
                returns.append(str(r_return))
            except Exception as err:
                print('Expression : {}\nError\n{}'.format(expr, err))
                returns.append(err)
        with rlock:
            rpy2_result.extend(returns)
        return


# Main goals of this object : be launched on stricly differents proccess,
# ie. with rpy2.robjects instanciate in differents process
# (R through rpy2 dont support "concurrent access"), each one lauching threads 
# (using a Lock to access the eval function and the result list)
class Rpy2_executor2:
    def __init__(self, env='.GlobalEnv'):
        import rpy2.robjects as robjects
        from rpy2.robjects import pandas2ri
        pandas2ri.activate()
        self.r = robjects.r
        try:
            self.rversion = self.r('R.version.string')[0]
#            print("Initialized\n{}".format(self.rversion))
        except Exception as err:
            err(
                "Something wrong happened while initializing the Rpy2 executor")
            return -1
        
    def eval_th(self, expressions, nb_threads = 2):
        pool = []
        for block in chunk(expressions, int(len(expressions)/nb_threads)):
            rpexec = Rpy2_worker(block, self.r)
            rpexec.start()
            pool.append(rpexec)
        for th in pool:
            th.join()
        return rpy2_result.copy()


class Rpy2_worker(Thread):
    def __init__(self, expression, r):
        super(Rpy2_worker, self).__init__()
        self.expression = expression
        self.r = r

    def run(self):
        returns = []
        for expr in self.expression:
            with rlock:
                r_return = self.r(expr)
            try:
                returns.append(r_return)
            except Exception as err:
                print(err, r_return)
                returns.append('Erreur')
        with rlock:
            rpy2_result.extend(returns)
        return


if __name__ == '__main__': ## Tests:

    expressions = ["mat <- matrix(runif(3333*3333), 3333)", "mat2 <- matrix(runif(3333*3333), 3333)",
        "library(cartography)"]
    expressions2 = ["myMat <- matrix(runif(4444*4444), 4444)", "mat3 <- matrix(runif(3333*3333), 3333)"]
    expressions3 = ["myMat2 <- matrix(runif(5555*5555), 5555)", "bar <- data.frame(foo = log(c(1,2,3,9,6,1,2,3,4,7,5,6,8,9,9,6,1,2)))"]
    expressions4 = ["myMat3 <- matrix(runif(4123*4123), 4123)", 'b <- c(1,2,3,4,5)*9',
                    'b <- data.frame(foo = log(c(1,2,3,6,1,2)))']
    expr = expressions3 + expressions + expressions2 + expressions4 + expressions2 + expressions3 + expressions4
    
#    expressions = ["mat <- matrix(runif(3333*3333), 3333)", "mat2 <- matrix(runif(3333*3333), 3333)",
#        "library(cartography)", "library(MTA)", "x<-nuts3.df",
#        """x$gdevrel <- globalDev(x = x, var1 = "gdppps2008", var2 = "pop2008", type = "rel")"""]
#    expressions2 = ["myMat <- matrix(runif(4444*4444), 4444)"]
#    expressions3 = ["myMat2 <- matrix(runif(5555*5555), 5555)"]
#    expressions4 = ["myMat3 <- matrix(runif(4123*4123), 4123)",
#                    'b <- c(1,2,3,4,5)*9',
#                    'b <- data.frame(foo = log(c(1,2,3,6,1,2)))']
#    expr = expressions3 + expressions + expressions2 + expressions2 + expressions3 + expressions4

    def test_evaluator1():  # Many worker (it fails without using a lock on the result list)
        st = time.time()  # but its actually slower than using only one instance 
        pool = [
            Rpy2_evaluator(expressions3, rlock),
            Rpy2_evaluator(expressions, rlock),
            Rpy2_evaluator(expressions2, rlock),
            Rpy2_evaluator(expressions4, rlock),
            Rpy2_evaluator(expressions2, rlock),
            Rpy2_evaluator(expressions3, rlock),
            Rpy2_evaluator(expressions4, rlock),
            ]

        [t.start() for t in pool]
        [t.join() for t in pool]

        assert len(rpy2_result) == len(expr)
        print("{:.3f} s".format(time.time()-st))

    def test_evaluator2():  # Only one worker :
        st = time.time()
        rp = Rpy2_evaluator(expr, rlock)
        rp.start()
        rp.join()

        assert len(rpy2_result) == len(expr)
        print("{:.3f} s".format(time.time()-st))

    def test_executor1():  # The main instance will evaluate the expression with 1 worker
        st = time.time()
        rpex = Rpy2_executor2()
        rpy2_result = rpex.eval_th(expr, 1)
        assert len(rpy2_result) == len(expr)
        print("{:.3f} s".format(time.time()-st))

    def test_executor2():  # The main instance will evaluate the expression with 2 workers
        st = time.time()
        rpex = Rpy2_executor2()
        rpy2_result = rpex.eval_th(expr, 5)
        assert len(rpy2_result) == len(expr)
        print("{:.3f} s".format(time.time()-st))





#################################
# Not working as expected :
############
##import rpy2.robjects as robjects
#import zmq
##import zmq.asyncio
#import pickle
#from multiprocessing import Process, Queue
#
#dico_session = {}
#
#def R_persist_eval(key, cmd, q):
#    global dico_session
#    if key in dico_session:
#        print('key is in dico_session')
#        probjects = dico_session[key]
#        with open('/tmp/{}'.format(key), 'rb') as f:
#            probjects.globalenv = pickle.load(f)
#    else:
#        import rpy2.robjects as probjects
#        dico_session[key] = probjects
#    try:
#        res = probjects.r('{}'.format(cmd))
#    except Exception as err:
#        res = "Minimal error traceback :\n\n{}".format(err)
#    with open('/tmp/{}'.format(key), 'wb') as f:
#        pickle.dump(probjects.globalenv, f)
#    q.put(res)
#
#def R_new_eval(cmd, q):
#    import rpy2.robjects as robjects
#    try:
#        res = robjects.r('{}'.format(cmd))
#    except Exception as err:
#        res = "Minimal error traceback :\n\n{}".format(err)
#    del robjects
#    q.put(res)
#
#
#def R_interf():
#    port = "5556"
#    context = zmq.Context()
#    socket = context.socket(zmq.REP)
#    socket.bind("tcp://*:%s" % port)
#    while True:
#        #  Wait for next request from client
#        message = socket.recv().decode()
#        if 'key:' in message[:5]:
#            key, message = message[4:].split('&')
#            print("Received request on persistent session from : ", key,
#                  "with command : ", message)
#            p = Process(target=R_persist_eval, args=(key, message, q))
#            p.start()
#            result = q.get()
#            p.join()
#        else:
#            print("Received request on non-persistent session : ", message)
#            p = Process(target=R_new_eval, args=(message, q))
#            p.start()
#            result = q.get()
#            p.join()
#        socket.send(str(result).encode())