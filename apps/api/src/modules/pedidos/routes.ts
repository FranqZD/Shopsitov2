import { Hono } from 'hono'
import type { Context } from 'hono'
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import {
  ahoraCampus,
  crearPedidoSchema,
  idParamSchema,
  type EstadoPedido,
  type Pedido,
  type PedidoCompra,
  type PedidoVenta,
} from '@shopsito/shared'
import type { AppEnv } from '../../env'
import {
  detallePedido,
  notificaciones,
  pedidos,
  productos,
  puntosEntrega,
  usuarios,
} from '../../db/schema'
import { ahoraIso, getDb, nuevoId, type Db } from '../../lib/db'
import { AppError, notFound } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'
import {
  TRANSICIONES_VENDEDOR,
  agruparItems,
  avisoComprador,
  avisoVendedorCancelado,
  avisoVendedorNuevo,
  pendienteVencido,
  problemaCancelar,
  problemaPedido,
  problemaTransicion,
  resumenItems,
  type AccionVendedor,
  type ItemPedido,
} from './logica'

type PedidoCargado = Omit<PedidoVenta, 'puntoEntrega'> & {
  vendedorId: string
  fecha: string
  vendedor: { id: string; nombre: string; insigniaComunidad: boolean }
  puntoEntrega: { id: string; nombre: string; ubicacion: string }
}

const vendedores = alias(usuarios, 'vendedores')

/** Pedidos con sus productos, comprador, vendedor y punto de entrega (una fila por producto). */
async function cargarPedidos(c: Context<AppEnv>, filtro: SQL | undefined) {
  const filas = await getDb(c)
    .select({
      pedido: pedidos,
      item: {
        productoId: detallePedido.productoId,
        cantidad: detallePedido.cantidad,
        precioUnitario: detallePedido.precioUnitario,
      },
      producto: {
        nombre: productos.nombre,
        fotoKey: productos.fotoKey,
        fecha: productos.fecha,
        horaLimite: productos.horaLimite,
      },
      comprador: {
        id: usuarios.id,
        nombre: usuarios.nombre,
        insigniaComunidad: usuarios.insigniaComunidad,
      },
      vendedor: {
        id: vendedores.id,
        nombre: vendedores.nombre,
        insigniaComunidad: vendedores.insigniaComunidad,
      },
      puntoEntrega: {
        id: puntosEntrega.id,
        nombre: puntosEntrega.nombre,
        ubicacion: puntosEntrega.ubicacion,
      },
    })
    .from(pedidos)
    .innerJoin(detallePedido, eq(detallePedido.pedidoId, pedidos.id))
    .innerJoin(productos, eq(productos.id, detallePedido.productoId))
    .innerJoin(usuarios, eq(usuarios.id, pedidos.compradorId))
    .innerJoin(vendedores, eq(vendedores.id, pedidos.vendedorId))
    .innerJoin(puntosEntrega, eq(puntosEntrega.id, pedidos.puntoEntregaId))
    .where(filtro)
    .orderBy(desc(pedidos.creadoEn))

  // El Map conserva el orden de la consulta (los más recientes primero).
  const porId = new Map<string, PedidoCargado>()
  for (const f of filas) {
    let p = porId.get(f.pedido.id)
    if (!p) {
      p = {
        id: f.pedido.id,
        estado: f.pedido.estado,
        total: f.pedido.total,
        creadoEn: f.pedido.creadoEn,
        vendedorId: f.pedido.vendedorId,
        fecha: f.producto.fecha,
        horaLimite: f.producto.horaLimite,
        comprador: f.comprador,
        vendedor: f.vendedor,
        puntoEntrega: f.puntoEntrega,
        items: [],
      }
      porId.set(p.id, p)
    }
    p.items.push({ ...f.item, nombre: f.producto.nombre, fotoKey: f.producto.fotoKey })
    if (f.producto.horaLimite < p.horaLimite) p.horaLimite = f.producto.horaLimite
  }
  return [...porId.values()]
}

const aVenta = ({
  vendedorId: _v,
  fecha: _f,
  vendedor: _vend,
  puntoEntrega: { id, nombre },
  ...venta
}: PedidoCargado): PedidoVenta => ({ ...venta, puntoEntrega: { id, nombre } })

const aCompra = ({
  vendedorId: _v,
  fecha: _f,
  comprador: _c,
  ...compra
}: PedidoCargado): PedidoCompra => compra

type Aviso = { usuarioId: string; mensaje: string }

/** Aviso al comprador cuando el vendedor responde (o el pedido vence). */
const avisoAlComprador = (p: PedidoCargado, hacia: EstadoPedido): Aviso => ({
  usuarioId: p.comprador.id,
  mensaje: avisoComprador(hacia, {
    vendedor: p.vendedor.nombre,
    resumen: resumenItems(p.items),
    punto: p.puntoEntrega.nombre,
  }),
})

/**
 * Cambia el estado solo si nadie lo cambió antes (el WHERE incluye el estado leído) y deja el
 * aviso. Al rechazar o cancelar, lo apartado regresa al inventario (y un agotado vuelve a estar
 * disponible); un producto que un admin ocultó no se toca.
 * Devuelve null si el pedido ya había cambiado.
 */
async function cambiarEstado(
  c: Context<AppEnv>,
  p: PedidoCargado,
  hacia: EstadoPedido,
  aviso: Aviso,
) {
  const db = getDb(c)
  const [hecho] = await db
    .update(pedidos)
    .set({ estado: hacia })
    .where(and(eq(pedidos.id, p.id), eq(pedidos.estado, p.estado)))
    .returning()
  if (!hecho) return null

  const devolver = hacia === 'rechazado' || hacia === 'cancelado'
  await db.batch([
    db.insert(notificaciones).values({
      id: nuevoId(),
      usuarioId: aviso.usuarioId,
      mensaje: aviso.mensaje,
      fecha: ahoraIso(),
    }),
    ...(devolver
      ? p.items.map((i) =>
          db
            .update(productos)
            .set({ cantidad: sql`${productos.cantidad} + ${i.cantidad}`, estado: 'disponible' })
            .where(
              and(
                eq(productos.id, i.productoId),
                inArray(productos.estado, ['disponible', 'agotado']),
              ),
            ),
        )
      : []),
  ])
  p.estado = hacia
  return hecho
}

/** Los pendientes que ya pasaron su hora límite se cancelan al consultarlos (sin cron). */
async function cancelarVencidos(c: Context<AppEnv>, lista: PedidoCargado[]) {
  const ahora = ahoraCampus()
  for (const p of lista) {
    if (p.estado === 'pendiente' && pendienteVencido(p, ahora)) {
      await cambiarEstado(c, p, 'cancelado', avisoAlComprador(p, 'cancelado'))
    }
  }
}

async function accionVendedor(
  c: Context<AppEnv>,
  id: string,
  accion: AccionVendedor,
): Promise<Pedido> {
  const { sub } = c.get('jwtPayload')
  const [p] = await cargarPedidos(c, eq(pedidos.id, id))
  if (!p) throw notFound('Pedido')
  if (p.vendedorId !== sub) {
    throw new AppError(403, 'FORBIDDEN', 'Solo quien vende puede responder este pedido')
  }

  if (p.estado === 'pendiente' && pendienteVencido(p, ahoraCampus())) {
    await cambiarEstado(c, p, 'cancelado', avisoAlComprador(p, 'cancelado'))
    throw new AppError(
      409,
      'PEDIDO_VENCIDO',
      `Ya pasó la hora límite (${p.horaLimite}) y el pedido se canceló solo.`,
    )
  }
  const problema = problemaTransicion(p.estado, accion)
  if (problema) throw new AppError(409, 'ESTADO_INVALIDO', problema)

  const hacia = TRANSICIONES_VENDEDOR[accion].hacia
  const hecho = await cambiarEstado(c, p, hacia, avisoAlComprador(p, hacia))
  if (!hecho) {
    throw new AppError(
      409,
      'ESTADO_INVALIDO',
      'El pedido cambió mientras tanto. Recarga la página.',
    )
  }
  return hecho
}

/** Regresa al inventario lo que se alcanzó a apartar cuando el pedido no se pudo completar. */
const devolverApartado = (db: Db, items: ItemPedido[]) =>
  Promise.all(
    items.map((i) =>
      db
        .update(productos)
        .set({ cantidad: sql`${productos.cantidad} + ${i.cantidad}` })
        .where(eq(productos.id, i.productoId)),
    ),
  )

export const pedidosRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  // D1 no tiene transacciones interactivas, así que se aparta el inventario con un UPDATE
  // condicionado por producto (si dos piden lo último, solo uno lo consigue) y luego se crea
  // todo junto en un batch. Si algo falla en el camino, lo apartado se devuelve.
  .post('/', validar('json', crearPedidoSchema), async (c) => {
    const datos = c.req.valid('json')
    const { sub: compradorId } = c.get('jwtPayload')
    const db = getDb(c)
    const items = agruparItems(datos.items)

    const filas = await db
      .select({ producto: productos, vendedorActivo: usuarios.activo })
      .from(productos)
      .innerJoin(usuarios, eq(usuarios.id, productos.vendedorId))
      .where(
        inArray(
          productos.id,
          items.map((i) => i.productoId),
        ),
      )
    if (filas.length !== items.length) throw notFound('Producto')

    const [punto] = await db
      .select()
      .from(puntosEntrega)
      .where(and(eq(puntosEntrega.id, datos.puntoEntregaId), eq(puntosEntrega.activo, true)))
    if (!punto) {
      throw new AppError(400, 'PUNTO_INVALIDO', 'Ese punto de entrega ya no está disponible.')
    }

    const problema = problemaPedido(
      compradorId,
      filas.map(({ producto, vendedorActivo }) => ({ ...producto, vendedorActivo })),
      items,
      ahoraCampus(),
    )
    if (problema) throw new AppError(problema.status, problema.code, problema.mensaje)

    const porId = new Map(filas.map((f) => [f.producto.id, f.producto]))
    const vendedorId = filas[0]!.producto.vendedorId

    const apartados: ItemPedido[] = []
    for (const item of items) {
      const [apartado] = await db
        .update(productos)
        .set({ cantidad: sql`${productos.cantidad} - ${item.cantidad}` })
        .where(
          and(
            eq(productos.id, item.productoId),
            eq(productos.estado, 'disponible'),
            sql`${productos.cantidad} >= ${item.cantidad}`,
          ),
        )
        .returning({ id: productos.id })
      if (!apartado) {
        await devolverApartado(db, apartados)
        throw new AppError(
          409,
          'SIN_EXISTENCIAS',
          'Alguien se te adelantó y ya no alcanza. Revisa lo que queda.',
        )
      }
      apartados.push(item)
    }

    const [comprador] = await db
      .select({ nombre: usuarios.nombre })
      .from(usuarios)
      .where(eq(usuarios.id, compradorId))
    const pedido: Pedido = {
      id: nuevoId(),
      compradorId,
      vendedorId,
      puntoEntregaId: punto.id,
      estado: 'pendiente',
      total: items.reduce((suma, i) => suma + porId.get(i.productoId)!.precio * i.cantidad, 0),
      creadoEn: ahoraIso(),
    }
    try {
      await db.batch([
        db.insert(pedidos).values(pedido),
        db.insert(detallePedido).values(
          items.map((i) => ({
            id: nuevoId(),
            pedidoId: pedido.id,
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnitario: porId.get(i.productoId)!.precio,
          })),
        ),
        db.insert(notificaciones).values({
          id: nuevoId(),
          usuarioId: vendedorId,
          mensaje: avisoVendedorNuevo({
            comprador: comprador?.nombre ?? 'Alguien',
            resumen: resumenItems(
              items.map((i) => ({ cantidad: i.cantidad, nombre: porId.get(i.productoId)!.nombre })),
            ),
          }),
          fecha: ahoraIso(),
        }),
        // Al llegar la cantidad a 0, el producto pasa a agotado.
        db
          .update(productos)
          .set({ estado: 'agotado' })
          .where(
            and(
              inArray(
                productos.id,
                items.map((i) => i.productoId),
              ),
              eq(productos.cantidad, 0),
              eq(productos.estado, 'disponible'),
            ),
          ),
      ])
    } catch (e) {
      await devolverApartado(db, apartados)
      throw e
    }
    return c.json<Pedido>(pedido, 201)
  })
  // Lo que pidió el comprador en sesión, de lo más reciente a lo más antiguo.
  .get('/compras', async (c) => {
    const { sub } = c.get('jwtPayload')
    const lista = await cargarPedidos(c, eq(pedidos.compradorId, sub))
    await cancelarVencidos(c, lista)
    return c.json<PedidoCompra[]>(lista.map(aCompra))
  })
  // Lo que le pidieron hoy al vendedor en sesión, en cualquier estado.
  .get('/ventas', async (c) => {
    const { sub } = c.get('jwtPayload')
    const lista = await cargarPedidos(
      c,
      and(eq(pedidos.vendedorId, sub), eq(productos.fecha, ahoraCampus().fecha)),
    )
    await cancelarVencidos(c, lista)
    return c.json<PedidoVenta[]>(lista.map(aVenta))
  })
  .post('/:id/aceptar', validar('param', idParamSchema), async (c) =>
    c.json<Pedido>(await accionVendedor(c, c.req.valid('param').id, 'aceptar')),
  )
  .post('/:id/rechazar', validar('param', idParamSchema), async (c) =>
    c.json<Pedido>(await accionVendedor(c, c.req.valid('param').id, 'rechazar')),
  )
  .post('/:id/entregar', validar('param', idParamSchema), async (c) =>
    c.json<Pedido>(await accionVendedor(c, c.req.valid('param').id, 'entregar')),
  )
  // Solo quien hizo el pedido, y solo mientras nadie lo haya aceptado.
  .post('/:id/cancelar', validar('param', idParamSchema), async (c) => {
    const { sub } = c.get('jwtPayload')
    const [p] = await cargarPedidos(c, eq(pedidos.id, c.req.valid('param').id))
    if (!p) throw notFound('Pedido')
    if (p.comprador.id !== sub) {
      throw new AppError(403, 'FORBIDDEN', 'Solo quien hizo el pedido puede cancelarlo')
    }
    const problema = problemaCancelar(p.estado)
    if (problema) throw new AppError(409, 'ESTADO_INVALIDO', problema)

    const hecho = await cambiarEstado(c, p, 'cancelado', {
      usuarioId: p.vendedorId,
      mensaje: avisoVendedorCancelado({
        comprador: p.comprador.nombre,
        resumen: resumenItems(p.items),
      }),
    })
    if (!hecho) {
      throw new AppError(
        409,
        'ESTADO_INVALIDO',
        'El pedido cambió mientras tanto. Recarga la página.',
      )
    }
    return c.json<Pedido>(hecho)
  })
