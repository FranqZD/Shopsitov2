import { z } from 'zod'
import { idSchema } from './comun'

export const crearCalificacionSchema = z.object({
  pedidoId: idSchema,
  estrellas: z.int().min(1).max(5),
  comentario: z.string().trim().max(500).optional(),
})
export type CrearCalificacionInput = z.infer<typeof crearCalificacionSchema>

/** Reseña tal como se muestra en el perfil del vendedor. */
export type Resena = {
  id: string
  estrellas: number
  comentario: string | null
  fecha: string
  comprador: { id: string; nombre: string }
  /** Nombre del primer producto del pedido. */
  producto: string | null
}
