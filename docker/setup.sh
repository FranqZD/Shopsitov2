#!/usr/bin/env bash
# Prepara el entorno dentro del contenedor: dependencias, migraciones locales y seed.
# Es idempotente; se puede volver a correr cuando quieras resetear los datos locales.
set -euo pipefail
cd /workspace

# Los volúmenes nombrados se crean como root; se los damos al usuario node.
sudo chown node:node node_modules apps/web/node_modules apps/api/node_modules packages/shared/node_modules 2>/dev/null || true

[ -f apps/api/.dev.vars ] || cp apps/api/.dev.vars.example apps/api/.dev.vars

pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
