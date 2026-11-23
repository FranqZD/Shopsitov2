import { Hono } from 'hono'
import type { Context } from 'hono'
import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import {
  ahoraCampus,
  crearPedidoSchema,
  idParamSchema,
  type EstadoPedido,
  type Pedido,
  type PedidoCompra,
  type PedidoVenta,
  type Notificacion,
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
import { ahoraIso, getDb, nuevoId } from '../../lib/db'
import { AppError, notFound, notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'
import {
  TRANSICIONES_VENDEDOR,
  avisoComprador,
  pendienteVencido,
  problemaTransicion,
  resumenItems,
  type AccionVendedor,
} from './logica'

type PedidoCargado = PedidoVenta & { vendedorId: string; fecha: string }

/** Pedidos con sus productos, comprador y punto de entrega (la consulta trae una fila por producto). */
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
      puntoEntrega: { id: puntosEntrega.id, nombre: puntosEntrega.nombre },
    })
    .from(pedidos)
    .innerJoin(detallePedido, eq(detallePedido.pedidoId, pedidos.id))
    .innerJoin(productos, eq(productos.id, detallePedido.productoId))
    .innerJoin(usuarios, eq(usuarios.id, pedidos.compradorId))
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

const aVenta = ({ vendedorId: _v, fecha: _f, ...venta }: PedidoCargado): PedidoVenta => venta

async function nombreDe(c: Context<AppEnv>, id: string) {
  const [u] = await getDb(c)
    .select({ nombre: usuarios.nombre })
    .from(usuarios)
    .where(eq(usuarios.id, id))
  return u?.nombre ?? 'Quien vende'
}

/**
 * Cambia el estado solo si nadie lo cambió antes (el WHERE incluye el estado leído) y avisa
 * al comprador. Al rechazar o cancelar, lo apartado regresa al inventario; solo a productos
 * disponibles, para no revivir uno que el vendedor quitó o un admin ocultó.
 * Devuelve null si el pedido ya había cambiado.
 */
async function cambiarEstado(
  c: Context<AppEnv>,
  p: PedidoCargado,
  hacia: EstadoPedido,
  vendedor: string,
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
      usuarioId: p.comprador.id,
      mensaje: avisoComprador(hacia, {
        vendedor,
        resumen: resumenItems(p.items),
        punto: p.puntoEntrega.nombre,
      }),
      fecha: ahoraIso(),
    }),
    ...(devolver
      ? p.items.map((i) =>
          db
            .update(productos)
            .set({ cantidad: sql`${productos.cantidad} + ${i.cantidad}` })
            .where(and(eq(productos.id, i.productoId), eq(productos.estado, 'disponible'))),
        )
      : []),
  ])
  p.estado = hacia
  return hecho
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
  const vendedor = await nombreDe(c, sub)

  if (p.estado === 'pendiente' && pendienteVencido(p, ahoraCampus())) {
    await cambiarEstado(c, p, 'cancelado', vendedor)
    throw new AppError(
      409,
      'PEDIDO_VENCIDO',
      `Ya pasó la hora límite (${p.horaLimite}) y el pedido se canceló solo.`,
    )
  }
  const problema = problemaTransicion(p.estado, accion)
  if (problema) throw new AppError(409, 'ESTADO_INVALIDO', problema)

  const hecho = await cambiarEstado(c, p, TRANSICIONES_VENDEDOR[accion].hacia, vendedor)
  if (!hecho) {
    throw new AppError(
      409,
      'ESTADO_INVALIDO',
      'El pedido cambió mientras tanto. Recarga la página.',
    )
  }
  return hecho
}

// TODO: al crear un pedido, descontar inventario (marcar `agotado` si llega a 0) y crear
// una notificación para el vendedor dentro del mismo db.batch().
export const pedidosRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validar('json', crearPedidoSchema), notImplemented)
  .get('/compras', notImplemented)
  // Lo que le pidieron hoy al vendedor en sesión, en cualquier estado.
  .get('/ventas', async (c) => {
    const { sub } = c.get('jwtPayload')
    const ahora = ahoraCampus()
    const lista = await cargarPedidos(
      c,
      and(eq(pedidos.vendedorId, sub), eq(productos.fecha, ahora.fecha)),
    )
    // Sin cron: los pendientes que ya pasaron su hora límite se cancelan al consultarlos.
    const vencidos = lista.filter((p) => p.estado === 'pendiente' && pendienteVencido(p, ahora))
    if (vencidos.length > 0) {
      const vendedor = await nombreDe(c, sub)
      for (const p of vencidos) await cambiarEstado(c, p, 'cancelado', vendedor)
    }
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
  .post('/:id/cancelar', validar('param', idParamSchema), notImplemented)


// Tiempo real: el cliente consulta GET /notificaciones periódicamente.
// Un Worker no puede guardar conexiones abiertas en memoria.
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

  // Marcar todo como leído.
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

    const [hecha] = await getDb(c)
      .update(notificaciones)
      .set({ leida: true })
      .where(and(eq(notificaciones.id, id), eq(notificaciones.usuarioId, sub)))
      .returning()

    if (!hecha) throw new AppError(404, 'NOT_FOUND', 'Notificación no encontrada')

    return c.json<Notificacion>(hecha)
  })