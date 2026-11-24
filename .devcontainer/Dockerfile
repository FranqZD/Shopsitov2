# Imagen de trabajo del equipo: la publica el pipeline en Docker Hub (franqzd/shopsito-dev) y la
# usan docker compose y los checks, así todos trabajan y prueban con las mismas herramientas.
# No lleva código ni secretos: el repo se monta al correrla.
# Debian, no Alpine: workerd (Wrangler) necesita glibc y los certificados raíz del sistema.
FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
# Fuera de HOME porque GitHub Actions lo cambia y se perdería el pnpm ya descargado.
ENV COREPACK_HOME=/opt/corepack COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Misma versión que `packageManager` en package.json.
RUN corepack enable && corepack prepare pnpm@10.34.9 --activate
WORKDIR /workspace
