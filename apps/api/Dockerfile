# syntax=docker/dockerfile:1
# Build dari root repo:  docker build -f apps/api/Dockerfile -t todosday-api .

# ---- base: Node + pnpm ----
FROM node:22-alpine AS base
RUN npm install -g pnpm@12.23.0
WORKDIR /repo

# ---- deps: install semua dependencies (untuk build) ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm fetch
RUN pnpm install --frozen-lockfile --offline --ignore-scripts

# ---- build: kompilasi @todosday/shared + api ----
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @todosday/shared build \
  && pnpm --filter @todosday/api build

# ---- prod-deps: node_modules produksi untuk runtime ----
FROM deps AS prod-deps
COPY packages/shared packages/shared
RUN pnpm --filter @todosday/shared build \
  && pnpm --filter @todosday/api --prod deploy --legacy /out
WORKDIR /out
COPY --from=build /repo/apps/api/prisma ./prisma
RUN ./node_modules/.bin/prisma generate

# ---- runtime: image final ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /out/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
COPY --from=prod-deps /out/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
