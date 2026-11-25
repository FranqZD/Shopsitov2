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
├── tf.sh                        # terraform con las credenciales del estado remoto (R2)
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

## Estado de Terraform (en R2)

El estado de cada ambiente vive en el bucket R2 privado `shopsito-tfstate`
(`dev/terraform.tfstate` y `prod/terraform.tfstate`), así tu máquina y GitHub Actions ven lo mismo.
Terraform habla con R2 por su API compatible con S3; `infra/tf.sh` arma el endpoint y deriva las
credenciales del mismo `CLOUDFLARE_API_TOKEN` (Access Key ID = id del token, Secret = SHA-256 del
token), así que no hay llaves extra. **Usa `infra/tf.sh <amb> …` en vez de `terraform` directo.**

```bash
infra/tf.sh dev plan
infra/tf.sh prod output url_web
```

### Configuración inicial (una sola vez)

1. Crear el bucket si todavía no existe (con `docker compose up` corriendo). Si ya está, no hace nada:
   ```bash
   source infra/.env && docker compose exec -T -e "CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN" \
     -e "CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID" dev sh -c '
       cd apps/api
       if npx wrangler r2 bucket list | grep -q "shopsito-tfstate"; then
         echo "El bucket shopsito-tfstate ya existe"
       else
         npx wrangler r2 bucket create shopsito-tfstate
       fi'
   ```
2. Subir el estado local que ya existía (respáldalo antes). Terraform pregunta si copiarlo: `yes`.
   ```bash
   infra/tf.sh dev init -migrate-state
   infra/tf.sh prod init -migrate-state
   ```
3. Comprobar que no ve cambios raros: `infra/tf.sh dev plan` debe decir `No changes` (o solo el
   Worker si cambió el código). Si quiere **crear** D1/R2/Pages, el estado no se subió: no apliques.

## Desplegar

### Automático (GitHub Actions)

`.github/workflows/desplegar.yml`:

- En cada **PR**: lint, typecheck, test y build, dentro de la imagen `franqzd/shopsito-dev`
  (el job `imagen` la publica en Docker Hub si cambió `.devcontainer/Dockerfile`).
- En cada **push a `main`**: los mismos checks → despliega a **dev** → espera aprobación →
  despliega a **prod**. Cada despliegue es `AUTO_APPROVE=1 infra/desplegar.sh <amb>`.

Configuración en GitHub (una vez, la hace alguien con permisos de admin del repo):

1. **Settings → Secrets and variables → Actions**: secrets `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID` y `DOCKERHUB_TOKEN` (y opcionales `SENTRY_DSN_API` y `SENTRY_DSN_WEB`);
   variable `DOCKERHUB_USERNAME`.
2. **Settings → Environments**: crear `dev` y `prod`; a `prod` ponerle **Required reviewers**.
3. Recomendado: proteger `main` (solo entra por PR), porque quien cambie el workflow en `main`
   puede usar el token de Cloudflare.

Ojo: las migraciones de D1 se aplican solas, primero en dev y, al aprobar, en prod.

### A mano

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
(En el paso a paso, `terraform …` es `infra/tf.sh dev …`.)
Cuando cambia el código de la API, el hash del bundle cambia y `apply` sube la nueva versión.

## Monitoreo con Sentry (APM, trazas, errores y mensajes)

Opcional: sin DSN todo funciona igual y no se manda nada. Crea en sentry.io dos proyectos
(plataforma _Cloudflare_ para la API y _React_ para la web) y copia su DSN
(Settings → Projects → Client Keys) en `infra/.env` como `SENTRY_DSN_API` y `SENTRY_DSN_WEB`,
y en GitHub como secrets con el mismo nombre. Los eventos se separan por ambiente (`dev`, `prod`).

- **API** (`apps/api/src/lib/monitoreo.ts`, `withSentry` en `src/index.ts`): Terraform le pone al
  Worker `SENTRY_DSN` y `AMBIENTE`. Cada petición es una traza con el nombre de su ruta, con spans
  de middlewares, consultas a D1, R2 y pasos propios (`paso(...)`, p. ej. "Apartar existencias").
  Los errores 5xx se mandan solos; los 4xx son esperados y solo quedan en la traza.
- **Web** (`apps/web/src/lib/monitoreo.ts`): mide cargas y navegaciones por ruta, captura errores de
  render y agrega `sentry-trace` a los `fetch` de `/api`, así una traza va del clic a la base.
  El DSN se fija al hacer build (`VITE_SENTRY_DSN`, `VITE_AMBIENTE`).
- **Mensajes** (`avisar(...)`): pedido sin existencias, pedido cancelado por hora límite, nuevo
  reporte y sesión rechazada por la API.
- **Privacidad:** el usuario va solo con su id y rol; nunca se mandan cuerpos de petición
  (llevan contraseñas) ni cookies.

Para probarlo en local, pon `SENTRY_DSN` en `apps/api/.dev.vars` y/o `VITE_SENTRY_DSN` en
`apps/web/.env.local` (ambos ignorados por git); salen con ambiente `local`.

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

- El estado incluye el `JWT_SECRET`: el bucket `shopsito-tfstate` debe quedarse privado.
- No hay bloqueo del estado: evita correr `apply` a mano mientras GitHub Actions despliega
  (el workflow ya no deja que dos despliegues de CI corran a la vez).
- `terraform destroy` en prod borra la base y las fotos. Para borrar un bucket R2 tiene que
  estar vacío.
- Si el nombre `shopsito-web-<amb>` ya está tomado en `pages.dev`, Cloudflare le agrega un sufijo;
  la URL real sale en el output `url_web`.
