import { z } from 'zod'
import type { Rol } from '../enums'

export const registroSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  correo: z.email(),
  password: z.string().min(8).max(128),
  telefono: z.string().trim().min(8).max(20).optional(),
})
export type RegistroInput = z.infer<typeof registroSchema>

export const loginSchema = z.object({
  correo: z.email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof loginSchema>

export const vincularInstitucionalSchema = z.object({
  correoInstitucional: z.email(),
})
export type VincularInstitucionalInput = z.infer<typeof vincularInstitucionalSchema>

export type LoginResponse = {
  token: string
  usuario: { id: string; nombre: string; rol: Rol }
}

/** Dominio de la universidad; también cuentan sus subdominios (p. ej. alumnos.universidad.edu.mx). */
export const DOMINIO_INSTITUCIONAL = 'universidad.edu.mx'

export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase()

export function esCorreoInstitucional(correo: string) {
  const dominio = normalizarCorreo(correo).split('@')[1] ?? ''
  return dominio === DOMINIO_INSTITUCIONAL || dominio.endsWith(`.${DOMINIO_INSTITUCIONAL}`)
}
