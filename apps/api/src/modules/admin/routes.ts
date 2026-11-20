import { Hono } from 'hono'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import {
  adminProductosQuerySchema,
  ahoraCampus,
  cambiarEstadoProductoSchema,
  idParamSchema,
  type AdminProducto,
  type Producto,
} from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { detallePedido, pedidos, productos, reportes } from '../../db/schema'
import { getDb } from '../../lib/db'
import { notFound } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAdmin, requireAuth } from '../../middleware/auth'
import { ESTADOS_VENTA, estadoSegunCantidad } from '../productos/logica'
import { conVendedor, quitarProducto } from '../productos/routes'

async function buscarProducto(c: Parameters<typeof getDb>[0], id: string) {
  const [producto] = await getDb(c).select().from(productos).where(eq(productos.id, id))
  if (!producto) throw notFound('Producto')
  return producto
}

// Moderación de publicaciones: el admin ve todo lo de un día, sin importar estado ni hora.
export const adminRoutes = new Hono<AppEnv>()
  .use(requireAuth, requireAdmin)
  .get('/productos', validar('query', adminProductosQuerySchema), async (c) => {
    const fecha = c.req.valid('query').fecha ?? ahoraCampus().fecha
    const filas = await conVendedor(c)
      .where(eq(productos.fecha, fecha))
      .orderBy(asc(productos.horaLimite))
    const ids = filas.map((f) => f.producto.id)
    if (ids.length === 0) return c.json<AdminProducto[]>([])

    const db = getDb(c)
    const [vendidos, abiertos] = await Promise.all([
      db
        .select({
          productoId: detallePedido.productoId,
          n: sql<number>`sum(${detallePedido.cantidad})`,
        })
        .from(detallePedido)
        .innerJoin(pedidos, eq(pedidos.id, detallePedido.pedidoId))
        .where(and(inArray(detallePedido.productoId, ids), inArray(pedidos.estado, ESTADOS_VENTA)))
        .groupBy(detallePedido.productoId),
      db
        .select({ objetivoId: reportes.objetivoId, n: sql<number>`count(*)` })
        .from(reportes)
        .where(and(inArray(reportes.objetivoId, ids), eq(reportes.estado, 'abierto')))
        .groupBy(reportes.objetivoId),
    ])
    const vendidosPor = new Map(vendidos.map((v) => [v.productoId, Number(v.n)]))
    const abiertosPor = new Map(abiertos.map((r) => [r.objetivoId, Number(r.n)]))

    return c.json<AdminProducto[]>(
      filas.map(({ producto, vendedor }) => ({
        ...producto,
        vendedor,
        vendidos: vendidosPor.get(producto.id) ?? 0,
        reportesAbiertos: abiertosPor.get(producto.id) ?? 0,
      })),
    )
  })
  .patch(
    '/productos/:id',
    validar('param', idParamSchema),
    validar('json', cambiarEstadoProductoSchema),
    async (c) => {
      const { id } = c.req.valid('param')
      const { estado } = c.req.valid('json')
      const producto = await buscarProducto(c, id)
      const [actualizado] = await getDb(c)
        .update(productos)
        // Al volver a mostrarlo, queda disponible o agotado según lo que le quede.
        .set({ estado: estado === 'oculto' ? 'oculto' : estadoSegunCantidad(producto.cantidad) })
        .where(eq(productos.id, id))
        .returning()
      return c.json<Producto>(actualizado!)
    },
  )
  .delete('/productos/:id', validar('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    await quitarProducto(c, await buscarProducto(c, id), 'oculto')
    return c.body(null, 204)
  })
