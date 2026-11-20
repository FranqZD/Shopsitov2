import { Hono } from 'hono'
import { idParamSchema } from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

// TODO(tiempo real): por ahora el cliente consulta GET /notificaciones periódicamente.
// Más adelante se puede evaluar Durable Objects + WebSockets. No implementar todavía.
export const notificacionesRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', notImplemented)
  .patch('/:id/leida', validar('param', idParamSchema), notImplemented)
