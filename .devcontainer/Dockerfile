# Debian, no Alpine: workerd (Wrangler) necesita glibc y los certificados raíz del sistema.
FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
