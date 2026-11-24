import type { EstadoPedido } from '@shopsito/shared'

export type AccionVendedor = 'aceptar' | 'rechazar' | 'entregar'

/** Desde qué estado puede el vendedor hacer cada cosa, y a cuál pasa el pedido. */
export const TRANSICIONES_VENDEDOR: Record<
  AccionVendedor,
  { desde: EstadoPedido; hacia: EstadoPedido }
> = {
  aceptar: { desde: 'pendiente', hacia: 'aceptado' },
  rechazar: { desde: 'pendiente', hacia: 'rechazado' },
  entregar: { desde: 'aceptado', hacia: 'entregado' },
}

/** Mensaje si el pedido ya no admite la acción (p. ej. entregar algo que no se aceptó). */
export function problemaTransicion(estado: EstadoPedido, accion: AccionVendedor): string | null {
  if (estado === TRANSICIONES_VENDEDOR[accion].desde) return null
  if (estado === 'cancelado') return 'Este pedido ya se canceló.'
  if (estado === 'rechazado') return 'Ya rechazaste este pedido.'
  if (estado === 'entregado') return 'Este pedido ya se entregó.'
  if (accion === 'entregar') return 'Primero acepta el pedido.'
  return 'Ya aceptaste este pedido.'
}

/** El comprador solo puede cancelar mientras el vendedor no lo haya aceptado. */
export function problemaCancelar(estado: EstadoPedido): string | null {
  if (estado === 'pendiente') return null
  if (estado === 'aceptado') return 'Ya lo aceptaron. Si no puedes ir, avísale a quien vende.'
  if (estado === 'entregado') return 'Este pedido ya se entregó.'
  if (estado === 'rechazado') return 'Este pedido ya lo rechazaron.'
  return 'Este pedido ya se canceló.'
}

/**
 * Un pendiente vence cuando llega la hora límite de sus productos (o si es de otro día):
 * se cancela solo al consultarlo, sin cron.
 */
export const pendienteVencido = (
  pedido: { fecha: string; horaLimite: string },
  ahora: { fecha: string; hora: string },
) => pedido.fecha < ahora.fecha || (pedido.fecha === ahora.fecha && pedido.horaLimite <= ahora.hora)

/** "2 × Molletes, 1 × Café de olla". */
export const resumenItems = (items: { cantidad: number; nombre: string }[]) =>
  items.map((i) => `${i.cantidad} × ${i.nombre}`).join(', ')

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? nombre

/** Aviso para el comprador cuando su pedido cambia de estado. */
export function avisoComprador(
  hacia: EstadoPedido,
  datos: { vendedor: string; resumen: string; punto: string },
) {
  const quien = primerNombre(datos.vendedor)
  switch (hacia) {
    case 'aceptado':
      return `${quien} aceptó tu pedido de ${datos.resumen}. Te espera en ${datos.punto}.`
    case 'rechazado':
      return `${quien} no pudo aceptar tu pedido de ${datos.resumen}. No pagas nada.`
    case 'entregado':
      return `${quien} marcó como entregado tu pedido de ${datos.resumen}. ¿Qué tal estuvo?`
    case 'cancelado':
      return `Tu pedido de ${datos.resumen} se canceló porque ${quien} no lo aceptó a tiempo. No pagas nada.`
    default:
      return `Tu pedido de ${datos.resumen} cambió de estado.`
  }
}

/** Aviso para el vendedor cuando le hacen un pedido. */
export const avisoVendedorNuevo = (datos: { comprador: string; resumen: string }) =>
  `Nuevo pedido de ${primerNombre(datos.comprador)}: ${datos.resumen}.`

/** Aviso para el vendedor cuando el comprador cancela. */
export const avisoVendedorCancelado = (datos: { comprador: string; resumen: string }) =>
  `${primerNombre(datos.comprador)} canceló su pedido de ${datos.resumen}.`

export type ItemPedido = { productoId: string; cantidad: number }

/** Si el mismo producto viene dos veces, suma las cantidades. */
export function agruparItems(items: ItemPedido[]): ItemPedido[] {
  const porProducto = new Map<string, number>()
  for (const { productoId, cantidad } of items) {
    porProducto.set(productoId, (porProducto.get(productoId) ?? 0) + cantidad)
  }
  return [...porProducto].map(([productoId, cantidad]) => ({ productoId, cantidad }))
}

export type ProductoParaPedido = {
  id: string
  nombre: string
  vendedorId: string
  vendedorActivo: boolean
  estado: string
  fecha: string
  horaLimite: string
  cantidad: number
}

export type ProblemaPedido = { status: 400 | 403 | 409; code: string; mensaje: string }

/**
 * Revisa que se pueda pedir lo que llegó: un solo vendedor, que no sea uno mismo y que cada
 * producto siga disponible hoy, antes de su hora límite y con existencias suficientes.
 * Devuelve el primer problema (con mensaje para el usuario) o null si todo está bien.
 */
export function problemaPedido(
  compradorId: string,
  productos: ProductoParaPedido[],
  items: ItemPedido[],
  ahora: { fecha: string; hora: string },
): ProblemaPedido | null {
  if (new Set(productos.map((p) => p.vendedorId)).size > 1) {
    return {
      status: 400,
      code: 'VARIOS_VENDEDORES',
      mensaje: 'Un pedido solo puede ser de una persona. Haz un pedido por cada vendedor.',
    }
  }
  if (productos.some((p) => p.vendedorId === compradorId)) {
    return { status: 403, code: 'PEDIDO_PROPIO', mensaje: 'No puedes pedir lo que tú vendes.' }
  }
  for (const p of productos) {
    const disponible =
      p.estado === 'disponible' &&
      p.vendedorActivo &&
      p.fecha === ahora.fecha &&
      p.horaLimite > ahora.hora
    if (!disponible) {
      return {
        status: 409,
        code: 'PRODUCTO_NO_DISPONIBLE',
        mensaje: `"${p.nombre}" ya no está disponible.`,
      }
    }
    const pedidos = items.find((i) => i.productoId === p.id)?.cantidad ?? 0
    if (pedidos > p.cantidad) {
      return {
        status: 409,
        code: 'SIN_EXISTENCIAS',
        mensaje:
          p.cantidad === 1
            ? `Solo queda 1 de "${p.nombre}".`
            : `Solo quedan ${p.cantidad} de "${p.nombre}".`,
      }
    }
  }
  return null
}
