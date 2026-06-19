# syntax=docker/dockerfile:1
# ── Stage 1: dependency installation ─────────────────────────────────────────
FROM python:3.12-slim AS deps

WORKDIR /install

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/deps -r requirements.txt


# ── Stage 2: production image ─────────────────────────────────────────────────
FROM python:3.12-slim AS production

LABEL org.opencontainers.image.title="TA CHATBOT ROSÉE — API" \
      org.opencontainers.image.description="FastAPI backend with Claude AI" \
      org.opencontainers.image.base.name="python:3.12-slim"

# Non-root user for security
RUN groupadd --system --gid 1001 appgroup \
 && useradd  --system --uid 1001 --gid appgroup \
             --no-create-home --shell /sbin/nologin appuser

WORKDIR /app

# Copy installed packages from deps stage
COPY --from=deps /deps /usr/local

# Copy only the application entrypoint
COPY main.py .

# Drop privileges
USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c \
        "import urllib.request; urllib.request.urlopen('http://localhost:8001/')" \
        || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
