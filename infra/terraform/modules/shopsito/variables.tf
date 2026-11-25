variable "account_id" {
  description = "ID de la cuenta de Cloudflare."
  type        = string
}

variable "ambiente" {
  description = "Nombre del ambiente; se usa como sufijo en todos los recursos (dev, prod)."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.ambiente)
    error_message = "ambiente debe ser \"dev\" o \"prod\"."
  }
}

variable "prefijo" {
  description = "Prefijo de los nombres de recursos."
  type        = string
  default     = "shopsito"
}

variable "ubicacion" {
  description = "Región sugerida para D1 y R2 (wnam = oeste de Norteamérica, la más cercana al campus)."
  type        = string
  default     = "wnam"
}

variable "compatibility_date" {
  description = "Fecha de compatibilidad del runtime de Workers; igual que en apps/api/wrangler.toml."
  type        = string
  default     = "2026-10-01"
}

variable "bundle_worker" {
  description = "Ruta al bundle del Worker generado por `pnpm --filter @shopsito/api build` (apps/api/dist/index.js)."
  type        = string
}

variable "habilitar_workers_dev" {
  description = "Publica el Worker también en <nombre>.<subdominio>.workers.dev (útil para probar /api/health sin pasar por Pages)."
  type        = bool
  default     = true
}

variable "rama_produccion" {
  description = "Rama que Pages considera de producción al desplegar con `wrangler pages deploy --branch`."
  type        = string
  default     = "main"
}

variable "sentry_dsn" {
  description = "DSN del proyecto de Sentry para la API. Vacío = el Worker no manda nada a Sentry."
  type        = string
  default     = ""
}
