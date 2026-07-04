# Production image for the FastAPI backend.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

RUN useradd -m appuser && mkdir -p /data/uploads && chown -R appuser /data /app
USER appuser

EXPOSE 8000
# entrypoint.sh runs `alembic upgrade head`, then launches uvicorn with
# --proxy-headers + --forwarded-allow-ips so Starlette populates request.client
# from X-Forwarded-For behind Caddy (otherwise the per-IP rate limiter and vote
# anti-fraud IP hash collapse into one shared bucket for all traffic).
CMD ["./entrypoint.sh"]
