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


# Sweep stale keys every N operations so the dict can't grow unbounded when many
# distinct IPs (or a scanner rotating IPs) hit the endpoints.
_SWEEP_EVERY = 1024


def _sweep(store: dict[str, list[float]], cutoff: float) -> None:
    for key in [k for k, hits in store.items() if not hits or hits[-1] <= cutoff]:
        del store[key]


class _FixedWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()
        self._ops = 0

    def check(self, key: str, limit: int, window: int) -> None:
        now = time.monotonic()
        cutoff = now - window
        with self._lock:
            self._ops += 1
            if self._ops % _SWEEP_EVERY == 0:
                _sweep(self._hits, cutoff)
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


class _LoginThrottle:
    """Tracks recent failed logins per key and locks out once too many pile up.

    In-memory (per process) — swap for Redis alongside the rate limiter for a
    multi-worker deployment. Complements the generic per-IP rate limit with a
    stricter, account-scoped brute-force control.
    """

    def __init__(self) -> None:
        self._fails: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()
        self._ops = 0

    def _recent(self, key: str, window: int, now: float) -> list[float]:
        cutoff = now - window
        return [t for t in self._fails.get(key, []) if t > cutoff]

    def raise_if_locked(self, key: str, max_fails: int, window: int) -> None:
        now = time.monotonic()
        with self._lock:
            self._ops += 1
            if self._ops % _SWEEP_EVERY == 0:
                _sweep(self._fails, now - window)
            recent = self._recent(key, window, now)
            self._fails[key] = recent
            if len(recent) >= max_fails:
                retry_after = int(window - (now - recent[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many failed login attempts. Try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

    def record_failure(self, key: str, window: int) -> None:
        now = time.monotonic()
        with self._lock:
            recent = self._recent(key, window, now)
            recent.append(now)
            self._fails[key] = recent

    def reset(self, key: str) -> None:
        with self._lock:
            self._fails.pop(key, None)


_login_throttle = _LoginThrottle()


def login_key(request: Request, email: str) -> str:
    client_ip = request.client.host if request.client else "unknown"
    return f"{client_ip}:{email.lower()}"


def check_login_allowed(key: str) -> None:
    settings = get_settings()
    _login_throttle.raise_if_locked(
        key, settings.login_max_failures, settings.login_lockout_window_seconds
    )


def record_login_failure(key: str) -> None:
    settings = get_settings()
    _login_throttle.record_failure(key, settings.login_lockout_window_seconds)


def reset_login_failures(key: str) -> None:
    _login_throttle.reset(key)
