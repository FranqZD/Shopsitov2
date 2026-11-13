# Shopsito: contexto para sesiones de Claude

Marketplace del día para la comunidad de una universidad. Cualquiera publica lo que trae **hoy** (comida, snacks, artículos) con precio, cantidad y hora límite; otros lo piden y lo recogen en puntos de entrega del campus. El vendedor acepta y entrega; el comprador sigue el estado y califica. Registro con código al correo; con correo institucional se gana la insignia "Comunidad". Un admin gestiona puntos de entrega y revisa reportes.

Proyecto escolar de 3 personas. Prioridad: simple y que funcione de punta a punta en local. **No** crear recursos en la nube, Terraform ni CI salvo que se pida.

Guías por área (se cargan al trabajar en esa carpeta):

- Backend: [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md)
- Frontend: [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md)
- Para humanos: [`README.md`](README.md)

## Stack

Monorepo con pnpm workspaces (pnpm 10.34, fijado en `packageManager`).

| Carpeta           | Qué es                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| `apps/web`        | React 19 + Vite 8 + TypeScript + React Router 8 + Tailwind v4 + lucide-react   |
| `apps/api`        | Cloudflare Worker con Hono, `wrangler.toml`, D1 (SQLite) con Drizzle, R2 fotos |
| `packages/shared` | Enums, esquemas Zod, tipos y helpers de fecha compartidos (se consume como TS) |

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
pnpm install
cp -n apps/api/.dev.vars.example apps/api/.dev.vars
pnpm db:migrate && pnpm db:seed
pnpm dev
```

URLs: web http://localhost:5173 (proxy de `/api` al Worker), api http://localhost:8787/api/health.

Usuarios del seed: `admin@shopsito.test` / `admin1234` (admin); `ana@`, `beto@`, `mariana@`, `diego@`… `@shopsito.test` / `shopsito123`. El seed **borra todo** y calcula las horas límite a partir de "ahora": si el catálogo sale vacío, vuelve a correr `pnpm db:seed`.

## Comandos (raíz)

`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm format` · `pnpm typecheck` · `pnpm test` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed`

Antes de terminar cualquier cambio: `pnpm format && pnpm lint && pnpm typecheck && pnpm test` (y `pnpm build` si tocaste config). Todo debe pasar.

## Estado actual (actualízalo cuando implementes algo)

**Backend implementado:** `GET /api/health`, `GET /api/productos/hoy`, CRUD de `/api/puntos-entrega`, `POST /api/auth/login` (mínimo) y `logout`, middleware JWT, validación y errores, esquema D1 con migración inicial y seed.

**Backend en 501 (rutas y validación ya existen):** registro/verificación/institucional, usuarios, productos (detalle, crear, editar, borrar, foto R2), pedidos (todo), calificaciones, notificaciones, reportes.

**Frontend:** todas las pantallas existen con el diseño final y son responsive. Usan datos reales: catálogo, detalle de producto (lo busca en el catálogo del día), confirmar (puntos reales), entrar y admin de puntos. El resto usa `apps/web/src/lib/ejemplos.ts` con `TODO`. Registro, verificar, publicar y confirmar pedido ya llaman a la API y muestran el 501.

**Datos que el diseño muestra y el modelo aún no tiene:** categoría del producto, cantidad inicial ("Quedan 4 de 12"), hora de publicación, calificación del vendedor, nota del pedido, método de pago.

**Siguiente paso sugerido:** flujo de pedidos de punta a punta (crear, aceptar/rechazar/entregar/cancelar, descontar inventario, notificar al vendedor), luego publicar productos y registro.

Al implementar un endpoint, conecta su pantalla: quita los datos de `ejemplos.ts` que ya no se usen y sus `TODO`.

## Convenciones generales

- Código, nombres y textos en **español** (`crearPedido`, `puntosEntrega`, `horaLimite`).
- IDs UUID en texto; fechas en texto ISO; **dinero en centavos** (entero). La UI convierte con `formatoPrecio`.
- Zona horaria del campus `America/Mexico_City`. Usa `ahoraCampus()` y `segundosHastaHora()` de `@shopsito/shared`; nunca `new Date().getHours()`.
- No hay cron: el catálogo del día se filtra por `fecha = hoy` y `horaLimite > ahora`.
- Notificaciones en tiempo real: fuera de alcance (hay TODO); se consultan al abrir la pantalla.
- Comentarios solo donde aportan el "por qué", como el código existente.

## Git

- Ramas desde `main`: `feature/SH-XX-descripcion` y `fix/descripcion`.
- Commits pequeños con Conventional Commits en español: `feat(api): …`, `fix(web): …`, `chore: …`, `docs: …`, `test: …`.
- No hacer push ni abrir PR salvo que se pida.
- Sin líneas de atribución: nada de `Co-Authored-By: Claude…` ni "Generated with Claude Code" en commits ni PRs.

## Cuidado con

- `pnpm format` reescribe todo lo que no esté en `.prettierignore`/`.gitignore`. No formatees archivos ajenos al proyecto.
- `referencias/` (si existe localmente) es el paquete de diseño original: está en `.gitignore`, ya no se usa y no se edita.
- En Docker, `node_modules` vive en volúmenes nombrados. Si cambian dependencias y Vite no las ve, reinicia: `docker compose down && docker compose up`.
- Si cambias `wrangler.toml`, regenera tipos: `pnpm --filter @shopsito/api cf-typegen`.
- `.dev.vars` nunca se sube; `.dev.vars.example` sí.
