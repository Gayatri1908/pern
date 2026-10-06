import asyncio
from redis.asyncio import Redis, from_url

from app.config import get_settings

_redis_clients: dict[asyncio.AbstractEventLoop | None, Redis] = {}


def get_redis() -> Redis:
    """Return an async Redis client instance scoped to the current event loop."""
    global _redis_clients
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop not in _redis_clients:
        settings = get_settings()
        _redis_clients[loop] = from_url(settings.redis_url, decode_responses=True)
    return _redis_clients[loop]


async def close_redis() -> None:
    """Close all open Redis client connections."""
    global _redis_clients
    for client in list(_redis_clients.values()):
        try:
            await client.aclose()
        except Exception:
            pass
    _redis_clients.clear()
