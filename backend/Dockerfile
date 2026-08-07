FROM node:20-bookworm-slim

WORKDIR /app

# The worker uses the Docker CLI to launch the isolated, short-lived judge
# containers. The API never receives the Docker socket.
RUN apt-get update && apt-get install -y --no-install-recommends \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build && npm prune --omit=dev

EXPOSE 4000

CMD ["node", "dist/src/index.js"]
