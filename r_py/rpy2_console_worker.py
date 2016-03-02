# -*- coding: utf-8 -*-
"""
Rpy2 worker, aimed to be launched as a separate process and to communicate
with the client through ZMQ, trying to emulate a R console.
@author: mz
"""
from collections import deque
import rpy2.rinterface as rinterface
import os
import zmq
import ujson as json
import sys

class Rpy2_worker:
    """
    Rpy2 worker trying to emulate a remote R console
    """
    def __init__(self, ident, worker_url, env='.GlobalEnv'):
        import rpy2.robjects as robjects
        from rpy2.robjects.packages import importr
        self.importr = importr
        self.r = robjects.r
        self.reval = robjects.reval
        self.context = zmq.Context.instance()
        self.socket = self.context.socket(zmq.REQ)
        self.socket.setsockopt_string(zmq.IDENTITY, '{}'.format(ident))
        self.socket.connect("ipc:///tmp/feeds/rpy2_workers")
        self.socket.send(b"READY")
        self.console_output = deque()

        try:
            self.rversion = self.r('R.version.string')[0]
            print("Worker {} initialized on {}".format(
                self.socket.identity.decode(), self.rversion))
            self.capture_R_output()
        except Exception as err:
            err(
                "Something wrong happened while initializing the Rpy2 executor")
            return -1

    def fun_output(self, x):
        self.console_output.append(x)

    def capture_R_output(self):
        rinterface.set_writeconsole(self.fun_output)

    def uncapture_R_output(self):
        rinterface.set_writeconsole(rinterface.consolePrint)

    def listen(self):
        try:
            grdevices = self.importr('grDevices')
            grdevices.svg(file='/tmp/r_output.svg')
            if not os.path.exists('/tmp/r_output.svg'):
                with open('/tmp/r_output.svg', 'w') as f:
                    f.write('')
            while True:
                self.last_modified_graphics = os.stat('/tmp/r_output.svg').st_mtime
                result_r, result, status = '', '', ''
                header, empty, request = self.socket.recv_multipart()
                if request == b"CLOSE":
                    print('CLOSE_OK')
                    break
                try:
#                    print('Worker received  ', request.decode())
                    result_r = self.r(request.decode())
#                    print("Result of eval : ", result_r)
                except Exception as err:
                    result = str(err)
#                    print(status)
                if self.last_modified_graphics != os.stat('/tmp/r_output.svg').st_mtime:
                    grdevices.dev_off() # Flush the graphical output first
                    with open("/tmp/r_output.svg", "r") as f:
                        print('There is a graphical output...Returning it in '
                              'the console field')
                        result = f.read()
                        grdevices.svg(file='/tmp/r_output.svg')  # And restart it ...
                if len(self.console_output) == 0 and 'rpy2' in str(type(result_r)):
                    status = 'OK - No console output'
                elif len(self.console_output) > 0 and 'rpy2' in str(type(result_r)):
                    status = 'OK'
                    result = ' '.join([result]+[self.console_output.popleft() for i in range(len(self.console_output))])
                else:
                    status = 'Something went wrong...'
                response = json.dumps({'Result': result,
                                       'Status': status}).encode()
#                print(response)
                self.socket.send_multipart([header, b'', response])
        except zmq.ContextTerminated as err:
            print(err)
        except KeyboardInterrupt as err:
            print(err)
        finally:
            grdevices.dev_off()
            self.socket.close()
            self.context.term()
            print('Session over')
            return

if __name__ == '__main__':
    assert len(sys.argv) == 2
    rpw = Rpy2_worker(sys.argv[1], "ipc:///tmp/feeds/rpy2_workers")
    rpw.listen()
