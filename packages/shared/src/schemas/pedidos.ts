import { z } from 'zod'
import { idSchema } from './comun'
import type { EstadoPedido } from '../enums'

export const crearPedidoSchema = z.object({
  puntoEntregaId: idSchema,
  items: z.array(z.object({ productoId: idSchema, cantidad: z.int().positive() })).min(1),
})
export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>

export type Pedido = {
  id: string
  compradorId: string
  vendedorId: string
  puntoEntregaId: string
  estado: EstadoPedido
  total: number
  creadoEn: string
}

export type PedidoVentaItem = {
  productoId: string
  nombre: string
  fotoKey: string | null
  cantidad: number
  precioUnitario: number
}

/** Un pedido visto por quien vende (`GET /pedidos/ventas`). */
export type PedidoVenta = {
  id: string
  estado: EstadoPedido
  total: number
  creadoEn: string
  /** La hora límite más temprana de sus productos: si sigue pendiente a esa hora, se cancela solo. */
  horaLimite: string
  comprador: { id: string; nombre: string; insigniaComunidad: boolean }
  puntoEntrega: { id: string; nombre: string }
  items: PedidoVentaItem[]
}

/** Un pedido visto por quien compra (`GET /pedidos/compras`). */
export type PedidoCompra = {
  id: string
  estado: EstadoPedido
  total: number
  creadoEn: string
  /** La hora límite más temprana de sus productos: si sigue pendiente a esa hora, se cancela solo. */
  horaLimite: string
  vendedor: { id: string; nombre: string; insigniaComunidad: boolean }
  puntoEntrega: { id: string; nombre: string; ubicacion: string }
  items: PedidoVentaItem[]
}
