import { z } from 'zod'
import { idSchema } from './comun'

export const crearCalificacionSchema = z.object({
  pedidoId: idSchema,
  estrellas: z.int().min(1).max(5),
  comentario: z.string().trim().max(500).optional(),
})
export type CrearCalificacionInput = z.infer<typeof crearCalificacionSchema>
