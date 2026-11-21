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
