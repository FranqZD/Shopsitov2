locals {
  nombre = "${var.prefijo}-%s-${var.ambiente}"

  nombre_d1     = format(local.nombre, "db")
  nombre_r2     = format(local.nombre, "fotos")
  nombre_worker = format(local.nombre, "api")
  nombre_pages  = format(local.nombre, "web")
}

# ─── Datos ────────────────────────────────────────────────────────────────
# Las migraciones NO las aplica Terraform: van con `wrangler d1 migrations apply --remote`
# (ver infra/desplegar.sh), igual que en local.

resource "cloudflare_d1_database" "db" {
  account_id            = var.account_id
  name                  = local.nombre_d1
  primary_location_hint = var.ubicacion

  read_replication = {
    mode = "disabled"
  }
}

resource "cloudflare_r2_bucket" "fotos" {
  account_id = var.account_id
  name       = local.nombre_r2
  location   = var.ubicacion
}

# ─── Backend: Worker ──────────────────────────────────────────────────────

# Secreto para firmar los JWT; vive en el estado de Terraform y es distinto por ambiente.
resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "cloudflare_workers_script" "api" {
  account_id  = var.account_id
  script_name = local.nombre_worker

  # Bundle ESM que genera `wrangler deploy --dry-run --outdir dist`.
  main_module        = "index.js"
  content_file       = var.bundle_worker
  content_sha256     = filesha256(var.bundle_worker)
  compatibility_date = var.compatibility_date
  # Como en wrangler.toml: Sentry usa AsyncLocalStorage.
  compatibility_flags = ["nodejs_als"]

  # Mismos nombres de binding que en wrangler.toml y apps/api/src/env.ts.
  bindings = concat([
    {
      type = "d1"
      name = "DB"
      id   = cloudflare_d1_database.db.id
    },
    {
      type        = "r2_bucket"
      name        = "FOTOS"
      bucket_name = cloudflare_r2_bucket.fotos.name
    },
    {
      type = "secret_text"
      name = "JWT_SECRET"
      text = random_password.jwt_secret.result
    },
    {
      # Sentry separa los eventos por ambiente con este valor.
      type = "plain_text"
      name = "AMBIENTE"
      text = var.ambiente
    },
    ], var.sentry_dsn == "" ? [] : [
    {
      type = "plain_text"
      name = "SENTRY_DSN"
      text = var.sentry_dsn
    },
  ])

  observability = {
    enabled = true
  }
}

resource "cloudflare_workers_script_subdomain" "api" {
  account_id       = var.account_id
  script_name      = cloudflare_workers_script.api.script_name
  enabled          = var.habilitar_workers_dev
  previews_enabled = false
}

# ─── Frontend: Pages ──────────────────────────────────────────────────────
# Proyecto de "Direct Upload": el contenido se sube con `wrangler pages deploy`.
# La función apps/web/functions/api/[[path]].ts reenvía /api/* al Worker por el
# service binding API, así el navegador sigue usando el mismo origen (sin CORS),
# igual que el proxy de Vite en local.

resource "cloudflare_pages_project" "web" {
  account_id        = var.account_id
  name              = local.nombre_pages
  production_branch = var.rama_produccion

  deployment_configs = {
    production = {
      compatibility_date = var.compatibility_date
      services = {
        API = { service = cloudflare_workers_script.api.script_name }
      }
    }
    preview = {
      compatibility_date = var.compatibility_date
      services = {
        API = { service = cloudflare_workers_script.api.script_name }
      }
    }
  }
}
