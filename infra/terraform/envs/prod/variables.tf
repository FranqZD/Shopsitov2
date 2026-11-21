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
