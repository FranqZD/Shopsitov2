# Shopsito

Marketplace para la comunidad universitaria: cualquiera publica lo que tiene **hoy** (comida, snacks, artículos) con precio, cantidad y hora límite; otros lo compran y lo reciben en puntos de entrega dentro del campus.

> Estado: **esqueleto**. La estructura, configuración y rutas existen; la mayor parte de la lógica de negocio responde `501 Not Implemented`. Ver [Qué está implementado](#qué-está-implementado).

## Stack

| Parte             | Tecnología                                                                      |
| ----------------- | ------------------------------------------------------------------------------- |
| `apps/web`        | React + Vite + TypeScript + React Router + Tailwind (destino: Cloudflare Pages) |
| `apps/api`        | Cloudflare Worker con Hono + TypeScript (`wrangler.toml`)                       |
| Base de datos     | Cloudflare D1 + Drizzle ORM (migraciones con `drizzle-kit`)                     |
| Fotos             | Cloudflare R2 (binding `FOTOS`)                                                 |
| `packages/shared` | Esquemas Zod, enums y tipos compartidos entre web y api                         |
| Pruebas           | Vitest                                                                          |

En local **no se usa la nube**: Wrangler simula D1 y R2 en `apps/api/.wrangler/`.

## Cómo abrir el proyecto

Solo necesitas **Docker** (Docker Desktop en Mac/Windows). No instales Node en tu máquina. Funciona en Apple Silicon (arm64) y x86.

### Opción A: VS Code + Dev Containers (recomendada)

1. Instala la extensión **Dev Containers**.
2. Abre la carpeta del repo → `Dev Containers: Reopen in Container`.
3. La primera vez se ejecuta `pnpm preparar` (instala dependencias, aplica migraciones y corre el seed). Tarda unos minutos.
4. En la terminal del contenedor: `pnpm dev`.

### Opción B: docker compose (sin VS Code)

```bash
docker compose up          # instala, migra, siembra y levanta web + api
```

Para correr comandos dentro del contenedor:

```bash
docker compose exec dev pnpm test
docker compose exec dev bash   # shell interactiva
```

### URLs

- Web: http://localhost:5173 (las llamadas a `/api` pasan por el proxy de Vite)
- API: http://localhost:8787/api/health

### Usuarios del seed

| Correo                | Contraseña    | Rol                    |
| --------------------- | ------------- | ---------------------- |
| `admin@shopsito.test` | `admin1234`   | admin                  |
| `ana@shopsito.test`   | `shopsito123` | usuario (con insignia) |
| `beto@shopsito.test`  | `shopsito123` | usuario                |

También hay vendedores de ejemplo del diseño (`mariana@`, `diego@`, `fernanda@`, `jorge@`, `paola@`, `andrea@`, `sofia@`, `luis@` `shopsito.test`, todos con `shopsito123`).

`pnpm db:seed` **borra** los datos locales y vuelve a crearlos. Las horas límite se calculan a partir de la hora en que lo corres (la primera cierra en 18 min), así que si ya no ves productos o contadores, vuelve a correrlo.

### Notas del entorno Docker

- La imagen es la oficial `node:24-bookworm-slim` más los certificados raíz (`.devcontainer/Dockerfile`, 3 líneas). Debian y no Alpine porque `workerd` necesita glibc.
- `node_modules` de la raíz vive en un volumen nombrado, así no se mezclan binarios de tu sistema con los de Linux. Si algo se rompe: `docker compose down -v` y vuelve a levantar.
- El contenedor no trae git: haz commits desde tu máquina (o desde la terminal de VS Code fuera del contenedor).
- El estado local de D1/R2 está en `apps/api/.wrangler/` (ignorado por git) y persiste entre reinicios. Bórralo para empezar desde cero.
- Los secretos locales están en `apps/api/.dev.vars` (se crea a partir de `.dev.vars.example`; nunca se sube).

## Scripts (raíz)

| Comando            | Qué hace                                                                |
| ------------------ | ----------------------------------------------------------------------- |
| `pnpm preparar`    | Instala dependencias, crea `.dev.vars`, migra y siembra (lo usa Docker) |
| `pnpm dev`         | Levanta web (5173) y api (8787)                                         |
| `pnpm build`       | Build de web y bundle de la api (`wrangler deploy --dry-run`)           |
| `pnpm lint`        | ESLint en todo el repo                                                  |
| `pnpm format`      | Prettier en todo el repo                                                |
| `pnpm typecheck`   | `tsc` en cada paquete                                                   |
| `pnpm test`        | Vitest en cada paquete                                                  |
| `pnpm db:generate` | Genera una migración SQL a partir de `apps/api/src/db/schema.ts`        |
| `pnpm db:migrate`  | Aplica migraciones a la D1 **local**                                    |
| `pnpm db:seed`     | Resetea y siembra la D1 local                                           |

Si cambias `wrangler.toml`, regenera los tipos del runtime con `pnpm --filter @shopsito/api cf-typegen`.

## Diseño del frontend

El diseño que ya está en la app es la referencia: tokens, componentes base y pantallas. Cualquier pantalla nueva debe verse como las existentes.

### Reglas

- **Sensación:** tienda entre estudiantes, relajada y amigable. La foto del producto es la protagonista.
- **Todo es "de hoy":** la hora límite siempre se ve. Una publicación es urgente cuando faltan ≤ 30 min: chip mango con cuenta regresiva en vivo (`ChipFaltan`). Poco stock (≤ 2) también va en mango.
- **Colores:** la urgencia se comunica con **mango**, nunca con rojo. El rojo (`error`) es solo para errores reales: sin red, pedido rechazado, ocultar publicación.
- **Forma:** esquinas muy redondeadas, botones y chips en pastilla (`rounded-full`), sombras suaves (`shadow-tarjeta`) en lugar de bordes. Botón principal de 56 px de alto; todo lo tocable ≥ 44 px.
- **Tipografía:** Gabarito (`font-display`) para títulos, precios y horas (con `num` para números tabulares); Figtree para el resto. Monoespaciada solo en el código de verificación.
- **Tono:** directo y cercano, como habla un estudiante. Nada de marketing ("¡Descubre…!") ni "Bienvenido de nuevo".
- **Evitar:** bordes duros, esquinas rectas, degradados morados, glassmorphism y emojis como iconos.

### En el código

- Tokens de Tailwind v4 en `apps/web/src/styles/shopsito.css`. Usa las clases del tema (`bg-azul`, `text-sobre-azul`, `bg-mango-50`, `rounded-tarjeta`, `shadow-tarjeta`, `num`…), no colores sueltos.
- Componentes base en `apps/web/src/components/` (`Tarjeta`, `ChipHora`, `PastillaEstado`, `Insignia`, `SelectorCantidad`, `BarraAccion`, `NavInferior`, `NavSuperior`, `Skeleton`…). Reúsalos antes de crear uno nuevo.
- Iconos con `lucide-react` (trazo 2, 17–22 px).
- Modo oscuro con `data-theme="oscuro"` en `<html>` (se cambia en tu perfil). Sobre `bg-azul` usa `text-sobre-azul`, nunca `text-white`.
- **Responsive:** diseña primero para celular y agrega los `md:`/`lg:` después.
  - Celular (< 768 px): columna única y navegación inferior flotante (`NavInferior`).
  - Tablet y computadora (`md:` ≥ 768 px, `lg:` ≥ 1024 px): navegación superior (`NavSuperior`), contenido hasta 1152 px, catálogo de 3 a 5 columnas y pantallas en dos columnas. `BarraAccion` es fija abajo en celular y una tarjeta normal en computadora.
  - Acceso (`LayoutAcceso`): panel de marca a la izquierda desde `lg:`.
- Las pantallas cuya API aún responde 501 usan datos de ejemplo de `apps/web/src/lib/ejemplos.ts`, marcados con `TODO`.

## Estructura del repo

```
.
├── .devcontainer/          # Dockerfile mínimo (Node 24 slim + certificados) y devcontainer.json
├── docker-compose.yml
├── apps/
│   ├── api/
│   │   ├── migrations/             # SQL generado por drizzle-kit (no editar a mano)
│   │   ├── scripts/seed.ts
│   │   ├── src/
│   │   │   ├── index.ts            # app Hono: monta los módulos bajo /api
│   │   │   ├── env.ts              # tipos de bindings (DB, FOTOS, JWT_SECRET) y payload JWT
│   │   │   ├── db/schema.ts        # tablas Drizzle
│   │   │   ├── lib/                # errores, validador Zod, db, password
│   │   │   ├── middleware/auth.ts  # requireAuth (JWT) y requireAdmin
│   │   │   └── modules/<modulo>/routes.ts
│   │   ├── drizzle.config.ts
│   │   └── wrangler.toml
│   └── web/
│       ├── public/_redirects       # SPA en Cloudflare Pages
│       └── src/
│           ├── lib/api.ts          # cliente tipado con tipos de @shopsito/shared
│           ├── components/         # Layout (navbar), etc.
│           └── pages/
└── packages/shared/src/            # enums, esquemas Zod, helper de fecha del campus
```

### Convenciones

- IDs: UUID en texto. Fechas: texto ISO. Dinero: **centavos** (entero).
- Enums en `packages/shared/src/enums.ts`; el esquema de Drizzle los importa.
- Errores de la API: siempre `{ "error": { "code": "...", "message": "..." } }`. Lanza `AppError` o `notFound()` y el handler central (`lib/errors.ts`) da el formato.
- Catálogo del día sin cron: `fecha = hoy` y `horaLimite > ahora` en hora de `America/Mexico_City` (`ahoraCampus()` en shared).

## Cómo crear un módulo nuevo (copiando puntos de entrega)

`apps/api/src/modules/puntos-entrega/routes.ts` es el **módulo de referencia** con CRUD completo.

1. **Esquemas** en `packages/shared/src/schemas/<recurso>.ts` (entrada con Zod + tipo de respuesta) y expórtalos en `packages/shared/src/index.ts`.
2. **Tabla** (si hace falta) en `apps/api/src/db/schema.ts`, luego `pnpm db:generate` y `pnpm db:migrate`. Sube el `.sql` generado junto con tu cambio.
3. **Rutas**: copia `modules/puntos-entrega/routes.ts` a `modules/<recurso>/routes.ts` y adapta:
   - valida con `validar('json' | 'param' | 'query', schema)` y lee con `c.req.valid(...)`;
   - protege con `requireAuth` (y `requireAdmin` después, si aplica); el usuario está en `c.get('jwtPayload').sub`;
   - usa `getDb(c)` para Drizzle y `nuevoId()` para IDs.
4. **Monta** el router en `apps/api/src/index.ts` con `.route('/<recurso>', ...)`.
5. **Cliente**: agrega las funciones en `apps/web/src/lib/api.ts` usando los tipos de shared.
6. Agrega al menos una prueba en Vitest.

## Ramas y commits

- Ramas desde `main`: `feature/SH-XX-descripcion` (XX = número de tarea) y `fix/descripcion`.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/): `feat(api): ...`, `fix(web): ...`, `chore: ...`, `docs: ...`, `test: ...`.
- Antes de abrir un PR: `pnpm lint && pnpm typecheck && pnpm test`.

## Qué está implementado

**Funciona de punta a punta**

- `GET /api/health`
- `GET /api/productos/hoy` (filtro del día por zona horaria del campus, con datos del vendedor)
- `/api/puntos-entrega`: CRUD completo (lectura pública; crear/editar/borrar solo admin)
- `POST /api/auth/login` (mínimo, para probar rutas protegidas) y `POST /api/auth/logout` (sin estado)
- Middleware JWT (`requireAuth`, `requireAdmin`), validación Zod y errores centralizados
- Web con el diseño aprobado. Con datos reales: catálogo (`/`), detalle (`/producto/:id`), confirmar (puntos de entrega reales), entrar (`/login`) y admin de puntos de entrega (`/admin`)

**Stub (`501 Not Implemented`, con validación ya conectada)**

- auth: registro, verificación de código, correo institucional
- usuarios, resto de productos (detalle, crear, editar, borrar, foto en R2), pedidos, calificaciones, notificaciones, reportes
- Pantallas web con datos de ejemplo (`lib/ejemplos.ts`) hasta que exista su API: mis pedidos y detalle, calificar, vender y mis ventas, perfil (reseñas y estadísticas), notificaciones, reportes de admin. Registro, verificar, publicar y confirmar pedido ya llaman a la API y muestran su respuesta 501.
- Datos que el diseño muestra pero la API aún no tiene: categoría del producto, cantidad inicial (barra "Quedan 4 de 12"), hora de publicación, calificación del vendedor, nota del pedido y método de pago.

**Fuera de alcance por ahora**: notificaciones en tiempo real (hay un TODO), Terraform, CI y recursos en la nube.
