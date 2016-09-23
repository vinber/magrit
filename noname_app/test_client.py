# -*- coding: utf-8 -*-
"""
@author: mz
"""
import asyncio
import zmq
import zmq.asyncio
import sys


def main(client_url):
    loop = zmq.asyncio.ZMQEventLoop()
    asyncio.set_event_loop(loop)
    context = zmq.asyncio.Context(2)

    async def run(loop):
        res = await client_fuw_async(b"foobar_request", b'"barbaz_data"', context, 1, client_url)
        print("Result in client: ", res.decode())
        res = await client_fuw_async(b"make_cartogram", b"[1,2,3]", context, 1, client_url)
        print("Result in client: ", res.decode())

    try:
        loop.run_until_complete(run(loop))
    except KeyboardInterrupt:
        return


async def client_fuw_async(request, data, context, i, client_url):
    """Basic client sending a request (REQ) to a ROUTER (the broker)"""
    socket = context.socket(zmq.REQ)
    socket.setsockopt_string(zmq.IDENTITY, '{}'.format(i))
    socket.setsockopt(zmq.SNDBUF, int(len(request)+len(data)+40))
    socket.setsockopt(zmq.RCVBUF, int(len(request)+len(data))*2)
    socket.setsockopt(zmq.LINGER, 0)
    socket.connect(client_url)
    await socket.send_multipart([request, b'', data])
    reply = await socket.recv()
    socket.close()
    return reply

if __name__ == "__main__":
    if len(sys.argv) < 2 or "ipc" in sys.argv[1]:
        CLIENT_URL = 'ipc:///tmp/feeds/clients'
    else:
        CLIENT_URL = "tcp://localhost:5559"
    main(CLIENT_URL)
