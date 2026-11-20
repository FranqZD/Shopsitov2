import { z } from 'zod'
import { idSchema } from './comun'
import { ESTADOS_REPORTE, type EstadoProducto, type EstadoReporte } from '../enums'

export const crearReporteSchema = z.object({
  /** ID del usuario o del producto reportado; la API averigua cuál es. */
  objetivoId: idSchema,
  motivo: z.string().trim().min(3).max(80),
  detalle: z.string().trim().max(500).default(''),
})
export type CrearReporteInput = z.input<typeof crearReporteSchema>

export const actualizarReporteSchema = z.object({
  estado: z.enum(ESTADOS_REPORTE),
  nota: z.string().trim().max(500).optional(),
})
export type ActualizarReporteInput = z.infer<typeof actualizarReporteSchema>

export const listarReportesQuerySchema = z.object({
  estado: z.enum(ESTADOS_REPORTE).optional(),
})

/** Lo reportado; null si ya no existe (p. ej. una publicación que se borró). */
export type ObjetivoReporte =
  | { tipo: 'usuario'; id: string; nombre: string }
  | {
      tipo: 'producto'
      id: string
      nombre: string
      estado: EstadoProducto
      vendedor: { id: string; nombre: string }
    }

/** Reporte como lo ve el admin. */
export type Reporte = {
  id: string
  motivo: string
  detalle: string
  estado: EstadoReporte
  nota: string | null
  creadoEn: string
  reportante: { id: string; nombre: string }
  objetivo: ObjetivoReporte | null
}
