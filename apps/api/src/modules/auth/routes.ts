import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import {
  loginSchema,
  registroSchema,
  solicitarInstitucionalSchema,
  verificarCodigoSchema,
  verificarInstitucionalSchema,
  type LoginResponse,
} from '@shopsito/shared'
import type { AppEnv, JwtPayload } from '../../env'
import { usuarios } from '../../db/schema'
import { getDb } from '../../lib/db'
import { AppError, notImplemented } from '../../lib/errors'
import { verificarPassword } from '../../lib/password'
import { validar } from '../../lib/validator'
import { JWT_ALG, requireAuth } from '../../middleware/auth'

const DURACION_TOKEN_S = 60 * 60 * 24 * 7

export const authRoutes = new Hono<AppEnv>()
  // TODO: crear usuario, generar código de 6 dígitos en codigos_verificacion y enviarlo por correo.
  .post('/registro', validar('json', registroSchema), notImplemented)
  .post('/verificar', validar('json', verificarCodigoSchema), notImplemented)

  // Login mínimo para poder probar rutas protegidas (p. ej. /admin con el usuario del seed).
  // TODO: exigir correoVerificado cuando exista el flujo de registro.
  .post('/login', validar('json', loginSchema), async (c) => {
    const { correo, password } = c.req.valid('json')
    const usuario = await getDb(c).query.usuarios.findFirst({
      where: eq(usuarios.correo, correo.toLowerCase()),
    })
    if (!usuario || !usuario.activo || !(await verificarPassword(password, usuario.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos')
    }
    const payload: JwtPayload = {
      sub: usuario.id,
      rol: usuario.rol,
      exp: Math.floor(Date.now() / 1000) + DURACION_TOKEN_S,
    }
    const token = await sign(payload, c.env.JWT_SECRET, JWT_ALG)
    return c.json<LoginResponse>({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    })
  })

  // JWT sin estado: el cliente descarta el token. TODO: lista de revocación si se necesita.
  .post('/logout', requireAuth, (c) => c.body(null, 204))

  .post(
    '/institucional/solicitar',
    requireAuth,
    validar('json', solicitarInstitucionalSchema),
    notImplemented,
  )
  .post(
    '/institucional/verificar',
    requireAuth,
    validar('json', verificarInstitucionalSchema),
    notImplemented,
  )
