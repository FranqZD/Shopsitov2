import type { Context, ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError, z } from 'zod'
import type { ApiError } from '@shopsito/shared'

/** Lanza esto desde cualquier ruta; el handler global lo convierte a `{ error: { code, message } }`. */
export class AppError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export const notFound = (recurso: string) =>
  new AppError(404, 'NOT_FOUND', `${recurso} no encontrado`)

export const notImplemented = (c: Context) =>
  c.json<ApiError>(
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `${c.req.method} ${c.req.path} aún no está implementado`,
      },
    },
    501,
  )

export const onError: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json<ApiError>(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.status,
    )
  }
  if (err instanceof HTTPException) {
    if (err.cause instanceof ZodError) {
      return c.json<ApiError>(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: z.flattenError(err.cause),
          },
        },
        400,
      )
    }
    const code =
      err.status === 401 ? 'UNAUTHORIZED' : err.status === 403 ? 'FORBIDDEN' : 'HTTP_ERROR'
    return c.json<ApiError>({ error: { code, message: err.message || 'Error' } }, err.status)
  }
  console.error(err)
  return c.json<ApiError>(
    { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
    500,
  )
}

export const onNotFound: NotFoundHandler = (c) =>
  c.json<ApiError>(
    { error: { code: 'NOT_FOUND', message: `Ruta ${c.req.path} no encontrada` } },
    404,
  )
