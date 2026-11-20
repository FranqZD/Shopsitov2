// Módulo de referencia: CRUD completo. Copia esta estructura para implementar los demás.
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  actualizarPuntoEntregaSchema,
  crearPuntoEntregaSchema,
  idParamSchema,
  type PuntoEntrega,
} from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { puntosEntrega } from '../../db/schema'
import { getDb, nuevoId } from '../../lib/db'
import { AppError, notFound } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAdmin, requireAuth } from '../../middleware/auth'

const listarQuerySchema = z.object({
  activo: z.enum(['true', 'false']).optional(),
})

export const puntosEntregaRoutes = new Hono<AppEnv>()
  // Público: los compradores necesitan la lista para elegir dónde recibir.
  .get('/', validar('query', listarQuerySchema), async (c) => {
    const { activo } = c.req.valid('query')
    const db = getDb(c)
    const filas = await db
      .select()
      .from(puntosEntrega)
      .where(activo === undefined ? undefined : eq(puntosEntrega.activo, activo === 'true'))
      .orderBy(puntosEntrega.nombre)
    return c.json<PuntoEntrega[]>(filas)
  })

  .get('/:id', validar('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const punto = await getDb(c).query.puntosEntrega.findFirst({ where: eq(puntosEntrega.id, id) })
    if (!punto) throw notFound('Punto de entrega')
    return c.json<PuntoEntrega>(punto)
  })

  .post('/', requireAuth, requireAdmin, validar('json', crearPuntoEntregaSchema), async (c) => {
    const datos = c.req.valid('json')
    const [creado] = await getDb(c)
      .insert(puntosEntrega)
      .values({ id: nuevoId(), ...datos })
      .returning()
    return c.json<PuntoEntrega>(creado!, 201)
  })

  .patch(
    '/:id',
    requireAuth,
    requireAdmin,
    validar('param', idParamSchema),
    validar('json', actualizarPuntoEntregaSchema),
    async (c) => {
      const { id } = c.req.valid('param')
      const cambios = c.req.valid('json')
      if (Object.keys(cambios).length === 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'No hay cambios que aplicar')
      }
      const [actualizado] = await getDb(c)
        .update(puntosEntrega)
        .set(cambios)
        .where(eq(puntosEntrega.id, id))
        .returning()
      if (!actualizado) throw notFound('Punto de entrega')
      return c.json<PuntoEntrega>(actualizado)
    },
  )

  .delete('/:id', requireAuth, requireAdmin, validar('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    try {
      const [borrado] = await getDb(c)
        .delete(puntosEntrega)
        .where(eq(puntosEntrega.id, id))
        .returning()
      if (!borrado) throw notFound('Punto de entrega')
    } catch (err) {
      if (err instanceof Error && /FOREIGN KEY/i.test(String(err.cause ?? err.message))) {
        throw new AppError(
          409,
          'CONFLICT',
          'El punto tiene pedidos asociados; desactívalo en lugar de borrarlo',
        )
      }
      throw err
    }
    return c.body(null, 204)
  })
