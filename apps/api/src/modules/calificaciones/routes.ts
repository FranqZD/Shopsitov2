import { Hono } from 'hono'
import { crearCalificacionSchema, idParamSchema } from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

export const calificacionesRoutes = new Hono<AppEnv>()
  // TODO: solo el comprador de un pedido `entregado` puede calificar, una vez por pedido.
  .post('/', requireAuth, validar('json', crearCalificacionSchema), notImplemented)
  .get('/vendedor/:id', validar('param', idParamSchema), notImplemented)
