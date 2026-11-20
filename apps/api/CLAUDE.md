# Backend (`apps/api`): cómo construir cosas

Cloudflare Worker con Hono. Todo cuelga de `/api` en `src/index.ts`. En local Wrangler simula D1 y R2 en `.wrangler/` (nada en la nube).

## Mapa

```
src/
├── index.ts               # app Hono: basePath('/api'), monta módulos, onError/notFound
├── env.ts                 # Bindings (DB, FOTOS, JWT_SECRET), JwtPayload { sub, rol, exp }, AppEnv
├── db/schema.ts           # tablas Drizzle (camelCase en TS, snake_case en SQL)
├── lib/
│   ├── db.ts              # getDb(c), nuevoId(), ahoraIso()
│   ├── errors.ts          # AppError, notFound(), notImplemented(c), onError, onNotFound
│   ├── validator.ts       # validar(target, schema): zValidator que lanza al handler central
│   └── password.ts        # hashPassword / verificarPassword (PBKDF2, WebCrypto)
├── middleware/auth.ts     # requireAuth (JWT HS256), requireAdmin
└── modules/<recurso>/routes.ts
scripts/seed.ts            # seed local (borra y vuelve a crear)
migrations/                # SQL generado por drizzle-kit: no editar a mano
```

## Crear o implementar un endpoint

Modelo a copiar: `src/modules/puntos-entrega/routes.ts` (CRUD completo).

1. **Contrato en `packages/shared`.** Esquema Zod de entrada en `src/schemas/<recurso>.ts` (exporta también `z.infer` y el tipo de respuesta) y reexpórtalo en `src/index.ts`. Enums nuevos en `src/enums.ts` como `const` arrays.
2. **Rutas** en `src/modules/<recurso>/routes.ts`, encadenadas sobre `new Hono<AppEnv>()`:
   ```ts
   .post('/', requireAuth, validar('json', crearXSchema), async (c) => {
     const datos = c.req.valid('json')
     const { sub: usuarioId } = c.get('jwtPayload')
     const [creado] = await getDb(c).insert(tabla).values({ id: nuevoId(), ...datos }).returning()
     return c.json<TipoRespuesta>(creado!, 201)
   })
   ```
   - Valida `param`, `query` y `json` con `validar(...)`; para `:id` usa `idParamSchema`.
   - Protege con `requireAuth` y, si aplica, `requireAdmin` **después**.
   - Para "no encontrado": `throw notFound('Pedido')`. Otros errores: `throw new AppError(409, 'CONFLICT', 'Mensaje para el usuario')`. Nunca armes `c.json({ error })` a mano: el formato `{ error: { code, message } }` lo da `onError`.
   - Mensajes de error en español, en tono cercano.
   - Si la ruta aún no se implementa, deja `validar(...)` y responde con `notImplemented`.
3. **Montar** el router en `src/index.ts` con `.route('/<recurso>', …)` (solo si es un recurso nuevo).
4. **Prueba** en Vitest (`src/*.test.ts`) con `app.request(ruta, init, env)`. No hay D1 en las pruebas: cubre validación, auth y lógica pura; extrae lógica de negocio a funciones puras para poder probarla.
5. **Frontend:** agrega la función al cliente `apps/web/src/lib/api.ts` y conecta la pantalla (ver `apps/web/CLAUDE.md`).

## Base de datos

- Cambia `src/db/schema.ts` → `pnpm db:generate` (crea `migrations/NNNN_*.sql`; usa `--name=descripcion`) → `pnpm db:migrate`. Sube el `.sql` y `migrations/meta` en el mismo commit.
- Convenciones: `id` texto UUID (`nuevoId()`), fechas texto ISO (`ahoraIso()`), dinero entero en centavos, booleanos `integer({ mode: 'boolean' })`, enums con `text('x', { enum: CONST_DE_SHARED })`.
- Varias escrituras que deben ir juntas (p. ej. crear pedido + descontar inventario + notificación): usa `db.batch([...])` (D1 no tiene transacciones interactivas).
- Las llaves foráneas sí se aplican en D1: borrar algo referenciado falla; captura y responde 409 (ver `puntos-entrega`).
- Si agregas tablas o datos de ejemplo útiles, actualiza `scripts/seed.ts` (orden de borrado inverso a las FK).

## Reglas de negocio ya decididas

- Catálogo del día: `fecha = hoy` y `horaLimite > ahora` en hora del campus (`ahoraCampus()`), `estado = 'disponible'`, vendedor activo. Sin cron.
- Un pedido es de **un solo vendedor**. Estados: `pendiente → aceptado → entregado`, o `rechazado` / `cancelado`.
- Si el vendedor no acepta antes de la hora límite del producto, el pedido se cancela solo (resolver al consultar, sin cron).
- Al llegar la cantidad a 0, el producto pasa a `agotado`.
- Calificación: solo el comprador de un pedido `entregado`, una por pedido (índice único), 1–5 estrellas.
- Insignia de comunidad: depende de verificar el correo institucional (`codigos_verificacion` tipo `institucional`).
- Fotos en R2 (`c.env.FOTOS`) con key `productos/<id>/<uuid>`; el seed usa keys `ejemplo/<archivo>.svg` que el frontend sirve desde `public/productos`.
- Auth: JWT HS256 con `{ sub, rol, exp }`, 7 días. Logout sin estado.
