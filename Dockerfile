# syntax=docker/dockerfile:1

# ----- Build Stage -----
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root configurations and dependency manifests to cache layers
COPY package.json package-lock.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/extension/package.json ./apps/extension/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies using clean install
RUN npm ci

# Copy the rest of the workspace files
COPY . .

# Build the dashboard app (which also builds and links @inbox-sales/shared)
RUN npm run build -w apps/dashboard

# ----- Runtime Stage -----
FROM nginx:alpine AS runtime

# Copy build artifacts to Nginx default public directory
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

# Copy Nginx configuration to support SPA routing (React Router DOM)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
