import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import {
  ESTADOS_PEDIDO,
  ESTADOS_PRODUCTO,
  ESTADOS_REPORTE,
  ROLES,
  TIPOS_CODIGO,
} from '@shopsito/shared'

// Convenciones: IDs UUID en texto, fechas en texto ISO, dinero en centavos (entero).
// Columnas en snake_case en SQL, camelCase en TypeScript.

export const usuarios = sqliteTable('usuarios', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  correo: text('correo').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  telefono: text('telefono'),
  rol: text('rol', { enum: ROLES }).notNull().default('usuario'),
  correoVerificado: integer('correo_verificado', { mode: 'boolean' }).notNull().default(false),
  correoInstitucional: text('correo_institucional'),
  insigniaComunidad: integer('insignia_comunidad', { mode: 'boolean' }).notNull().default(false),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  creadoEn: text('creado_en').notNull(),
})

export const codigosVerificacion = sqliteTable('codigos_verificacion', {
  id: text('id').primaryKey(),
  usuarioId: text('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  codigo: text('codigo').notNull(),
  tipo: text('tipo', { enum: TIPOS_CODIGO }).notNull(),
  expiraEn: text('expira_en').notNull(),
  usado: integer('usado', { mode: 'boolean' }).notNull().default(false),
})

export const productos = sqliteTable(
  'productos',
  {
    id: text('id').primaryKey(),
    vendedorId: text('vendedor_id')
      .notNull()
      .references(() => usuarios.id),
    nombre: text('nombre').notNull(),
    descripcion: text('descripcion').notNull().default(''),
    precio: integer('precio').notNull(),
    cantidad: integer('cantidad').notNull(),
    fotoKey: text('foto_key'),
    /** YYYY-MM-DD en hora del campus (America/Mexico_City). */
    fecha: text('fecha').notNull(),
    /** HH:MM en hora del campus. */
    horaLimite: text('hora_limite').notNull(),
    estado: text('estado', { enum: ESTADOS_PRODUCTO }).notNull().default('disponible'),
  },
  (t) => [index('productos_fecha_idx').on(t.fecha, t.horaLimite)],
)

export const puntosEntrega = sqliteTable('puntos_entrega', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  ubicacion: text('ubicacion').notNull(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
})

export const pedidos = sqliteTable('pedidos', {
  id: text('id').primaryKey(),
  compradorId: text('comprador_id')
    .notNull()
    .references(() => usuarios.id),
  vendedorId: text('vendedor_id')
    .notNull()
    .references(() => usuarios.id),
  puntoEntregaId: text('punto_entrega_id')
    .notNull()
    .references(() => puntosEntrega.id),
  estado: text('estado', { enum: ESTADOS_PEDIDO }).notNull().default('pendiente'),
  total: integer('total').notNull(),
  creadoEn: text('creado_en').notNull(),
})

export const detallePedido = sqliteTable('detalle_pedido', {
  id: text('id').primaryKey(),
  pedidoId: text('pedido_id')
    .notNull()
    .references(() => pedidos.id),
  productoId: text('producto_id')
    .notNull()
    .references(() => productos.id),
  cantidad: integer('cantidad').notNull(),
  precioUnitario: integer('precio_unitario').notNull(),
})

export const calificaciones = sqliteTable(
  'calificaciones',
  {
    id: text('id').primaryKey(),
    pedidoId: text('pedido_id')
      .notNull()
      .references(() => pedidos.id),
    estrellas: integer('estrellas').notNull(),
    comentario: text('comentario'),
    fecha: text('fecha').notNull(),
  },
  (t) => [
    uniqueIndex('calificaciones_pedido_unq').on(t.pedidoId),
    check('calificaciones_estrellas_chk', sql`${t.estrellas} between 1 and 5`),
  ],
)

export const notificaciones = sqliteTable('notificaciones', {
  id: text('id').primaryKey(),
  usuarioId: text('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  mensaje: text('mensaje').notNull(),
  leida: integer('leida', { mode: 'boolean' }).notNull().default(false),
  fecha: text('fecha').notNull(),
})

export const reportes = sqliteTable('reportes', {
  id: text('id').primaryKey(),
  reportanteId: text('reportante_id')
    .notNull()
    .references(() => usuarios.id),
  /** ID del usuario o producto reportado. */
  objetivoId: text('objetivo_id').notNull(),
  motivo: text('motivo').notNull(),
  estado: text('estado', { enum: ESTADOS_REPORTE }).notNull().default('abierto'),
})
