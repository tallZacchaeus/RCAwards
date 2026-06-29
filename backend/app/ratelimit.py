"""A small in-process, per-IP fixed-window rate limiter.

Good enough for a single API process and for keeping casual abuse off the public
write endpoints. For multi-worker production, swap the in-memory store for Redis
(the dependency surface stays the same).
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

from .config import get_settings


class _FixedWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def check(self, key: str, limit: int, window: int) -> None:
        now = time.monotonic()
        cutoff = now - window
        with self._lock:
            hits = [t for t in self._hits[key] if t > cutoff]
            if len(hits) >= limit:
                retry_after = int(window - (now - hits[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please slow down.",
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)
            self._hits[key] = hits


_limiter = _FixedWindowLimiter()


def rate_limit(request: Request) -> None:
    """FastAPI dependency: throttle by client IP using configured limits."""
    settings = get_settings()
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{request.url.path}"
    _limiter.check(key, settings.rate_limit_requests, settings.rate_limit_window_seconds)
