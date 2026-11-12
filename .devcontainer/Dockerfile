# Debian (no Alpine): workerd, el runtime local de Wrangler, necesita glibc.
# La imagen oficial es multi-arquitectura (arm64 para Apple Silicon y amd64).
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git sudo procps \
  && rm -rf /var/lib/apt/lists/* \
  && echo "node ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/node \
  && chmod 0440 /etc/sudoers.d/node

# pnpm vía corepack, con la versión fijada en "packageManager" del package.json.
# El store de pnpm vive en el mismo volumen que node_modules para poder usar hardlinks.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    npm_config_store_dir=/workspace/node_modules/.pnpm-store \
    WRANGLER_SEND_METRICS=false
RUN corepack enable

USER node
WORKDIR /workspace
