import { Hono } from 'hono'
import { and, count, eq } from 'drizzle-orm'
import {
  actualizarPerfilSchema,
  idParamSchema,
  resumirCalificaciones,
  type PerfilUsuario,
  type UsuarioPrivado,
} from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { calificaciones, pedidos, productos, usuarios } from '../../db/schema'
import { getDb } from '../../lib/db'
import { notFound, notImplemented } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAuth } from '../../middleware/auth'

export const usuariosRoutes = new Hono<AppEnv>()
  .get('/me', requireAuth, async (c) => {
    const { sub } = c.get('jwtPayload')
    const u = await getDb(c).query.usuarios.findFirst({ where: eq(usuarios.id, sub) })
    if (!u || !u.activo) throw notFound('Usuario')
    return c.json<UsuarioPrivado>({
      id: u.id,
      nombre: u.nombre,
      insigniaComunidad: u.insigniaComunidad,
      correo: u.correo,
      telefono: u.telefono,
      rol: u.rol,
      correoVerificado: u.correoVerificado,
      correoInstitucional: u.correoInstitucional,
      creadoEn: u.creadoEn,
    })
  })
  .patch('/me', requireAuth, validar('json', actualizarPerfilSchema), notImplemented)
  // TODO: baja lógica (activo = false), no borrar filas con pedidos asociados.
  .delete('/me', requireAuth, notImplemented)
  // Perfil público: datos básicos y números que se calculan de pedidos y calificaciones.
  .get('/:id', requireAuth, validar('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const db = getDb(c)
    const u = await db.query.usuarios.findFirst({
      columns: { id: true, nombre: true, insigniaComunidad: true, creadoEn: true, activo: true },
      where: eq(usuarios.id, id),
    })
    if (!u || !u.activo) throw notFound('Usuario')

    const [[ventas], [publicaciones], estrellas] = await Promise.all([
      db
        .select({ n: count() })
        .from(pedidos)
        .where(and(eq(pedidos.vendedorId, id), eq(pedidos.estado, 'entregado'))),
      db.select({ n: count() }).from(productos).where(eq(productos.vendedorId, id)),
      db
        .select({ estrellas: calificaciones.estrellas })
        .from(calificaciones)
        .innerJoin(pedidos, eq(calificaciones.pedidoId, pedidos.id))
        .where(eq(pedidos.vendedorId, id)),
    ])

    return c.json<PerfilUsuario>({
      id: u.id,
      nombre: u.nombre,
      insigniaComunidad: u.insigniaComunidad,
      creadoEn: u.creadoEn,
      ventas: ventas?.n ?? 0,
      publicaciones: publicaciones?.n ?? 0,
      calificaciones: resumirCalificaciones(estrellas.map((e) => e.estrellas)),
    })
  })
