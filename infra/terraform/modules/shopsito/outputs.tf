output "d1_nombre" {
  value = cloudflare_d1_database.db.name
}

output "d1_id" {
  value = cloudflare_d1_database.db.id
}

output "r2_bucket" {
  value = cloudflare_r2_bucket.fotos.name
}

output "worker_nombre" {
  value = cloudflare_workers_script.api.script_name
}

output "pages_proyecto" {
  value = cloudflare_pages_project.web.name
}

output "url_web" {
  description = "URL pública del frontend (la API queda en <url_web>/api)."
  value       = "https://${cloudflare_pages_project.web.subdomain}"
}
