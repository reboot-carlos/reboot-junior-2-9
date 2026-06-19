# syntax=docker/dockerfile:1
# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM python:3.12-slim AS deps

WORKDIR /install
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/deps -r requirements.txt


# ── Stage 2: production image ─────────────────────────────────────────────────
FROM python:3.12-slim AS production

LABEL org.opencontainers.image.title="TA CHATBOT ROSÉE" \
      org.opencontainers.image.description="FastAPI serving API + static frontend"

# Non-root user
RUN groupadd --system --gid 1001 appgroup \
 && useradd  --system --uid 1001 --gid appgroup \
             --no-create-home --shell /sbin/nologin appuser

WORKDIR /app

# Dependencies from stage 1
COPY --from=deps /deps /usr/local

# Application code
COPY main.py .

# Static frontend assets served by FastAPI
COPY index.html landing.html test.html config.json plage.svg ./
COPY 2e87c374b4c9c8609ea04f1455684d60.jpeg ./
COPY app/ ./app/

USER appuser

# Railway injects PORT; default to 8001 for local use
ENV PORT=8001
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c \
        "import urllib.request, os; \
         urllib.request.urlopen('http://localhost:' + os.environ.get('PORT','8001') + '/api/health')" \
        || exit 1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}"]
