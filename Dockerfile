# ============================================
# Art Share - Multi-stage Docker Build
# ============================================

# Base image with common dependencies
FROM node:20-alpine AS base
# Install dependencies needed for both build and runtime
# - openssl: required for Prisma
# - libc6-compat: for some native modules
# - vips: for sharp image processing
RUN apk add --no-cache libc6-compat openssl vips vips-dev

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for build)
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
# Use a template DB file for build-time initialization
ENV DATABASE_URL="file:/app/template.db"

# Generate Prisma Client
RUN npx prisma generate

# Initialize DB structure
RUN npx prisma db push

# Seed initial data (create admin user)
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

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create necessary directories with proper permissions
RUN mkdir -p .next
RUN mkdir -p public/uploads
RUN chown -R nextjs:nodejs .next
RUN chown -R nextjs:nodejs public/uploads

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and template database
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/template.db ./template.db

# Expose port
EXPOSE 3000

# Set runtime environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Startup script:
# 1. Check if volume-mounted DB exists (prisma/dev.db)
# 2. If not, copy pre-built template.db
# 3. Start the server
CMD ["/bin/sh", "-c", "if [ ! -f prisma/dev.db ]; then echo 'Initializing fresh database...'; cp template.db prisma/dev.db; fi && node server.js"]
