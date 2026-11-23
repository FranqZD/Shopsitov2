import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { idParamSchema, type Notificacion } from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { notificaciones } from '../../db/schema'
import { getDb } from '../../lib/db'
import { AppError } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

// TODO(tiempo real): por ahora el cliente consulta GET /notificaciones periódicamente.
// Más adelante se puede evaluar Durable Objects + WebSockets. No implementar todavía.
export const notificacionesRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  // Las del usuario en sesión, de la más reciente a la más antigua.
  .get('/', async (c) => {
    const { sub } = c.get('jwtPayload')
    const lista = await getDb(c)
      .select()
      .from(notificaciones)
      .where(eq(notificaciones.usuarioId, sub))
      .orderBy(desc(notificaciones.fecha))
      .limit(100)
    return c.json<Notificacion[]>(lista)
  })

  // Marcar todo como leído
  .patch('/leidas', async (c) => {
    const { sub } = c.get('jwtPayload')
    await getDb(c)
      .update(notificaciones)
      .set({ leida: true })
      .where(and(eq(notificaciones.usuarioId, sub), eq(notificaciones.leida, false)))
    return c.body(null, 204)
  })

  .patch('/:id/leida', validar('param', idParamSchema), async (c) => {
    const { sub } = c.get('jwtPayload')
    const { id } = c.req.valid('param')
    //WHERE incluye al dueño: nadie puede marcar las notificaciones de otra persona.
    const [hecha] = await getDb(c)
      .update(notificaciones)
      .set({ leida: true })
      .where(and(eq(notificaciones.id, id), eq(notificaciones.usuarioId, sub)))
      .returning()
    if (!hecha) throw new AppError(404, 'NOT_FOUND', 'Notificación no encontrada')
    return c.json<Notificacion>(hecha)
  })
