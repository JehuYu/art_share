# ============================================
# Art Share - Multi-stage Docker Build
# ============================================
# Using Debian-slim for better sharp compatibility

# Base image
FROM node:20-slim AS base

# Install common dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# ============================================
# Stage 2: Build the application
# ============================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/template.db"

# Generate Prisma Client
RUN npx prisma generate

# Initialize DB structure
RUN npx prisma db push

# Seed initial data
RUN npx tsx prisma/seed.ts

# Build Next.js application
RUN npm run build

# ============================================
# Stage 3: Production runtime
# ============================================
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public assets
COPY --from=builder /app/public ./public

# Create necessary directories
RUN mkdir -p .next public/uploads data

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files and template database
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/template.db ./template.db

# Set permissions for all writable directories
RUN chmod -R 777 .next public/uploads data

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Startup: initialize database if not exists, then start server
CMD ["/bin/sh", "-c", "if [ ! -f data/dev.db ]; then echo 'Initializing database...'; cp template.db data/dev.db; fi && DATABASE_URL=file:/app/data/dev.db node server.js"]

