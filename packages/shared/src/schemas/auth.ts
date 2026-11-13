import { z } from 'zod'
import type { Rol } from '../enums'

export const registroSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  correo: z.email(),
  password: z.string().min(8).max(128),
  telefono: z.string().trim().min(8).max(20).optional(),
})
export type RegistroInput = z.infer<typeof registroSchema>

export const verificarCodigoSchema = z.object({
  correo: z.email(),
  codigo: z.string().regex(/^\d{6}$/, 'Código de 6 dígitos'),
})
export type VerificarCodigoInput = z.infer<typeof verificarCodigoSchema>

export const loginSchema = z.object({
  correo: z.email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof loginSchema>

export const solicitarInstitucionalSchema = z.object({
  correoInstitucional: z.email(),
})
export type SolicitarInstitucionalInput = z.infer<typeof solicitarInstitucionalSchema>

export const verificarInstitucionalSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, 'Código de 6 dígitos'),
})
export type VerificarInstitucionalInput = z.infer<typeof verificarInstitucionalSchema>

export type LoginResponse = {
  token: string
  usuario: { id: string; nombre: string; rol: Rol }
}
