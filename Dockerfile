# Build the static site with the same runtime versions used by CI.
FROM node:24-bookworm-slim AS base
WORKDIR /app

# Pin pnpm so image builds remain reproducible.
RUN npm install --global pnpm@11.3.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Serve the generated static site with nginx.
FROM nginx:mainline-alpine-slim AS runtime
COPY --from=base /app/dist /usr/share/nginx/html
EXPOSE 80
