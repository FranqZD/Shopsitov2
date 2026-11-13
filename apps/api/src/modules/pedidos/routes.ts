import { Hono } from 'hono'
import { crearPedidoSchema, idParamSchema } from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

// TODO: al crear un pedido, descontar inventario (marcar `agotado` si llega a 0) y crear
// una notificación para el vendedor dentro del mismo db.batch().
export const pedidosRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validar('json', crearPedidoSchema), notImplemented)
  .get('/compras', notImplemented)
  .get('/ventas', notImplemented)
  .post('/:id/aceptar', validar('param', idParamSchema), notImplemented)
  .post('/:id/rechazar', validar('param', idParamSchema), notImplemented)
  .post('/:id/entregar', validar('param', idParamSchema), notImplemented)
  .post('/:id/cancelar', validar('param', idParamSchema), notImplemented)
