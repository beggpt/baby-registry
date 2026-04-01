FROM node:20-alpine AS base
WORKDIR /app

# Instaliraj ovisnosti
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build
FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM node:20-alpine AS runner
WORKDIR /app

# Playwright dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
