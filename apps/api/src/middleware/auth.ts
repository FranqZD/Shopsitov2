import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { jwt } from 'hono/jwt'
import type { AppEnv } from '../env'

export const JWT_ALG = 'HS256'

/** Exige `Authorization: Bearer <token>` y deja el payload en `c.get('jwtPayload')`. */
export const requireAuth = createMiddleware<AppEnv>((c, next) =>
  jwt({ secret: c.env.JWT_SECRET, alg: JWT_ALG })(c, next),
)

/** Usar siempre después de `requireAuth`. */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (c.get('jwtPayload')?.rol !== 'admin') {
    throw new HTTPException(403, { message: 'Se requiere rol de administrador' })
  }
  await next()
})
