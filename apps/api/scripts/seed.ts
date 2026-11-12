// Seed local: borra los datos y vuelve a insertar usuarios, puntos de entrega y productos de HOY.
// Uso: pnpm db:seed (aplica sobre la D1 simulada en .wrangler/, nunca en la nube).
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { ahoraCampus } from '@shopsito/shared'
import { hashPassword } from '../src/lib/password'

const q = (v: string | number | boolean | null) =>
  v === null
    ? 'NULL'
    : typeof v === 'string'
      ? `'${v.replaceAll("'", "''")}'`
      : typeof v === 'boolean'
        ? v
          ? 1
          : 0
        : v

const insert = (tabla: string, fila: Record<string, string | number | boolean | null>) =>
  `INSERT INTO ${tabla} (${Object.keys(fila).join(', ')}) VALUES (${Object.values(fila).map(q).join(', ')});`

const ahora = new Date().toISOString()
const { fecha: hoy } = ahoraCampus()
const { fecha: ayer } = ahoraCampus(new Date(Date.now() - 24 * 60 * 60 * 1000))

const ids = {
  admin: '00000000-0000-4000-8000-000000000001',
  ana: '00000000-0000-4000-8000-000000000002',
  beto: '00000000-0000-4000-8000-000000000003',
  biblioteca: '00000000-0000-4000-8000-000000000101',
  cafeteria: '00000000-0000-4000-8000-000000000102',
  gimnasio: '00000000-0000-4000-8000-000000000103',
}

const usuario = async (
  id: string,
  nombre: string,
  correo: string,
  password: string,
  extra = {},
) => ({
  id,
  nombre,
  correo,
  password_hash: await hashPassword(password),
  telefono: null,
  rol: 'usuario',
  correo_verificado: true,
  correo_institucional: null,
  insignia_comunidad: false,
  activo: true,
  creado_en: ahora,
  ...extra,
})

const producto = (
  n: number,
  vendedorId: string,
  nombre: string,
  precio: number,
  cantidad: number,
  horaLimite: string,
  fecha = hoy,
) => ({
  id: `00000000-0000-4000-8000-${String(200 + n).padStart(12, '0')}`,
  vendedor_id: vendedorId,
  nombre,
  descripcion: '',
  precio,
  cantidad,
  foto_key: null,
  fecha,
  hora_limite: horaLimite,
  estado: 'disponible',
})

const sql = [
  // Orden inverso a las llaves foráneas.
  ...[
    'calificaciones',
    'detalle_pedido',
    'pedidos',
    'notificaciones',
    'reportes',
    'codigos_verificacion',
    'productos',
    'puntos_entrega',
    'usuarios',
  ].map((t) => `DELETE FROM ${t};`),
  insert(
    'usuarios',
    await usuario(ids.admin, 'Admin Shopsito', 'admin@shopsito.test', 'admin1234', {
      rol: 'admin',
    }),
  ),
  insert(
    'usuarios',
    await usuario(ids.ana, 'Ana López', 'ana@shopsito.test', 'shopsito123', {
      correo_institucional: 'ana.lopez@universidad.edu.mx',
      insignia_comunidad: true,
    }),
  ),
  insert('usuarios', await usuario(ids.beto, 'Beto Ramírez', 'beto@shopsito.test', 'shopsito123')),
  insert('puntos_entrega', {
    id: ids.biblioteca,
    nombre: 'Biblioteca Central',
    ubicacion: 'Entrada principal',
    activo: true,
  }),
  insert('puntos_entrega', {
    id: ids.cafeteria,
    nombre: 'Cafetería',
    ubicacion: 'Junto a las cajas',
    activo: true,
  }),
  insert('puntos_entrega', {
    id: ids.gimnasio,
    nombre: 'Gimnasio',
    ubicacion: 'Recepción',
    activo: true,
  }),
  insert('productos', producto(1, ids.ana, 'Tamales verdes', 2500, 10, '23:59')),
  insert('productos', producto(2, ids.ana, 'Galletas de avena', 1500, 12, '23:59')),
  insert('productos', producto(3, ids.beto, 'Calculadora científica (usada)', 35000, 1, '23:59')),
  insert('productos', producto(4, ids.beto, 'Agua de jamaica 1 L', 2000, 8, '23:58')),
  // No deben aparecer en /productos/hoy: uno ya cerró y otro es de ayer.
  insert('productos', producto(5, ids.beto, 'Molletes (cerrado)', 3000, 5, '00:00')),
  insert('productos', producto(6, ids.ana, 'Pan de ayer', 1000, 4, '23:59', ayer)),
].join('\n')

mkdirSync('.wrangler', { recursive: true })
writeFileSync('.wrangler/seed.sql', sql)
execFileSync('wrangler', ['d1', 'execute', 'DB', '--local', '--file', '.wrangler/seed.sql'], {
  stdio: 'inherit',
})
console.log(
  '\nSeed listo. Admin: admin@shopsito.test / admin1234 · Usuarios: ana|beto@shopsito.test / shopsito123',
)
