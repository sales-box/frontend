# syntax=docker/dockerfile:1

# ----- Build Stage -----
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9

# Copy root configurations, workspace definition, and dependency manifests to cache layers
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/extension/package.json ./apps/extension/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the workspace files
COPY . .

# Build the dashboard app
RUN pnpm --filter dashboard build

# ----- Runtime Stage -----
FROM nginx:alpine AS runtime

# Copy build artifacts to Nginx default public directory
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

# Copy Nginx configuration to support SPA routing (React Router DOM)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
