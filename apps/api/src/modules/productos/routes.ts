import { Hono } from 'hono'
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
import { notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

export const productosRoutes = new Hono<AppEnv>()
  // Catálogo del día: sin cron, se filtra por fecha y hora límite en hora del campus.
  .get('/hoy', async (c) => {
    const { fecha, hora } = ahoraCampus()
    const filas = await getDb(c)
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
  .get('/:id', validar('param', idParamSchema), notImplemented)
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
