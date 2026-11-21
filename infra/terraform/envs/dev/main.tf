terraform {
  required_version = ">= 1.6"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.29"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Estado local (terraform.tfstate en esta carpeta, ignorado por git). Contiene el
  # JWT_SECRET: no lo compartas por chat. Para trabajar en equipo se puede mover a un
  # backend remoto (p. ej. un bucket R2 con backend "s3").
}

# Token desde terraform.tfvars; si no está ahí, de la variable de entorno CLOUDFLARE_API_TOKEN.
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

module "shopsito" {
  source = "../../modules/shopsito"

  account_id            = var.account_id
  ambiente              = "dev"
  bundle_worker         = "${path.root}/../../../../apps/api/dist/index.js"
  habilitar_workers_dev = true
}
