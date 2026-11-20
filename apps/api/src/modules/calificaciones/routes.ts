import { Hono } from 'hono'
import { desc, eq, sql } from 'drizzle-orm'
import { crearCalificacionSchema, idParamSchema, type Resena } from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { calificaciones, pedidos, usuarios } from '../../db/schema'
import { getDb } from '../../lib/db'
import { notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

export const calificacionesRoutes = new Hono<AppEnv>()
  // TODO: solo el comprador de un pedido `entregado` puede calificar, una vez por pedido.
  .post('/', requireAuth, validar('json', crearCalificacionSchema), notImplemented)
  // Reseñas que recibió un vendedor, de la más reciente a la más antigua.
  .get('/vendedor/:id', requireAuth, validar('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const filas = await getDb(c)
      .select({
        id: calificaciones.id,
        estrellas: calificaciones.estrellas,
        comentario: calificaciones.comentario,
        fecha: calificaciones.fecha,
        comprador: { id: usuarios.id, nombre: usuarios.nombre },
        // Un pedido puede tener varios productos; para la reseña basta el primero.
        producto: sql<string | null>`(
          select p.nombre from detalle_pedido d
          join productos p on p.id = d.producto_id
          where d.pedido_id = ${pedidos.id}
          limit 1
        )`,
      })
      .from(calificaciones)
      .innerJoin(pedidos, eq(calificaciones.pedidoId, pedidos.id))
      .innerJoin(usuarios, eq(pedidos.compradorId, usuarios.id))
      .where(eq(pedidos.vendedorId, id))
      .orderBy(desc(calificaciones.fecha))
    return c.json<Resena[]>(filas)
  })
