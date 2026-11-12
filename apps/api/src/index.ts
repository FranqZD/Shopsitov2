import { Hono } from 'hono'
import { logger } from 'hono/logger'
import type { AppEnv } from './env'
import { onError, onNotFound } from './lib/errors'
import { authRoutes } from './modules/auth/routes'
import { calificacionesRoutes } from './modules/calificaciones/routes'
import { notificacionesRoutes } from './modules/notificaciones/routes'
import { pedidosRoutes } from './modules/pedidos/routes'
import { productosRoutes } from './modules/productos/routes'
import { puntosEntregaRoutes } from './modules/puntos-entrega/routes'
import { reportesRoutes } from './modules/reportes/routes'
import { usuariosRoutes } from './modules/usuarios/routes'

// En local el frontend usa el proxy de Vite (mismo origen), así que no hace falta CORS.
const app = new Hono<AppEnv>()
  .basePath('/api')
  .use(logger())
  .get('/health', (c) =>
    c.json({ ok: true, servicio: 'shopsito-api', hora: new Date().toISOString() }),
  )
  .route('/auth', authRoutes)
  .route('/usuarios', usuariosRoutes)
  .route('/productos', productosRoutes)
  .route('/pedidos', pedidosRoutes)
  .route('/calificaciones', calificacionesRoutes)
  .route('/notificaciones', notificacionesRoutes)
  .route('/reportes', reportesRoutes)
  .route('/puntos-entrega', puntosEntregaRoutes)

app.onError(onError)
app.notFound(onNotFound)

export type AppType = typeof app
export default app
