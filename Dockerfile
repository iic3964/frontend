# Multi-stage Dockerfile supporting both development (live-reload) and production
# Uses Node.js 20 (alpine) for small image size

# ----------------------
# Development stage
# Build target: `dev` — used by docker-compose for local development with file mounts
# ----------------------
FROM node:20-alpine AS dev
WORKDIR /app

# Install dependencies inside the image (so node_modules exist in container)
COPY package*.json ./
RUN npm ci

# Copy source (will be overwritten by bind mount in dev compose, but kept for image completeness)
COPY . .

EXPOSE 3000
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","3000"]


# ----------------------
# Builder stage (production)
# ----------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first (leverage docker layer caching); include dev deps for build
COPY package*.json ./
RUN npm ci --production=false

# Copy source and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only copy package manifests and production node_modules from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy build output
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run Astro preview and bind to 0.0.0.0 so container is reachable
CMD ["npm","run","preview","--","--host","0.0.0.0","--port","3000"]
