import { z } from 'zod'
import { fechaSchema } from './comun'
import type { ProductoHoy } from './productos'

export const adminProductosQuerySchema = z.object({
  /** Día a revisar (YYYY-MM-DD); por defecto, hoy en el campus. */
  fecha: fechaSchema.optional(),
})

/** El admin solo oculta o vuelve a mostrar; "agotado" lo decide la cantidad. */
export const cambiarEstadoProductoSchema = z.object({
  estado: z.enum(['disponible', 'oculto']),
})
export type CambiarEstadoProductoInput = z.infer<typeof cambiarEstadoProductoSchema>

/** Producto en el panel de admin: incluye agotados, cerrados y ocultos. */
export type AdminProducto = ProductoHoy & {
  vendidos: number
  reportesAbiertos: number
}
