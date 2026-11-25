# Shopsito: contexto para sesiones de Claude

Marketplace del día para la comunidad de una universidad. Cualquiera publica lo que trae **hoy** (comida, snacks, artículos) con precio, cantidad y hora límite; otros lo piden y lo recogen en puntos de entrega del campus. El vendedor acepta y entrega; el comprador sigue el estado y califica. Registro directo, sin códigos de verificación; con correo institucional se gana la insignia "Comunidad". Un admin gestiona puntos de entrega y revisa reportes.

Proyecto escolar de 3 personas. Prioridad: simple y que funcione de punta a punta en local. **No** crear recursos en la nube salvo que se pida (no corras `terraform apply`, `infra/tf.sh` ni `infra/desplegar.sh` por tu cuenta). Hay CI en `.github/workflows/desplegar.yml`: checks en cada PR y, en cada push a `main`, despliegue a dev y luego a prod con aprobación manual.

Guías por área (se cargan al trabajar en esa carpeta):

- Backend: [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md)
- Frontend: [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md)
- Para humanos: [`README.md`](README.md)
- Despliegue en Cloudflare: [`infra/README.md`](infra/README.md)
- Wiki con diagramas: [`docs/WIKI.md`](docs/WIKI.md)

## Stack

Monorepo con pnpm workspaces (pnpm 10.34, fijado en `packageManager`).

| Carpeta           | Qué es                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| `apps/web`        | React 19 + Vite 8 + TypeScript + React Router 8 + Tailwind v4 + lucide-react   |
| `apps/api`        | Cloudflare Worker con Hono, `wrangler.toml`, D1 (SQLite) con Drizzle, R2 fotos |
| `packages/shared` | Enums, esquemas Zod, tipos y helpers de fecha compartidos (se consume como TS) |
| `infra/`          | Terraform (estado en R2), `desplegar.sh` y `tf.sh`; CI en `.github/workflows`  |

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

## Wiki (actualízala siempre)

`docs/WIKI.md` debe describir lo que hay en el código. Si tu cambio toca algo de esta tabla, actualiza la wiki **en el mismo cambio**, sin que te lo pidan:

| Si cambias…                                     | Actualiza en la wiki                              |
| ----------------------------------------------- | ------------------------------------------------- |
| Reglas de negocio, roles o estados de un pedido | Sección 1 (reglas, actores y diagrama de estados) |
| Tablas o enums                                  | 2.2 (modelo de dominio)                           |
| Rutas o funciones de la API                     | 2.3 y 2.4 (clases) y 2.8 (endpoints)              |
| `packages/shared`                               | 2.5                                               |
| `lib/`, páginas o componentes de la web         | 2.6 y 2.7                                         |
| Dependencias o versiones principales            | Sección 3                                         |
| Terraform, bindings o secretos                  | Sección 4 (inventario y diagramas)                |
| Docker, `desplegar.sh` o el workflow de GitHub  | Sección 5                                         |

- Al implementar algo que respondía `501`: quita la cursiva (el `*` al final del método) y cambia ⏳ por ✅.
- Al conectar una pantalla a la API, cambia su columna "Datos" en 2.7.
- Los diagramas son Mermaid: revisa que sigan dibujándose. Si nada de la tabla cambió, no toques la wiki.

## Estado actual (actualízalo cuando implementes algo)

**Backend implementado:** `GET /api/health`, `GET /api/productos/hoy`, `GET /api/productos/:id`, categoría de producto, `GET /api/usuarios/me` y `/:id` (perfil con ventas, publicaciones y resumen de calificaciones), `GET /api/calificaciones/vendedor/:id`, reportes (`POST` cualquiera; `GET`/`PATCH` admin, con nota), admin de productos (`GET /api/admin/productos?fecha=`, `PATCH` ocultar/mostrar, `DELETE`; el estado `oculto` solo lo pone o quita un admin), `POST /api/productos` (publicar), `GET /api/productos/mios` (lo publicado hoy con vendidos, ingresos y cantidad inicial calculada), `GET /api/pedidos/ventas` (lo que le pidieron hoy al vendedor; los pendientes vencidos se cancelan al consultar) y `POST /api/pedidos/:id/aceptar|rechazar|entregar` (solo el vendedor; rechazar o cancelar devuelve lo apartado a productos disponibles y cada cambio deja una notificación al comprador), `PATCH`/`DELETE /api/productos/:id` (solo el dueño; quitar algo con pedidos lo deja agotado en vez de borrarlo), `POST /api/productos/:id/foto` (R2) y `GET /api/fotos/productos/:id/:archivo`, CRUD de `/api/puntos-entrega`, auth completo (registro que deja la sesión abierta, login, logout, `POST /auth/institucional` → insignia; registrarse con correo de la uni también la da), middleware JWT (todo exige sesión salvo `health`, `login`, `registro` y las fotos, que se cargan con `<img>`), validación y errores, esquema D1 con migraciones y seed.

**Backend en 501 (rutas y validación ya existen):** editar/borrar usuario, crear calificación, pedidos (crear, compras, cancelar), notificaciones.

**Frontend:** todas las pantallas existen con el diseño final y son responsive. Sin sesión vigente (token vencido incluido) todo redirige a `/login?volver=…`; un 401 de la API cierra la sesión. Usan datos reales: catálogo (filtro por categoría y búsqueda; quita lo que cierra sin recargar y se actualiza al volver a la pestaña), detalle de producto y confirmar (vía `GET /api/productos/:id`, puntos reales), vender (publicar con categoría y foto de cámara o galería; editar, quitar y agregar más en "Lo que vendes hoy"; contador de pedidos nuevos), mis ventas (aceptar, rechazar y entregar), perfil (datos, estadísticas y reseñas reales, reportar a otra persona; en computadora el avatar abre un menú con Perfil y Salir), entrar, registro y el panel de admin completo (`/admin` productos, `/admin/puntos`, `/admin/reportes`; los admins ven "Admin" en la nav superior). El resto usa `apps/web/src/lib/ejemplos.ts` con `TODO`. Confirmar pedido llama a la API y muestra el 501. Aún no hay pantalla para el correo institucional.

**Monitoreo:** Sentry en API y web (APM, trazas de punta a punta, errores 5xx y de render, mensajes con `avisar`). Se activa con `SENTRY_DSN_API`/`SENTRY_DSN_WEB`; sin DSN no hace nada. Ver `infra/README.md`.

**Datos que el diseño muestra y el modelo aún no tiene:** hora de publicación, tiempo en aceptar pedidos, hora de entrega, nota del pedido, método de pago.

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
