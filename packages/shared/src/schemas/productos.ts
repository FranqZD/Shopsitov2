import { z } from 'zod'
import { centavosSchema, horaSchema } from './comun'
import type { EstadoProducto } from '../enums'

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  descripcion: z.string().trim().max(500).default(''),
  precio: centavosSchema,
  cantidad: z.int().positive(),
  horaLimite: horaSchema,
})
export type CrearProductoInput = z.infer<typeof crearProductoSchema>

export const actualizarProductoSchema = crearProductoSchema.partial()
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>

export type Producto = {
  id: string
  vendedorId: string
  nombre: string
  descripcion: string
  precio: number
  cantidad: number
  fotoKey: string | null
  fecha: string
  horaLimite: string
  estado: EstadoProducto
}

export type ProductoHoy = Producto & {
  vendedor: { id: string; nombre: string; insigniaComunidad: boolean }
}
