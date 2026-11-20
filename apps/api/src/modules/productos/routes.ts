import { Hono, type Context } from 'hono'
import { and, eq, gt, asc } from 'drizzle-orm'
import {
  actualizarProductoSchema,
  ahoraCampus,
  crearProductoSchema,
  idParamSchema,
  type ProductoHoy,
} from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { productos, usuarios } from '../../db/schema'
import { getDb } from '../../lib/db'
import { notFound, notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

/** Producto con los datos públicos de su vendedor (la forma de `ProductoHoy`). */
const conVendedor = (c: Context<AppEnv>) =>
  getDb(c)
    .select({
      producto: productos,
      vendedor: {
        id: usuarios.id,
        nombre: usuarios.nombre,
        insigniaComunidad: usuarios.insigniaComunidad,
      },
    })
    .from(productos)
    .innerJoin(usuarios, eq(productos.vendedorId, usuarios.id))

export const productosRoutes = new Hono<AppEnv>()
  // Catálogo del día: sin cron, se filtra por fecha y hora límite en hora del campus.
  .get('/hoy', requireAuth, async (c) => {
    const { fecha, hora } = ahoraCampus()
    const filas = await conVendedor(c)
      .where(
        and(
          eq(productos.fecha, fecha),
          gt(productos.horaLimite, hora),
          eq(productos.estado, 'disponible'),
          eq(usuarios.activo, true),
        ),
      )
      .orderBy(asc(productos.horaLimite))
    return c.json<ProductoHoy[]>(filas.map((f) => ({ ...f.producto, vendedor: f.vendedor })))
  })
  // Sin filtrar por fecha ni estado: la pantalla de detalle decide si se puede pedir.
  .get('/:id', requireAuth, validar('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const [fila] = await conVendedor(c).where(eq(productos.id, id))
    if (!fila) throw notFound('Producto')
    return c.json<ProductoHoy>({ ...fila.producto, vendedor: fila.vendedor })
  })
  .post('/', requireAuth, validar('json', crearProductoSchema), notImplemented)
  .patch(
    '/:id',
    requireAuth,
    validar('param', idParamSchema),
    validar('json', actualizarProductoSchema),
    notImplemented,
  )
  .delete('/:id', requireAuth, validar('param', idParamSchema), notImplemented)
  // TODO: recibir multipart/form-data y guardar en c.env.FOTOS (R2) con key `productos/<id>/<uuid>`.
  .post('/:id/foto', requireAuth, validar('param', idParamSchema), notImplemented)
