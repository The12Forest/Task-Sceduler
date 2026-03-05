# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Install Backend Dependencies ──
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# ── Stage 3: Production (Nginx + Node.js) ──
FROM node:20-alpine

RUN apk add --no-cache nginx

WORKDIR /app

# Copy backend
COPY --from=backend-build /app ./

# Copy built frontend into Nginx html directory
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create non-root user for Node.js process
RUN addgroup -g 1001 app \
 && adduser -D -u 1001 -G app app \
 && mkdir -p uploads \
 && chown -R app:app /app

# Startup script: Nginx runs as root (needs port 80), Node.js drops to non-root
RUN printf '#!/bin/sh\nnginx\nexec su -s /bin/sh app -c "node /app/src/server.js"\n' > /start.sh \
 && chmod +x /start.sh

# Expose single port (Nginx)
EXPOSE 80

# Health check via Nginx → API proxy
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/api/health || exit 1

CMD ["/start.sh"]
