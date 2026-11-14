FROM node:24-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:24-bookworm-slim AS backend
WORKDIR /app/backend
ENV DATABASE_URL=postgresql://build:build@localhost/build
COPY backend/package*.json backend/prisma.config.ts ./
COPY backend/prisma ./prisma
RUN npm ci
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY backend/ ./
RUN npm run build

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY --from=backend /app/backend ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist
COPY openapi.yaml /app/openapi.yaml
ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run db:deploy && node dist/main.js"]
