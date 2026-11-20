import { Hono } from 'hono'
import { and, asc, eq, gt, inArray, sql } from 'drizzle-orm'
import {
  actualizarProductoSchema,
  ahoraCampus,
  crearProductoSchema,
  idParamSchema,
  type MiPublicacion,
  type Producto,
  type ProductoHoy,
} from '@shopsito/shared'
import type { Context } from 'hono'
import type { AppEnv } from '../../env'
import { detallePedido, pedidos, productos, usuarios } from '../../db/schema'
import { getDb, nuevoId } from '../../lib/db'
import { AppError, notFound, notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'
import {
  ESTADOS_VENTA,
  esFotoR2,
  estadoSegunCantidad,
  horaLimiteValida,
  problemaFoto,
} from './logica'

/** Busca un producto de hoy del usuario en sesión; si es de otro, 403. */
async function productoPropio(c: Context<AppEnv>, id: string) {
  const [producto] = await getDb(c).select().from(productos).where(eq(productos.id, id))
  if (!producto || producto.fecha !== ahoraCampus().fecha) throw notFound('Producto')
  if (producto.vendedorId !== c.get('jwtPayload').sub) {
    throw new AppError(403, 'FORBIDDEN', 'Solo puedes cambiar lo que tú publicaste')
  }
  return producto
}

function exigirHoraFutura(horaLimite: string) {
  const { hora } = ahoraCampus()
  if (!horaLimiteValida(horaLimite, hora)) {
    throw new AppError(
      400,
      'HORA_LIMITE_PASADA',
      `Ya son las ${hora}: elige una hora límite más tarde.`,
    )
  }
}

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
  // Lo que publicó hoy el vendedor (incluye agotadas y vencidas) con lo que lleva vendido.
  // Va antes de '/:id' para que "mios" no se tome como id.
  .get('/mios', requireAuth, async (c) => {
    const { sub: vendedorId } = c.get('jwtPayload')
    const { fecha } = ahoraCampus()
    // El LEFT JOIN a pedidos filtra por estado en el ON: un detalle de un pedido cancelado
    // o rechazado queda con pedidos.id nulo y no suma.
    const vigente = sql`${pedidos.id} is not null`
    const filas = await getDb(c)
      .select({
        producto: productos,
        vendidos: sql<number>`coalesce(sum(case when ${vigente} then ${detallePedido.cantidad} end), 0)`,
        ingresos: sql<number>`coalesce(sum(case when ${vigente} then ${detallePedido.cantidad} * ${detallePedido.precioUnitario} end), 0)`,
      })
      .from(productos)
      .leftJoin(detallePedido, eq(detallePedido.productoId, productos.id))
      .leftJoin(
        pedidos,
        and(eq(pedidos.id, detallePedido.pedidoId), inArray(pedidos.estado, ESTADOS_VENTA)),
      )
      .where(and(eq(productos.vendedorId, vendedorId), eq(productos.fecha, fecha)))
      .groupBy(productos.id)
      .orderBy(asc(productos.horaLimite))
    return c.json<MiPublicacion[]>(
      filas.map(({ producto, vendidos, ingresos }) => ({
        ...producto,
        vendidos: Number(vendidos),
        ingresos: Number(ingresos),
        total: producto.cantidad + Number(vendidos),
      })),
    )
  })
  .get('/:id', validar('param', idParamSchema), notImplemented)
  .post('/', requireAuth, validar('json', crearProductoSchema), async (c) => {
    const datos = c.req.valid('json')
    const { sub: vendedorId } = c.get('jwtPayload')
    const { fecha } = ahoraCampus()
    exigirHoraFutura(datos.horaLimite)
    // TODO: guardar la categoría cuando el modelo la tenga.
    const [creado] = await getDb(c)
      .insert(productos)
      .values({ id: nuevoId(), vendedorId, fecha, ...datos })
      .returning()
    return c.json<Producto>(creado!, 201)
  })
  .patch(
    '/:id',
    requireAuth,
    validar('param', idParamSchema),
    validar('json', actualizarProductoSchema),
    async (c) => {
      const { id } = c.req.valid('param')
      const datos = c.req.valid('json')
      await productoPropio(c, id)
      if (datos.horaLimite !== undefined) exigirHoraFutura(datos.horaLimite)
      const [actualizado] = await getDb(c)
        .update(productos)
        .set({
          ...datos,
          // "Agregar más" a un agotado lo vuelve a poner en el catálogo.
          ...(datos.cantidad !== undefined && { estado: estadoSegunCantidad(datos.cantidad) }),
        })
        .where(eq(productos.id, id))
        .returning()
      return c.json<Producto>(actualizado!)
    },
  )
  .delete('/:id', requireAuth, validar('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const producto = await productoPropio(c, id)
    const db = getDb(c)
    const [conPedidos] = await db
      .select({ id: detallePedido.id })
      .from(detallePedido)
      .where(eq(detallePedido.productoId, id))
      .limit(1)
    if (conPedidos) {
      // Borrarlo rompería sus pedidos (y lo vendido hoy): solo se saca del catálogo.
      await db.update(productos).set({ cantidad: 0, estado: 'agotado' }).where(eq(productos.id, id))
    } else {
      await db.delete(productos).where(eq(productos.id, id))
      if (esFotoR2(producto.fotoKey)) await c.env.FOTOS.delete(producto.fotoKey)
    }
    return c.body(null, 204)
  })
  // multipart/form-data con el campo `foto`. Reemplaza la foto anterior.
  .post('/:id/foto', requireAuth, validar('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const producto = await productoPropio(c, id)
    const cuerpo = await c.req.parseBody().catch(() => ({}) as Record<string, unknown>)
    const foto = cuerpo['foto']
    if (!(foto instanceof File)) {
      throw new AppError(400, 'FOTO_REQUERIDA', 'No llegó ninguna foto.')
    }
    const problema = problemaFoto(foto.type, foto.size)
    if (problema) throw new AppError(400, 'FOTO_INVALIDA', problema)

    // Key nueva en cada subida: así la URL se puede cachear para siempre.
    const fotoKey = `productos/${id}/${nuevoId()}`
    await c.env.FOTOS.put(fotoKey, await foto.arrayBuffer(), {
      httpMetadata: { contentType: foto.type },
    })
    const [actualizado] = await getDb(c)
      .update(productos)
      .set({ fotoKey })
      .where(eq(productos.id, id))
      .returning()
    if (esFotoR2(producto.fotoKey)) await c.env.FOTOS.delete(producto.fotoKey)
    return c.json<Producto>(actualizado!)
  })
