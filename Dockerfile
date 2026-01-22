
FROM node:20-alpine AS base
# Install common dependencies needed for both build and runtime
# openssl is required for Prisma, libc6-compat for some native modules
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time
ENV NEXT_TELEMETRY_DISABLED 1
# Use a template DB file for build-time initialization
ENV DATABASE_URL="file:/app/template.db"

# 1. Generate Client
RUN npx prisma generate

# 2. Initialize DB file (Create structure)
RUN npx prisma db push

# 3. Seed data (Create admin)
RUN npx tsx prisma/seed.ts

# 4. Build Next.js app
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and the PRE-BUILT template database
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/template.db ./template.db

# (openssl is already in base)

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Startup Logic:
# 1. Check if the volume-mounted DB exists (prisma/dev.db)
# 2. If not, copy our pre-built 'template.db' to 'prisma/dev.db'
# 3. Start server
CMD ["/bin/sh", "-c", "if [ ! -f prisma/dev.db ]; then echo 'Initializing fresh database...'; cp template.db prisma/dev.db; fi && node server.js"]

