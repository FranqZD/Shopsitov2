import { z } from 'zod'

export const idSchema = z.uuid()
export const idParamSchema = z.object({ id: idSchema })

/** Dinero siempre en centavos (entero). */
export const centavosSchema = z.int().nonnegative()

/** Fecha del campus en formato YYYY-MM-DD. */
export const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

/** Hora local del campus en formato HH:MM (24 h). */
export const horaSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM')

export type ApiError = { error: { code: string; message: string; details?: unknown } }
