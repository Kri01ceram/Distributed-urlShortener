FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun x prisma generate

RUN bun run typecheck

EXPOSE 3000

CMD ["bun", "run", "src/server.ts"]