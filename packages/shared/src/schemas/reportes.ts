import { z } from 'zod'
import { idSchema } from './comun'
import { ESTADOS_REPORTE } from '../enums'

export const crearReporteSchema = z.object({
  objetivoId: idSchema,
  motivo: z.string().trim().min(5).max(500),
})
export type CrearReporteInput = z.infer<typeof crearReporteSchema>

export const actualizarReporteSchema = z.object({
  estado: z.enum(ESTADOS_REPORTE),
})
export type ActualizarReporteInput = z.infer<typeof actualizarReporteSchema>
