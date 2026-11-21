# Infraestructura en Cloudflare (Terraform)

Dos ambientes idénticos y separados, cada uno con su propio estado de Terraform:

| Recurso                  | dev                               | prod                      |
| ------------------------ | --------------------------------- | ------------------------- |
| D1 (base de datos)       | `shopsito-db-dev`                 | `shopsito-db-prod`        |
| R2 (fotos)               | `shopsito-fotos-dev`              | `shopsito-fotos-prod`     |
| Worker (API, Hono)       | `shopsito-api-dev`                | `shopsito-api-prod`       |
| Pages (web, React)       | `shopsito-web-dev`                | `shopsito-web-prod`       |
| `workers.dev` del Worker | activado (para probar la API)     | desactivado               |
| `JWT_SECRET`             | aleatorio, generado por Terraform | aleatorio, distinto a dev |

```
infra/
├── desplegar.sh                 # build + terraform + migraciones + Pages, en un paso
└── terraform/
    ├── modules/shopsito/        # todos los recursos de un ambiente
    └── envs/
        ├── dev/                 # module "shopsito" con ambiente = "dev"
        └── prod/                # module "shopsito" con ambiente = "prod"
```

## Cómo se conectan

```
navegador ──► Pages (shopsito-web-<amb>.pages.dev)
                ├── /*      → archivos de apps/web/dist (SPA, _redirects)
                └── /api/*  → apps/web/functions/api/[[path]].ts
                                  └── service binding API ──► Worker shopsito-api-<amb>
                                                                ├── DB     → D1
                                                                ├── FOTOS  → R2
                                                                └── JWT_SECRET
```

La web sigue llamando a `/api` en su mismo origen, igual que con el proxy de Vite en local:
no hace falta CORS ni cambiar código de la app.

## Qué hace Terraform y qué no

- **Sí:** crea D1, R2, el proyecto de Pages (con el binding al Worker) y sube el Worker
  (el bundle `apps/api/dist/index.js`) con sus bindings `DB`, `FOTOS` y `JWT_SECRET`.
- **No:** aplicar migraciones de D1 ni subir los archivos de la web. Eso lo hace Wrangler
  (`desplegar.sh` se encarga). No uses `wrangler deploy` para el Worker: lo maneja Terraform.

## Requisitos

1. Terraform ≥ 1.6 en tu máquina.
2. Un **API token** de Cloudflare (My Profile → API Tokens → Create Custom Token) con
   permisos de cuenta: _D1 Edit_, _Workers R2 Storage Edit_, _Workers Scripts Edit_ y
   _Cloudflare Pages Edit_.
3. El **Account ID** (aparece en el dashboard, barra lateral de Workers & Pages).
4. Haber activado R2 en la cuenta (una vez, desde el dashboard).

Pon el token y el Account ID en `infra/.env` (ignorado por git; nunca lo subas):

```bash
cp infra/.env.example infra/.env   # y llena CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID
```

`desplegar.sh` lo carga solo. El `account_id` de Terraform sale de `envs/<amb>/terraform.tfvars`
(copia el `.example`). Si vas a correr `terraform apply` directo (sin el script), pon también
`cloudflare_api_token` en ese `terraform.tfvars`.

## Desplegar

Con `docker compose up` corriendo (los pasos de Node van dentro del contenedor):

```bash
infra/desplegar.sh dev     # pide confirmar el plan de Terraform
infra/desplegar.sh prod
AUTO_APPROVE=1 infra/desplegar.sh dev   # sin confirmación
```

Al final imprime la URL, p. ej. `https://shopsito-web-dev.pages.dev`.

### Paso a paso (lo que hace el script)

```bash
docker compose exec -T dev pnpm build             # genera apps/api/dist y apps/web/dist

cd infra/terraform/envs/dev
terraform init
terraform apply -var account_id=$CLOUDFLARE_ACCOUNT_ID

# migraciones (config generada con el ID de la D1 remota) y frontend:
#   wrangler d1 migrations apply DB --remote --config .wrangler/deploy-dev.toml
#   cd apps/web && wrangler pages deploy dist --project-name=shopsito-web-dev --branch=main
```

Terraform necesita que exista `apps/api/dist/index.js`: corre el build antes de `plan`/`apply`.
Cuando cambia el código de la API, el hash del bundle cambia y `apply` sube la nueva versión.

## Primer admin

El seed solo corre en local. En un ambiente nuevo: regístrate desde la web y luego
promuévete a admin (cambia el ambiente y el correo):

```bash
docker compose exec -T -e "CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN" \
  -e "CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID" dev \
  pnpm --filter @shopsito/api exec wrangler d1 execute DB --remote \
  --config .wrangler/deploy-dev.toml \
  --command "UPDATE usuarios SET rol = 'admin' WHERE correo = 'tu@correo.com'"
```

## Notas

- El estado (`terraform.tfstate`) es **local** a cada carpeta de `envs/` y está en `.gitignore`.
  Incluye el `JWT_SECRET`, así que no se comparte. Si más de una persona va a desplegar, conviene
  moverlo a un backend remoto (por ejemplo, un bucket R2 con el backend `s3`).
- `terraform destroy` en prod borra la base y las fotos. Para borrar un bucket R2 tiene que
  estar vacío.
- Si el nombre `shopsito-web-<amb>` ya está tomado en `pages.dev`, Cloudflare le agrega un sufijo;
  la URL real sale en el output `url_web`.
