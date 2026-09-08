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
CMD ["sh", "-c", "pnpm --filter @platform/api db:deploy && pnpm --filter @platform/api start:prod"]