# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="TA CHATBOT ROSÉE — Frontend" \
      org.opencontainers.image.description="Nginx serving static frontend + API reverse proxy"

# Remove default placeholder config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config (reverse proxies /chat and /langues to backend)
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/chatbot.conf

# ── Static frontend assets ────────────────────────────────────────────────────
# Root-level pages
COPY index.html   /usr/share/nginx/html/index.html
COPY landing.html /usr/share/nginx/html/landing.html
COPY test.html    /usr/share/nginx/html/test.html
COPY plage.svg    /usr/share/nginx/html/plage.svg
COPY 2e87c374b4c9c8609ea04f1455684d60.jpeg \
                  /usr/share/nginx/html/2e87c374b4c9c8609ea04f1455684d60.jpeg

# config.json (fetched by app/js/main.js as ../config.json)
COPY config.json  /usr/share/nginx/html/config.json

# Application directory (chatbot.html + css/ + js/ + data/)
COPY app/         /usr/share/nginx/html/app/

EXPOSE 80
