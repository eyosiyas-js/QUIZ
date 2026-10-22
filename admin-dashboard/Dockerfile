# ============================================
# Stage 1: Build the Vite app
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install --legacy-peer-deps

COPY . .

# Build with API pointing to /api (nginx will reverse-proxy to backend)
ENV VITE_API_BASE_URL=/api
RUN npx vite build

# ============================================
# Stage 2: Serve with nginx
# ============================================
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
