import { z } from 'zod'
import { centavosSchema, horaSchema } from './comun'
import { CATEGORIAS_PRODUCTO, type CategoriaProducto, type EstadoProducto } from '../enums'

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  descripcion: z.string().trim().max(500).default(''),
  precio: centavosSchema,
  cantidad: z.int().positive(),
  categoria: z.enum(CATEGORIAS_PRODUCTO),
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
  categoria: CategoriaProducto
  fotoKey: string | null
  fecha: string
  horaLimite: string
  estado: EstadoProducto
}

export type ProductoHoy = Producto & {
  vendedor: { id: string; nombre: string; insigniaComunidad: boolean }
}

/** Publicación del vendedor en "Lo que vendes hoy" (GET /productos/mios). */
export type MiPublicacion = Producto & {
  /** Unidades en pedidos vigentes (pendiente, aceptado o entregado). */
  vendidos: number
  /** Centavos de esos pedidos. */
  ingresos: number
  /** Cantidad con la que se publicó: lo que queda más lo vendido. */
  total: number
}
