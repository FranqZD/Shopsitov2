import type { Notificacion } from '@shopsito/shared'
import { haceCuanto } from './formato'

export type TipoNotificacion = 'ok' | 'reloj' | 'bolsa' | 'x' | 'estrella' | 'insignia'

/** El icono sale del texto del aviso (la API solo guarda el mensaje). */
export function tipoNotificacion(mensaje: string): TipoNotificacion {
  const m = mensaje.toLowerCase()
  if (m.startsWith('nuevo pedido')) return 'bolsa'
  if (m.includes('canceló su pedido')) return 'x'
  if (m.includes('se canceló porque')) return 'reloj'
  if (m.includes('no pudo aceptar')) return 'x'
  if (m.includes('entregado')) return 'estrella'
  if (m.includes('aceptó')) return 'ok'
  if (m.includes('insignia')) return 'insignia'
  return 'bolsa'
}

/** A dónde lleva tocar el aviso: los que recibe quien vende van a "Mis ventas". */
export function destinoNotificacion(mensaje: string): string {
  const m = mensaje.toLowerCase()
  return m.startsWith('nuevo pedido') || m.includes('canceló su pedido') ? '/ventas' : '/pedidos'
}

/** Agrupa por día conservando el orden (Hoy, Ayer, Hace 3 días…). */
export function agruparPorDia(lista: Notificacion[], ahora: Date = new Date()) {
  const grupos: { titulo: string; items: Notificacion[] }[] = []
  for (const n of lista) {
    const titulo = haceCuanto(n.fecha, ahora)
    const ultimo = grupos.at(-1)
    if (ultimo?.titulo === titulo) ultimo.items.push(n)
    else grupos.push({ titulo, items: [n] })
  }
  return grupos
}
