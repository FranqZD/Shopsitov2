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
