import { Hono } from 'hono'
import { and, eq, ne } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import {
  DOMINIO_INSTITUCIONAL,
  esCorreoInstitucional,
  loginSchema,
  normalizarCorreo,
  registroSchema,
  vincularInstitucionalSchema,
  type LoginResponse,
} from '@shopsito/shared'
import type { AppEnv, JwtPayload } from '../../env'
import { usuarios } from '../../db/schema'
import { ahoraIso, getDb, nuevoId, type Db } from '../../lib/db'
import { AppError, notFound } from '../../lib/errors'
import { hashPassword, verificarPassword } from '../../lib/password'
import { validar } from '../../lib/validator'
import { JWT_ALG, requireAuth } from '../../middleware/auth'

const DURACION_TOKEN_S = 60 * 60 * 24 * 7

type UsuarioSesion = Pick<typeof usuarios.$inferSelect, 'id' | 'nombre' | 'rol'>

async function crearSesion(usuario: UsuarioSesion, secreto: string): Promise<LoginResponse> {
  const payload: JwtPayload = {
    sub: usuario.id,
    rol: usuario.rol,
    exp: Math.floor(Date.now() / 1000) + DURACION_TOKEN_S,
  }
  return {
    token: await sign(payload, secreto, JWT_ALG),
    usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
  }
}

/** ¿Otra cuenta ya tiene la insignia con este correo institucional? */
async function institucionalOcupado(db: Db, correo: string, usuarioId: string) {
  const otro = await db.query.usuarios.findFirst({
    columns: { id: true },
    where: and(
      eq(usuarios.correoInstitucional, correo),
      eq(usuarios.insigniaComunidad, true),
      ne(usuarios.id, usuarioId),
    ),
  })
  return Boolean(otro)
}

// Decisión del equipo: sin códigos de verificación. Registrarse deja la sesión abierta.
export const authRoutes = new Hono<AppEnv>()
  .post('/registro', validar('json', registroSchema), async (c) => {
    const datos = c.req.valid('json')
    const correo = normalizarCorreo(datos.correo)
    const db = getDb(c)
    const existente = await db.query.usuarios.findFirst({
      columns: { id: true },
      where: eq(usuarios.correo, correo),
    })
    if (existente) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Ya hay una cuenta con ese correo. Mejor entra.')
    }

    const id = nuevoId()
    // Registrarse con el correo de la uni da la insignia de comunidad.
    const insignia = esCorreoInstitucional(correo) && !(await institucionalOcupado(db, correo, id))
    const [creado] = await db
      .insert(usuarios)
      .values({
        id,
        nombre: datos.nombre,
        correo,
        passwordHash: await hashPassword(datos.password),
        telefono: datos.telefono ?? null,
        correoVerificado: true,
        correoInstitucional: insignia ? correo : null,
        insigniaComunidad: insignia,
        creadoEn: ahoraIso(),
      })
      .returning({ id: usuarios.id, nombre: usuarios.nombre, rol: usuarios.rol })
    return c.json<LoginResponse>(await crearSesion(creado!, c.env.JWT_SECRET), 201)
  })

  .post('/login', validar('json', loginSchema), async (c) => {
    const { correo, password } = c.req.valid('json')
    const usuario = await getDb(c).query.usuarios.findFirst({
      where: eq(usuarios.correo, normalizarCorreo(correo)),
    })
    if (!usuario || !usuario.activo || !(await verificarPassword(password, usuario.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos')
    }
    return c.json<LoginResponse>(await crearSesion(usuario, c.env.JWT_SECRET))
  })

  // JWT sin estado: el cliente descarta el token. TODO: lista de revocación si se necesita.
  .post('/logout', requireAuth, (c) => c.body(null, 204))

  // Para cuentas creadas con otro correo: ligar el de la uni da la insignia al momento.
  .post('/institucional', requireAuth, validar('json', vincularInstitucionalSchema), async (c) => {
    const correo = normalizarCorreo(c.req.valid('json').correoInstitucional)
    const { sub: usuarioId } = c.get('jwtPayload')
    if (!esCorreoInstitucional(correo)) {
      throw new AppError(
        400,
        'NOT_INSTITUTIONAL',
        `Ese no es un correo de la uni. Usa uno que termine en @${DOMINIO_INSTITUCIONAL}.`,
      )
    }
    const db = getDb(c)
    const usuario = await db.query.usuarios.findFirst({ where: eq(usuarios.id, usuarioId) })
    if (!usuario || !usuario.activo) throw notFound('Usuario')
    if (usuario.insigniaComunidad) {
      throw new AppError(409, 'ALREADY_LINKED', 'Ya tienes la insignia de comunidad.')
    }
    if (await institucionalOcupado(db, correo, usuarioId)) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo de la uni ya está ligado a otra cuenta.')
    }
    await db
      .update(usuarios)
      .set({ correoInstitucional: correo, insigniaComunidad: true })
      .where(eq(usuarios.id, usuarioId))
    return c.body(null, 204)
  })
