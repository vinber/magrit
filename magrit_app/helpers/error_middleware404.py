from aiohttp import web
from aiohttp_jinja2 import render_template


async def handle_404(request, response):
    return render_template('page404.html', request, {})

async def error_middleware(app, handler):
    async def middleware_handler(request):
        try:
            response = await handler(request)
            if response.status == 404:
                return await handle_404(request, response)
            return response
        except web.HTTPException as ex:
            if ex.status == 404:
                return await handle_404(request, ex)
            raise
    return middleware_handler
