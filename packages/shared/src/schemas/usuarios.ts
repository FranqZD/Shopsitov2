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
