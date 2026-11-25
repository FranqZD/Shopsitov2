variable "account_id" {
  description = "ID de la cuenta de Cloudflare"
  type        = string
}

variable "cloudflare_api_token" {
  description = "API token de Cloudflare. Si es null, se usa la variable de entorno CLOUDFLARE_API_TOKEN."
  type        = string
  default     = null
  sensitive   = true
}

variable "sentry_dsn" {
  description = "DSN de Sentry para la API; desplegar.sh lo toma de SENTRY_DSN_API (TF_VAR_sentry_dsn)."
  type        = string
  default     = ""
}
