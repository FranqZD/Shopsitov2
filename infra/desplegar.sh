#!/usr/bin/env bash
# Despliega un ambiente completo en Cloudflare:
#   1. build de web y api
#   2. terraform apply (D1, R2, Worker con el bundle nuevo, proyecto de Pages)
#   3. migraciones de D1 en remoto
#   4. subida del frontend a Pages
#
# Uso:  infra/desplegar.sh dev|prod   (credenciales en infra/.env, ver infra/.env.example)
#        AUTO_APPROVE=1 infra/desplegar.sh dev   # sin confirmar el plan (lo usa GitHub Actions)
#
# Terraform corre en tu máquina (o en el runner de CI) vía infra/tf.sh, con el estado en R2. Los pasos de Node (pnpm, wrangler) corren dentro del
# contenedor `dev` si `docker compose up` está activo; si no, en tu máquina.
set -euo pipefail

AMBIENTE="${1:-}"
if [[ "$AMBIENTE" != "dev" && "$AMBIENTE" != "prod" ]]; then
  echo "Uso: $0 dev|prod" >&2
  exit 1
fi

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"

# Credenciales desde infra/.env (ignorado por git) para no tener que exportarlas a mano.
if [[ -f "$RAIZ/infra/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$RAIZ/infra/.env"
  set +a
fi
: "${CLOUDFLARE_API_TOKEN:?Falta CLOUDFLARE_API_TOKEN en infra/.env (copia infra/.env.example)}"
: "${CLOUDFLARE_ACCOUNT_ID:?Falta CLOUDFLARE_ACCOUNT_ID en infra/.env (copia infra/.env.example)}"
cd "$RAIZ"
tf() { "$RAIZ/infra/tf.sh" "$AMBIENTE" "$@"; }

# Ejecuta un comando de Node desde la raíz del repo (en Docker si está levantado).
node_cmd() {
  if docker compose ps --status running --services 2>/dev/null | grep -qx dev; then
    docker compose exec -T \
      -e "CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN" \
      -e "CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID" \
      dev sh -c "$1"
  else
    sh -c "$1"
  fi
}

echo "▸ [1/4] Build de web y api"
node_cmd "pnpm build"

echo "▸ [2/4] Terraform ($AMBIENTE)"
tf init -input=false
tf apply -input=false ${AUTO_APPROVE:+-auto-approve}

D1_NOMBRE="$(tf output -raw d1_nombre)"
D1_ID="$(tf output -raw d1_id)"
PAGES="$(tf output -raw pages_proyecto)"
URL_WEB="$(tf output -raw url_web)"

echo "▸ [3/4] Migraciones de D1 ($D1_NOMBRE)"
# wrangler.toml apunta a la D1 local; para la remota se genera una config aparte
# (dentro de .wrangler/, ignorado por git) con el ID real que creó Terraform.
CONFIG="apps/api/.wrangler/deploy-$AMBIENTE.toml"
mkdir -p "$(dirname "$CONFIG")"
cat >"$CONFIG" <<EOF
name = "shopsito-api-$AMBIENTE"
compatibility_date = "2026-10-01"

[[d1_databases]]
binding = "DB"
database_name = "$D1_NOMBRE"
database_id = "$D1_ID"
migrations_dir = "../migrations"
EOF
node_cmd "pnpm --filter @shopsito/api exec wrangler d1 migrations apply DB --remote --config .wrangler/deploy-$AMBIENTE.toml"

echo "▸ [4/4] Frontend a Pages ($PAGES)"
# Se corre desde apps/web para que wrangler incluya la carpeta functions/ (proxy de /api).
node_cmd "cd apps/web && ../api/node_modules/.bin/wrangler pages deploy dist --project-name=$PAGES --branch=main --commit-dirty=true"

echo
echo "✔ Listo: $URL_WEB  (API: $URL_WEB/api/health)"
