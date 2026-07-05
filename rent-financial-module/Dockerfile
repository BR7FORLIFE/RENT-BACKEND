FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma generate

RUN pnpm build



FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts .
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/public.pem .
COPY --from=builder /app/generated ./generated

COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

EXPOSE 3002

ENTRYPOINT ["./entrypoint.sh"]