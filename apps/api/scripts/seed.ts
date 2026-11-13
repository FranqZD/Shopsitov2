// Seed local: borra los datos y vuelve a insertar usuarios, puntos de entrega y productos de HOY.
// Los datos siguen los ejemplos del diseño y las horas límite se calculan
// relativas a "ahora" para que se vean los contadores de "Faltan 17:42" y "Se acaba pronto".
// Uso: pnpm db:seed (aplica sobre la D1 simulada en .wrangler/, nunca en la nube).
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { ahoraCampus } from '@shopsito/shared'
import { hashPassword } from '../src/lib/password'

type Valor = string | number | boolean | null

const q = (v: Valor) =>
  v === null
    ? 'NULL'
    : typeof v === 'string'
      ? `'${v.replaceAll("'", "''")}'`
      : typeof v === 'boolean'
        ? v
          ? 1
          : 0
        : v

const insert = (tabla: string, fila: Record<string, Valor>) =>
  `INSERT INTO ${tabla} (${Object.keys(fila).join(', ')}) VALUES (${Object.values(fila).map(q).join(', ')});`

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const ahora = new Date()
const { fecha: hoy, hora: horaActual } = ahoraCampus(ahora)
const { fecha: ayer } = ahoraCampus(new Date(ahora.getTime() - 24 * 60 * 60 * 1000))

/** HH:MM dentro de `min` minutos (hora del campus); nunca pasa de 23:59. */
function enMinutos(min: number) {
  const [h = 0, m = 0] = horaActual.split(':').map(Number)
  const total = Math.min(h * 60 + m + min, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// [clave, nombre, correo, insignia de comunidad, rol]
const USUARIOS = [
  ['admin', 'Luis Torres', 'admin@shopsito.test', false, 'admin'],
  ['ana', 'Ana Ramírez', 'ana@shopsito.test', true, 'usuario'],
  ['beto', 'Beto Ramírez', 'beto@shopsito.test', false, 'usuario'],
  ['mariana', 'Mariana López', 'mariana@shopsito.test', true, 'usuario'],
  ['diego', 'Diego Hernández', 'diego@shopsito.test', false, 'usuario'],
  ['fernanda', 'Fernanda Ruiz', 'fernanda@shopsito.test', true, 'usuario'],
  ['jorge', 'Jorge Castillo', 'jorge@shopsito.test', true, 'usuario'],
  ['paola', 'Paola Medina', 'paola@shopsito.test', false, 'usuario'],
  ['andrea', 'Andrea Gutiérrez', 'andrea@shopsito.test', true, 'usuario'],
  ['sofia', 'Sofía Navarro', 'sofia@shopsito.test', true, 'usuario'],
  ['luis', 'Luis Ángel Torres', 'luis@shopsito.test', true, 'usuario'],
] as const
type Clave = (typeof USUARIOS)[number][0]
const uid = Object.fromEntries(USUARIOS.map(([clave], i) => [clave, id(i + 1)])) as Record<
  Clave,
  string
>

const PUNTOS = [
  ['Biblioteca, entrada principal', 'Junto a los torniquetes, del lado de afuera.', true],
  ['Edificio T, planta baja', 'Frente a las escaleras, al lado de los casilleros.', true],
  ['Cafetería central, mesas exteriores', 'Las mesas bajo la lona, cerca de los microondas.', true],
  ['Edificio D, explanada', 'Cerrado por obra hasta diciembre.', false],
] as const

type Producto = {
  vendedor: Clave
  nombre: string
  descripcion?: string
  precio: number
  cantidad: number
  foto: string
  /** Minutos desde ahora hasta la hora límite. */
  cierraEn: number
  fecha?: string
  horaLimite?: string
}

const PRODUCTOS: Producto[] = [
  {
    vendedor: 'fernanda',
    nombre: 'Café de olla 12 oz',
    precio: 2000,
    cantidad: 3,
    foto: 'cafe',
    cierraEn: 18,
    descripcion: 'Con canela y piloncillo, recién hecho. Vaso de 12 oz con tapa.',
  },
  {
    vendedor: 'diego',
    nombre: 'Chilaquiles verdes en vaso',
    precio: 4500,
    cantidad: 2,
    foto: 'chilaquiles',
    cierraEn: 28,
    descripcion:
      'Verdes, con crema, queso fresco y cebolla. En vaso de 16 oz con tenedor, para comer caminando. Pican poquito.',
  },
  {
    vendedor: 'mariana',
    nombre: 'Molletes con pico de gallo',
    precio: 3500,
    cantidad: 4,
    foto: 'molletes',
    cierraEn: 48,
    descripcion:
      'Bolillo con frijoles refritos y queso gratinado. El pico de gallo va aparte para que no se aguade. Son 2 piezas por orden.',
  },
  {
    vendedor: 'jorge',
    nombre: 'Tejuino con nieve de limón 500 ml',
    precio: 3000,
    cantidad: 6,
    foto: 'tejuino',
    cierraEn: 108,
  },
  {
    vendedor: 'paola',
    nombre: 'Conchas de vainilla',
    precio: 1500,
    cantidad: 0,
    foto: 'conchas',
    cierraEn: 108,
    descripcion: 'Conchas de vainilla de la panadería de mi tía, horneadas hoy en la mañana.',
  },
  {
    vendedor: 'andrea',
    nombre: 'Galletas de avena y chocolate (paquete de 3)',
    precio: 2500,
    cantidad: 7,
    foto: 'galletas',
    cierraEn: 198,
  },
  {
    vendedor: 'mariana',
    nombre: 'Agua de jamaica 1 L',
    precio: 2500,
    cantidad: 0,
    foto: 'jamaica',
    cierraEn: 168,
  },
  {
    vendedor: 'sofia',
    nombre: 'Bata de laboratorio talla M',
    precio: 15000,
    cantidad: 1,
    foto: 'bata',
    cierraEn: 408,
  },
  {
    vendedor: 'luis',
    nombre: 'Calculadora Casio fx-991 usada',
    precio: 28000,
    cantidad: 1,
    foto: 'calculadora',
    cierraEn: 468,
  },
  // No deben aparecer en /productos/hoy: uno ya cerró y otro es de ayer.
  {
    vendedor: 'beto',
    nombre: 'Molletes (cerrado)',
    precio: 3000,
    cantidad: 5,
    foto: 'molletes',
    cierraEn: 0,
    horaLimite: '00:00',
  },
  {
    vendedor: 'ana',
    nombre: 'Pan de ayer',
    precio: 1000,
    cantidad: 4,
    foto: 'conchas',
    cierraEn: 0,
    fecha: ayer,
    horaLimite: '23:59',
  },
]

const BORRAR = [
  'calificaciones',
  'detalle_pedido',
  'pedidos',
  'notificaciones',
  'reportes',
  'codigos_verificacion',
  'productos',
  'puntos_entrega',
  'usuarios',
]

const sql = [
  // Orden inverso a las llaves foráneas.
  ...BORRAR.map((t) => `DELETE FROM ${t};`),
  ...(await Promise.all(
    USUARIOS.map(async ([clave, nombre, correo, insignia, rol]) =>
      insert('usuarios', {
        id: uid[clave],
        nombre,
        correo,
        password_hash: await hashPassword(rol === 'admin' ? 'admin1234' : 'shopsito123'),
        telefono: null,
        rol,
        correo_verificado: true,
        correo_institucional: insignia
          ? correo.replace('@shopsito.test', '@universidad.edu.mx')
          : null,
        insignia_comunidad: insignia,
        activo: true,
        creado_en: ahora.toISOString(),
      }),
    ),
  )),
  ...PUNTOS.map(([nombre, ubicacion, activo], i) =>
    insert('puntos_entrega', { id: id(101 + i), nombre, ubicacion, activo }),
  ),
  ...PRODUCTOS.map((p, i) =>
    insert('productos', {
      id: id(201 + i),
      vendedor_id: uid[p.vendedor],
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      cantidad: p.cantidad,
      // Ilustraciones de ejemplo: el frontend las sirve desde /productos/<archivo>.svg.
      foto_key: `ejemplo/${p.foto}.svg`,
      fecha: p.fecha ?? hoy,
      hora_limite: p.horaLimite ?? enMinutos(p.cierraEn),
      estado: p.cantidad === 0 ? 'agotado' : 'disponible',
    }),
  ),
].join('\n')

mkdirSync('.wrangler', { recursive: true })
writeFileSync('.wrangler/seed.sql', sql)
execFileSync('wrangler', ['d1', 'execute', 'DB', '--local', '--file', '.wrangler/seed.sql'], {
  stdio: 'inherit',
})
console.log(
  '\nSeed listo. Admin: admin@shopsito.test / admin1234 · Usuarios: ana|beto|mariana|…@shopsito.test / shopsito123',
)
