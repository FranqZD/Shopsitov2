#!/usr/bin/env bash
# Corre terraform en un ambiente con las credenciales listas para el estado remoto en R2.
#
# Uso:  infra/tf.sh dev|prod <comando de terraform…>
#   infra/tf.sh dev plan
#   infra/tf.sh prod output url_web
#   infra/tf.sh dev init -migrate-state   # una sola vez, para subir un estado local a R2
#
# Credenciales: CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID (de infra/.env o del entorno).
set -euo pipefail

AMBIENTE="${1:-}"
if [[ "$AMBIENTE" != "dev" && "$AMBIENTE" != "prod" ]]; then
  echo "Uso: $0 dev|prod <comando de terraform…>" >&2
  exit 1
fi
shift

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "$RAIZ/infra/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$RAIZ/infra/.env"
  set +a
fi
: "${CLOUDFLARE_API_TOKEN:?Falta CLOUDFLARE_API_TOKEN (infra/.env o variable de entorno)}"
: "${CLOUDFLARE_ACCOUNT_ID:?Falta CLOUDFLARE_ACCOUNT_ID (infra/.env o variable de entorno)}"
export TF_VAR_account_id="$CLOUDFLARE_ACCOUNT_ID"

# El backend "s3" de Terraform habla con R2 usando credenciales tipo S3. Cloudflare las deriva
# del API token: Access Key ID = id del token, Secret = SHA-256 del token. Así basta un solo secreto.
export AWS_ENDPOINT_URL_S3="https://$CLOUDFLARE_ACCOUNT_ID.r2.cloudflarestorage.com"
if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  AWS_ACCESS_KEY_ID="$(
    curl -fsS https://api.cloudflare.com/client/v4/user/tokens/verify \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" |
      python3 -c 'import json, sys; print(json.load(sys.stdin)["result"]["id"])'
  )"
  AWS_SECRET_ACCESS_KEY="$(printf '%s' "$CLOUDFLARE_API_TOKEN" | shasum -a 256 | cut -d' ' -f1)"
  export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
fi

exec terraform -chdir="$RAIZ/infra/terraform/envs/$AMBIENTE" "$@"
