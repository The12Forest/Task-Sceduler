# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-build
LABEL org.opencontainers.image.source=https://github.com/codityco/003-how-to-dockerise-a-laravel-project
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Install Backend Dependencies ──
FROM node:20-alpine AS backend-build
LABEL org.opencontainers.image.source=https://github.com/codityco/003-how-to-dockerise-a-laravel-project
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# ── Stage 3: Production (Nginx + Node.js) ──
FROM node:20-alpine
LABEL org.opencontainers.image.source=https://github.com/codityco/003-how-to-dockerise-a-laravel-project
# Install Nginx and supervisor-like tools
RUN apk add --no-cache nginx

WORKDIR /app

# Copy backend
COPY --from=backend-build /app ./

# Copy built frontend into Nginx html directory
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create uploads directory
RUN mkdir -p uploads

# Create startup script that runs both Nginx and Node.js
RUN printf '#!/bin/sh\nnginx\nexec node /app/src/server.js\n' > /start.sh && \
    chmod +x /start.sh

# Expose single port (Nginx)
EXPOSE 80

# Health check via Nginx → API proxy
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/api/health || exit 1

CMD ["/start.sh"]
