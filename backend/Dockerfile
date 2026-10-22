# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json pnpm-lock.yaml ./

# Use npm install for reliable Docker builds
RUN npm install --legacy-peer-deps

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# ============================================
# Stage 2: Production runner
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Re-generate prisma client (needs native binary for this platform)
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p /app/uploads

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

# Run with dedicated user and set directory permissions
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:appgroup /app

USER appuser
EXPOSE 5000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
