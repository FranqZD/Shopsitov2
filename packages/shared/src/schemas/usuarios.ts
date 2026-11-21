import { z } from 'zod'
import type { Rol } from '../enums'

export const actualizarPerfilSchema = z
  .object({
    nombre: z.string().trim().min(2).max(80),
    telefono: z.string().trim().min(8).max(20).nullable(),
  })
  .partial()
export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>

export type UsuarioPublico = {
  id: string
  nombre: string
  insigniaComunidad: boolean
}

export type UsuarioPrivado = UsuarioPublico & {
  correo: string
  telefono: string | null
  rol: Rol
  correoVerificado: boolean
  correoInstitucional: string | null
  creadoEn: string
}

/** Conteo de calificaciones por estrellas: índice 0 = 5 estrellas … índice 4 = 1 estrella. */
export type ResumenCalificaciones = {
  promedio: number | null
  total: number
  porEstrellas: [number, number, number, number, number]
}

/** Perfil público que ve cualquiera con sesión. */
export type PerfilUsuario = UsuarioPublico & {
  creadoEn: string
  /** Pedidos entregados como vendedor. */
  ventas: number
  /** Productos publicados en total (cualquier día). */
  publicaciones: number
  calificaciones: ResumenCalificaciones
}

export function resumirCalificaciones(estrellas: number[]): ResumenCalificaciones {
  const porEstrellas: ResumenCalificaciones['porEstrellas'] = [0, 0, 0, 0, 0]
  for (const e of estrellas) porEstrellas[5 - e]! += 1
  const total = estrellas.length
  const suma = estrellas.reduce((a, b) => a + b, 0)
  return {
    promedio: total ? Math.round((suma / total) * 10) / 10 : null,
    total,
    porEstrellas,
  }
}
