import { honoMiddleware, withSentry } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import type { AppEnv } from './env'
import { onError, onNotFound } from './lib/errors'
import { opcionesSentry } from './lib/monitoreo'
import { adminRoutes } from './modules/admin/routes'
import { authRoutes } from './modules/auth/routes'
import { fotosRoutes } from './modules/fotos/routes'
import { calificacionesRoutes } from './modules/calificaciones/routes'
import { notificacionesRoutes } from './modules/notificaciones/routes'
import { pedidosRoutes } from './modules/pedidos/routes'
import { productosRoutes } from './modules/productos/routes'
import { puntosEntregaRoutes } from './modules/puntos-entrega/routes'
import { reportesRoutes } from './modules/reportes/routes'
import { usuariosRoutes } from './modules/usuarios/routes'

// En local el frontend usa el proxy de Vite (mismo origen), así que no hace falta CORS.
const base = new Hono<AppEnv>().basePath('/api')
// Va primero: nombra cada traza con su ruta (`GET /api/pedidos/:id`), mide los middlewares
// y manda a Sentry los errores 5xx (los 4xx son esperados y solo quedan en la traza).
base.use(honoMiddleware(base))

const app = base
  .use(logger())
  .get('/health', (c) =>
    c.json({ ok: true, servicio: 'shopsito-api', hora: new Date().toISOString() }),
  )
  .route('/auth', authRoutes)
  .route('/usuarios', usuariosRoutes)
  .route('/productos', productosRoutes)
  .route('/fotos', fotosRoutes)
  .route('/pedidos', pedidosRoutes)
  .route('/calificaciones', calificacionesRoutes)
  .route('/notificaciones', notificacionesRoutes)
  .route('/reportes', reportesRoutes)
  .route('/puntos-entrega', puntosEntregaRoutes)
  .route('/admin', adminRoutes)

app.onError(onError)
app.notFound(onNotFound)

export type AppType = typeof app
// Las pruebas usan `app` directo; el Worker exporta la versión con Sentry.
export { app }
export default withSentry(opcionesSentry, app)
