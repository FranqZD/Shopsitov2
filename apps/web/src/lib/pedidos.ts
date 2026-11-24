import {
  ahoraCampus,
  segundosHastaHora,
  type EstadoPedido,
  type PedidoCompra,
} from '@shopsito/shared'
import { formatoPrecio, haceCuanto } from './formato'

/** Pedidos que todavía están en curso (los demás van en "Anteriores"). */
export const ESTADOS_ACTIVOS: EstadoPedido[] = ['pendiente', 'aceptado']

/** HH:MM en hora del campus a partir de una fecha ISO. */
export const horaDe = (iso: string) => ahoraCampus(new Date(iso)).hora

/** "2 × Molletes, 1 × Café de olla". */
export const resumenPedido = (items: PedidoCompra['items']) =>
  items.map((i) => `${i.cantidad} × ${i.nombre}`).join(', ')

/** "Molletes" o "Molletes y 1 más". */
export function tituloPedido(items: PedidoCompra['items']) {
  const primero = items[0]?.nombre ?? 'Pedido'
  return items.length > 1 ? `${primero} y ${items.length - 1} más` : primero
}

/** "2 × $35 · Mariana López" (o "3 productos · Mariana López" si hay varios). */
export function subtituloPedido(p: PedidoCompra) {
  const [unico] = p.items
  if (p.items.length === 1 && unico) {
    return `${unico.cantidad} × ${formatoPrecio(unico.precioUnitario)} · ${p.vendedor.nombre}`
  }
  const piezas = p.items.reduce((suma, i) => suma + i.cantidad, 0)
  return `${piezas} productos · ${p.vendedor.nombre}`
}

/**
 * Un pendiente que ya pasó su hora límite se muestra como cancelado: el servidor lo cancela en
 * la siguiente consulta, así la pantalla no espera al siguiente refresco.
 */
export function estadoVigente(p: PedidoCompra, ahora: Date): EstadoPedido {
  return p.estado === 'pendiente' && segundosHastaHora(p.horaLimite, ahora) <= 0
    ? 'cancelado'
    : p.estado
}

/** Nota corta de la lista de pedidos. */
export function notaPedido(p: PedidoCompra, estado: EstadoPedido) {
  switch (estado) {
    case 'pendiente':
    case 'aceptado':
      return `${p.puntoEntrega.nombre}, antes de ${p.horaLimite}`
    case 'entregado':
      return `${haceCuanto(p.creadoEn)}, ${horaDe(p.creadoEn)}`
    case 'rechazado':
      return 'No lo pudo aceptar'
    case 'cancelado':
      return 'Se canceló'
  }
}

/** Título y texto del recuadro grande de arriba en el detalle. */
export function heroPedido(p: PedidoCompra, estado: EstadoPedido, corto: string) {
  switch (estado) {
    case 'pendiente':
      return {
        titulo: `Esperando a ${corto}`,
        texto: `Le avisamos de tu pedido. Si no lo acepta antes de las ${p.horaLimite}, se cancela solo y no pagas nada.`,
      }
    case 'aceptado':
      return {
        titulo: `¡${corto} lo aceptó!`,
        texto: `Ya te está esperando. Pasa por tu pedido a ${p.puntoEntrega.nombre} antes de las ${p.horaLimite}.`,
      }
    case 'entregado':
      return {
        titulo: 'Entregado',
        texto: '¿Qué tal estuvo? Tu calificación ayuda a otros a decidir.',
      }
    case 'rechazado':
      return {
        titulo: `${corto} no pudo aceptarlo`,
        texto: 'No pagas nada. Todavía hay más cosas en lo de hoy.',
      }
    case 'cancelado':
      return { titulo: 'Cancelado', texto: 'Este pedido se canceló. No se te cobró nada.' }
  }
}

export type PasoPedido = {
  titulo: string
  sub: string
  hora: string
  tipo: 'hecho' | 'actual' | 'mal' | 'falta'
}

/** Seguimiento del pedido. Solo se sabe la hora en que se envió (el modelo no guarda las demás). */
export function pasosPedido(p: PedidoCompra, estado: EstadoPedido, corto: string): PasoPedido[] {
  const enviado: PasoPedido = {
    titulo: 'Pedido enviado',
    sub: `Apartaste ${resumenPedido(p.items)}.`,
    hora: horaDe(p.creadoEn),
    tipo: 'hecho',
  }
  const aceptado = (tipo: PasoPedido['tipo']): PasoPedido => ({
    titulo: `${corto} lo aceptó`,
    sub: `Te espera en ${p.puntoEntrega.nombre}.`,
    hora: '',
    tipo,
  })
  switch (estado) {
    case 'pendiente':
      return [
        enviado,
        {
          titulo: 'Esperando que lo acepte',
          sub: `${corto} ya recibió el aviso.`,
          hora: '',
          tipo: 'actual',
        },
        {
          titulo: 'Entregado',
          sub: `Cuando lo recojas en ${p.puntoEntrega.nombre}.`,
          hora: '',
          tipo: 'falta',
        },
      ]
    case 'aceptado':
      return [
        enviado,
        aceptado('hecho'),
        {
          titulo: 'Entregado',
          sub: `${corto} lo marca cuando te lo dé.`,
          hora: '',
          tipo: 'actual',
        },
      ]
    case 'entregado':
      return [
        enviado,
        aceptado('hecho'),
        { titulo: 'Entregado', sub: 'Todo en orden.', hora: '', tipo: 'hecho' },
      ]
    case 'rechazado':
      return [
        enviado,
        { titulo: `${corto} lo rechazó`, sub: 'No se te cobró nada.', hora: '', tipo: 'mal' },
      ]
    case 'cancelado':
      return [
        enviado,
        { titulo: 'Pedido cancelado', sub: 'No se te cobró nada.', hora: '', tipo: 'mal' },
      ]
  }
}
