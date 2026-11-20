import { Hono } from 'hono'
import { actualizarPerfilSchema, idParamSchema } from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

export const usuariosRoutes = new Hono<AppEnv>()
  .get('/me', requireAuth, notImplemented)
  .patch('/me', requireAuth, validar('json', actualizarPerfilSchema), notImplemented)
  // TODO: baja lógica (activo = false), no borrar filas con pedidos asociados.
  .delete('/me', requireAuth, notImplemented)
  .get('/:id', validar('param', idParamSchema), notImplemented)
