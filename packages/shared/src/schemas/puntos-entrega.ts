import { z } from 'zod'

export const crearPuntoEntregaSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  ubicacion: z.string().trim().min(2).max(200),
  activo: z.boolean().default(true),
})
export type CrearPuntoEntregaInput = z.input<typeof crearPuntoEntregaSchema>

export const actualizarPuntoEntregaSchema = z
  .object({
    nombre: z.string().trim().min(2).max(80),
    ubicacion: z.string().trim().min(2).max(200),
    activo: z.boolean(),
  })
  .partial()
export type ActualizarPuntoEntregaInput = z.infer<typeof actualizarPuntoEntregaSchema>

export type PuntoEntrega = {
  id: string
  nombre: string
  ubicacion: string
  activo: boolean
}
