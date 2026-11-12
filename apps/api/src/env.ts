import type { Rol } from '@shopsito/shared'

/** Bindings declarados en wrangler.toml y secretos de .dev.vars. */
export type Bindings = {
  DB: D1Database
  FOTOS: R2Bucket
  JWT_SECRET: string
}

export type JwtPayload = {
  sub: string
  rol: Rol
  exp: number
}

export type Variables = {
  jwtPayload: JwtPayload
}

export type AppEnv = { Bindings: Bindings; Variables: Variables }
