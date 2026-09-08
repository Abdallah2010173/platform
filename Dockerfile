FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN corepack enable
COPY . .
RUN corepack prepare pnpm@9.15.4 --activate
RUN pnpm install --frozen-lockfile
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN pnpm --filter @platform/api build

ENV NODE_ENV=production
ENV FFMPEG_PATH=ffmpeg
EXPOSE 4000
CMD ["sh", "-c", "migration_ok=false; for attempt in 1 2 3 4 5; do if pnpm --filter @platform/api db:deploy; then migration_ok=true; break; fi; echo \"Database migration attempt $attempt failed; retrying...\"; sleep 10; done; if [ \"$migration_ok\" != \"true\" ]; then echo \"WARNING: Database migration did not complete; starting API so health checks remain available.\"; fi; exec node apps/api/dist/main.js"]