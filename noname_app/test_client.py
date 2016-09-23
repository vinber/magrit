# -*- coding: utf-8 -*-
"""
@author: mz
"""
import asyncio
import zmq
import zmq.asyncio

def main():
    loop = zmq.asyncio.ZMQEventLoop()
    asyncio.set_event_loop(loop)
    context = zmq.asyncio.Context(2)

    async def run(loop):
        res = await client_fuw_async(b"foobar_request", b'"barbaz_data"', context, 1)
        print("Result in client: ", res.decode())
        res = await client_fuw_async(b"make_cartogram", b"[1,2,3]", context, 1)
        print("Result in client: ", res.decode())

    try:
        loop.run_until_complete(run(loop))
    except KeyboardInterrupt:
        return


async def client_fuw_async(request, data, context, i,
                             client_url='ipc:///tmp/feeds/clients'):
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
    main()
