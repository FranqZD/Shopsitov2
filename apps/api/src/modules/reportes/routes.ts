import { Hono } from 'hono'
import { and, desc, eq, inArray } from 'drizzle-orm'
import {
  actualizarReporteSchema,
  crearReporteSchema,
  idParamSchema,
  listarReportesQuerySchema,
  type ObjetivoReporte,
  type Reporte,
} from '@shopsito/shared'
import type { AppEnv } from '../../env'
import { productos, reportes, usuarios } from '../../db/schema'
import { ahoraIso, getDb, nuevoId } from '../../lib/db'
import { AppError, notFound } from '../../lib/errors'
import { validar } from '../../lib/validator'
import { requireAdmin, requireAuth } from '../../middleware/auth'

export const reportesRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  // Cualquiera con sesión reporta a un usuario o una publicación; la API averigua cuál es.
  .post('/', validar('json', crearReporteSchema), async (c) => {
    const datos = c.req.valid('json')
    const { sub: reportanteId } = c.get('jwtPayload')
    const db = getDb(c)
    const [producto, usuario] = await Promise.all([
      db.query.productos.findFirst({
        columns: { vendedorId: true },
        where: eq(productos.id, datos.objetivoId),
      }),
      db.query.usuarios.findFirst({
        columns: { id: true },
        where: eq(usuarios.id, datos.objetivoId),
      }),
    ])
    if (!producto && !usuario) throw notFound('Lo que quieres reportar')
    if ((producto?.vendedorId ?? usuario?.id) === reportanteId) {
      throw new AppError(400, 'AUTOREPORTE', 'No puedes reportarte a ti mismo.')
    }
    const repetido = await db.query.reportes.findFirst({
      columns: { id: true },
      where: and(
        eq(reportes.reportanteId, reportanteId),
        eq(reportes.objetivoId, datos.objetivoId),
        eq(reportes.estado, 'abierto'),
      ),
    })
    if (repetido) {
      throw new AppError(409, 'REPORTE_REPETIDO', 'Ya lo reportaste; el equipo lo está revisando.')
    }
    await db.insert(reportes).values({
      id: nuevoId(),
      reportanteId,
      tipoObjetivo: producto ? 'producto' : 'usuario',
      ...datos,
      creadoEn: ahoraIso(),
    })
    return c.body(null, 201)
  })
  .get('/', requireAdmin, validar('query', listarReportesQuerySchema), async (c) => {
    const { estado } = c.req.valid('query')
    const db = getDb(c)
    const filas = await db
      .select({ reporte: reportes, reportante: { id: usuarios.id, nombre: usuarios.nombre } })
      .from(reportes)
      .innerJoin(usuarios, eq(reportes.reportanteId, usuarios.id))
      .where(estado ? eq(reportes.estado, estado) : undefined)
      .orderBy(desc(reportes.creadoEn))

    const ids = (tipo: 'usuario' | 'producto') => [
      ...new Set(
        filas.filter((f) => f.reporte.tipoObjetivo === tipo).map((f) => f.reporte.objetivoId),
      ),
    ]
    const [usuariosObj, productosObj] = await Promise.all([
      ids('usuario').length
        ? db
            .select({ id: usuarios.id, nombre: usuarios.nombre })
            .from(usuarios)
            .where(inArray(usuarios.id, ids('usuario')))
        : [],
      ids('producto').length
        ? db
            .select({
              id: productos.id,
              nombre: productos.nombre,
              estado: productos.estado,
              vendedor: { id: usuarios.id, nombre: usuarios.nombre },
            })
            .from(productos)
            .innerJoin(usuarios, eq(productos.vendedorId, usuarios.id))
            .where(inArray(productos.id, ids('producto')))
        : [],
    ])
    const objetivos = new Map<string, ObjetivoReporte>([
      ...usuariosObj.map((u) => [u.id, { tipo: 'usuario' as const, ...u }] as const),
      ...productosObj.map((p) => [p.id, { tipo: 'producto' as const, ...p }] as const),
    ])

    return c.json<Reporte[]>(
      filas.map(({ reporte, reportante }) => ({
        id: reporte.id,
        motivo: reporte.motivo,
        detalle: reporte.detalle,
        estado: reporte.estado,
        nota: reporte.nota,
        creadoEn: reporte.creadoEn,
        reportante,
        objetivo: objetivos.get(reporte.objetivoId) ?? null,
      })),
    )
  })
  .patch(
    '/:id',
    requireAdmin,
    validar('param', idParamSchema),
    validar('json', actualizarReporteSchema),
    async (c) => {
      const { id } = c.req.valid('param')
      const { estado, nota } = c.req.valid('json')
      const [actualizado] = await getDb(c)
        .update(reportes)
        .set({ estado, ...(nota !== undefined && { nota: nota || null }) })
        .where(eq(reportes.id, id))
        .returning({ id: reportes.id })
      if (!actualizado) throw notFound('Reporte')
      return c.body(null, 204)
    },
  )
