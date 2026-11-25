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

  # Estado remoto en el bucket R2 `shopsito-tfstate` (compatible con S3), compartido entre
  # tu máquina y GitHub Actions. Contiene el JWT_SECRET: el bucket es privado.
  # infra/tf.sh pone el endpoint (AWS_ENDPOINT_URL_S3) y las credenciales; no corras
  # `terraform` directo en esta carpeta.
  backend "s3" {
    bucket = "shopsito-tfstate"
    key    = "dev/terraform.tfstate"
    region = "auto"

    # R2 habla S3 pero no es AWS: se apagan las validaciones propias de AWS.
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
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
  sentry_dsn            = var.sentry_dsn
}
