# Shopsito: contexto para sesiones de Claude

Marketplace del día para la comunidad de una universidad. Cualquiera publica lo que trae **hoy** (comida, snacks, artículos) con precio, cantidad y hora límite; otros lo piden y lo recogen en puntos de entrega del campus. El vendedor acepta y entrega; el comprador sigue el estado y califica. Registro directo, sin códigos de verificación; con correo institucional se gana la insignia "Comunidad". Un admin gestiona puntos de entrega y revisa reportes.

Proyecto escolar de 3 personas. Prioridad: simple y que funcione de punta a punta en local. **No** crear recursos en la nube ni CI salvo que se pida (no corras `terraform apply` ni `infra/desplegar.sh` por tu cuenta).

Guías por área (se cargan al trabajar en esa carpeta):

- Backend: [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md)
- Frontend: [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md)
- Para humanos: [`README.md`](README.md)
- Despliegue en Cloudflare: [`infra/README.md`](infra/README.md)

## Stack

Monorepo con pnpm workspaces (pnpm 10.34, fijado en `packageManager`).

| Carpeta           | Qué es                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| `apps/web`        | React 19 + Vite 8 + TypeScript + React Router 8 + Tailwind v4 + lucide-react   |
| `apps/api`        | Cloudflare Worker con Hono, `wrangler.toml`, D1 (SQLite) con Drizzle, R2 fotos |
| `packages/shared` | Enums, esquemas Zod, tipos y helpers de fecha compartidos (se consume como TS) |
| `infra/`          | Terraform (módulo + ambientes `dev`/`prod`) y `desplegar.sh` para Cloudflare   |

TypeScript se queda en **~6.0**: typescript-eslint aún no soporta TS 7.

## Cómo correr

Con Docker (lo normal para el equipo):

```bash
docker compose up                      # instala, migra, siembra y levanta web (5173) + api (8787)
docker compose exec -T dev pnpm test   # cualquier comando dentro del contenedor
```

Sin Docker (p. ej. una sesión en la nube con Node ≥ 24 y Linux/glibc):

```bash
corepack enable
pnpm preparar   # install + .dev.vars + migraciones + seed
pnpm dev
```

URLs: web http://localhost:5173 (proxy de `/api` al Worker), api http://localhost:8787/api/health.

Usuarios del seed: `admin@shopsito.test` / `admin1234` (admin); `ana@`, `beto@`, `mariana@`, `diego@`… `@shopsito.test` / `shopsito123`. El seed **borra todo** y calcula las horas límite a partir de "ahora": si el catálogo sale vacío, vuelve a correr `pnpm db:seed`.

## Comandos (raíz)

`pnpm preparar` · `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm format` · `pnpm typecheck` · `pnpm test` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed`

Antes de terminar cualquier cambio: `pnpm format && pnpm lint && pnpm typecheck && pnpm test` (y `pnpm build` si tocaste config). Todo debe pasar.

## Estado actual (actualízalo cuando implementes algo)

**Backend implementado:** `GET /api/health`, `GET /api/productos/hoy`, `GET /api/productos/:id`, categoría de producto, `POST /api/productos` (publicar), `GET /api/productos/mios` (lo publicado hoy con vendidos, ingresos y cantidad inicial calculada), `PATCH`/`DELETE /api/productos/:id` (solo el dueño; quitar algo con pedidos lo deja agotado en vez de borrarlo), `POST /api/productos/:id/foto` (R2) y `GET /api/fotos/productos/:id/:archivo`, CRUD de `/api/puntos-entrega`, auth completo (registro que deja la sesión abierta, login, logout, `POST /auth/institucional` → insignia; registrarse con correo de la uni también la da), middleware JWT (todo exige sesión salvo `health`, `login`, `registro` y las fotos, que se cargan con `<img>`), validación y errores, esquema D1 con migraciones y seed.

**Backend en 501 (rutas y validación ya existen):** usuarios, pedidos (todo), calificaciones, notificaciones, reportes.

**Frontend:** todas las pantallas existen con el diseño final y son responsive. Sin sesión vigente (token vencido incluido) todo redirige a `/login?volver=…`; un 401 de la API cierra la sesión. Usan datos reales: catálogo (filtro por categoría y búsqueda; quita lo que cierra sin recargar y se actualiza al volver a la pestaña), detalle de producto y confirmar (vía `GET /api/productos/:id`, puntos reales), vender (publicar con categoría y foto de cámara o galería; editar, quitar y agregar más en "Lo que vendes hoy"), entrar, registro y admin de puntos. El resto usa `apps/web/src/lib/ejemplos.ts` con `TODO`. Confirmar pedido llama a la API y muestra el 501. Aún no hay pantalla para el correo institucional.

**Infra:** Terraform en `infra/terraform` crea por ambiente (dev, prod) una D1, un bucket R2, el Worker (sube `apps/api/dist/index.js` con bindings `DB`, `FOTOS`, `JWT_SECRET`) y un proyecto de Pages cuya función `apps/web/functions/api/[[path]].ts` reenvía `/api/*` al Worker por service binding (mismo origen, sin CORS). Migraciones remotas y subida de la web van con Wrangler desde `infra/desplegar.sh`. Si agregas un binding o secreto al Worker, agrégalo también en `infra/terraform/modules/shopsito/main.tf`.

**Datos que el diseño muestra y el modelo aún no tiene:** hora de publicación, calificación del vendedor, nota del pedido, método de pago.

**Siguiente paso sugerido:** flujo de pedidos de punta a punta (crear, aceptar/rechazar/entregar/cancelar, descontar inventario, notificar al vendedor).

Al implementar un endpoint, conecta su pantalla: quita los datos de `ejemplos.ts` que ya no se usen y sus `TODO`.

## Convenciones generales

- Código, nombres y textos en **español** (`crearPedido`, `puntosEntrega`, `horaLimite`).
- IDs UUID en texto; fechas en texto ISO; **dinero en centavos** (entero). La UI convierte con `formatoPrecio`.
- Zona horaria del campus `America/Mexico_City`. Usa `ahoraCampus()` y `segundosHastaHora()` de `@shopsito/shared`; nunca `new Date().getHours()`.
- No hay cron: el catálogo del día se filtra por `fecha = hoy` y `horaLimite > ahora`.
- Sin correos ni códigos de verificación: **no se mandan correos** (nada de SMTP ni servicios de correo) y el registro no pide código. La tabla `codigos_verificacion` y la columna `correo_verificado` quedan sin uso (todo usuario nuevo nace verificado).
- Notificaciones en tiempo real: fuera de alcance (hay TODO); se consultan al abrir la pantalla.
- Comentarios solo donde aportan el "por qué", como el código existente.

## Git

- Ramas desde `main`: `feature/descripcion` (lo que se trabaja, sin número de ticket) y `fix/descripcion`.
- Commits pequeños con Conventional Commits en español: `feat(api): …`, `fix(web): …`, `chore: …`, `docs: …`, `test: …`.
- No hacer push ni abrir PR salvo que se pida.
- Sin líneas de atribución: nada de `Co-Authored-By: Claude…` ni "Generated with Claude Code" en commits ni PRs.

## Cuidado con

- `pnpm format` reescribe todo lo que no esté en `.prettierignore`/`.gitignore`. No formatees archivos ajenos al proyecto.
- `referencias/` (si existe localmente) es el paquete de diseño original: está en `.gitignore`, ya no se usa y no se edita.
- En Docker, `node_modules` vive en volúmenes nombrados. Si cambian dependencias y Vite no las ve, reinicia: `docker compose down && docker compose up`.
- Si cambias `wrangler.toml`, regenera tipos: `pnpm --filter @shopsito/api cf-typegen`.
- `.dev.vars` nunca se sube; `.dev.vars.example` sí.
