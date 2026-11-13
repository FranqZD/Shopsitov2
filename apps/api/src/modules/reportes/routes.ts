import { Hono } from 'hono'
import { actualizarReporteSchema, crearReporteSchema, idParamSchema } from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAdmin, requireAuth } from '../../middleware/auth'

export const reportesRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validar('json', crearReporteSchema), notImplemented)
  .get('/', requireAdmin, notImplemented)
  .patch(
    '/:id',
    requireAdmin,
    validar('param', idParamSchema),
    validar('json', actualizarReporteSchema),
    notImplemented,
  )
