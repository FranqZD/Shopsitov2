// Seed local: borra los datos y vuelve a insertar usuarios, puntos de entrega y productos de HOY.
// Los datos siguen los ejemplos del diseño y las horas límite se calculan
// relativas a "ahora" para que se vean los contadores de "Faltan 17:42" y "Se acaba pronto".
// Uso: pnpm db:seed (aplica sobre la D1 simulada en .wrangler/, nunca en la nube).
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { ahoraCampus, type CategoriaProducto } from '@shopsito/shared'
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
  categoria: CategoriaProducto
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
    categoria: 'bebidas',
    foto: 'cafe',
    cierraEn: 18,
    descripcion: 'Con canela y piloncillo, recién hecho. Vaso de 12 oz con tapa.',
  },
  {
    vendedor: 'diego',
    nombre: 'Chilaquiles verdes en vaso',
    precio: 4500,
    cantidad: 2,
    categoria: 'comida',
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
    categoria: 'comida',
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
    categoria: 'bebidas',
    foto: 'tejuino',
    cierraEn: 108,
  },
  {
    vendedor: 'paola',
    nombre: 'Conchas de vainilla',
    precio: 1500,
    cantidad: 0,
    categoria: 'snacks',
    foto: 'conchas',
    cierraEn: 108,
    descripcion: 'Conchas de vainilla de la panadería de mi tía, horneadas hoy en la mañana.',
  },
  {
    vendedor: 'andrea',
    nombre: 'Galletas de avena y chocolate (paquete de 3)',
    precio: 2500,
    cantidad: 7,
    categoria: 'snacks',
    foto: 'galletas',
    cierraEn: 198,
  },
  {
    vendedor: 'mariana',
    nombre: 'Agua de jamaica 1 L',
    precio: 2500,
    cantidad: 0,
    categoria: 'bebidas',
    foto: 'jamaica',
    cierraEn: 168,
  },
  {
    vendedor: 'sofia',
    nombre: 'Bata de laboratorio talla M',
    precio: 15000,
    cantidad: 1,
    categoria: 'articulos',
    foto: 'bata',
    cierraEn: 408,
  },
  {
    vendedor: 'luis',
    nombre: 'Calculadora Casio fx-991 usada',
    precio: 28000,
    cantidad: 1,
    categoria: 'utiles',
    foto: 'calculadora',
    cierraEn: 468,
  },
  // No deben aparecer en /productos/hoy: uno ya cerró y otro es de ayer.
  {
    vendedor: 'beto',
    nombre: 'Molletes (cerrado)',
    precio: 3000,
    cantidad: 5,
    categoria: 'comida',
    foto: 'molletes',
    cierraEn: 0,
    horaLimite: '00:00',
  },
  {
    vendedor: 'ana',
    nombre: 'Pan de ayer',
    precio: 1000,
    cantidad: 4,
    categoria: 'snacks',
    foto: 'conchas',
    cierraEn: 0,
    fecha: ayer,
    horaLimite: '23:59',
  },
]

const DIA_MS = 24 * 60 * 60 * 1000
const haceDias = (dias: number) => new Date(ahora.getTime() - dias * DIA_MS)

/** Días desde que se registró cada usuario (para "En Shopsito desde agosto"). */
const ALTA: Record<Clave, number> = {
  admin: 200,
  ana: 30,
  beto: 12,
  mariana: 95,
  diego: 70,
  fernanda: 120,
  jorge: 60,
  paola: 25,
  andrea: 45,
  sofia: 80,
  luis: 110,
}

// Historial de días pasados: cada fila es un producto agotado, su pedido entregado y,
// si trae estrellas, su reseña. Alimenta ventas y reseñas de los perfiles.
type Venta = {
  vendedor: Clave
  comprador: Clave
  producto: string
  categoria: CategoriaProducto
  foto: string
  precio: number
  diasAtras: number
  estrellas?: number
  comentario?: string
}

const HISTORIAL: Venta[] = [
  {
    vendedor: 'mariana',
    comprador: 'luis',
    producto: 'Molletes',
    categoria: 'comida',
    foto: 'molletes',
    precio: 3500,
    diasAtras: 1,
    estrellas: 5,
    comentario: 'Llegaron calientitos y el pico de gallo aparte fue buenísima idea.',
  },
  {
    vendedor: 'mariana',
    comprador: 'sofia',
    producto: 'Agua de jamaica 1 L',
    categoria: 'bebidas',
    foto: 'jamaica',
    precio: 2500,
    diasAtras: 3,
    estrellas: 5,
    comentario: 'Siempre puntual en la biblioteca. La jamaica no está empalagosa.',
  },
  {
    vendedor: 'mariana',
    comprador: 'diego',
    producto: 'Molletes',
    categoria: 'comida',
    foto: 'molletes',
    precio: 3500,
    diasAtras: 8,
    estrellas: 4,
    comentario: 'Ricos, pero ese día me tocó con poquito queso.',
  },
  {
    vendedor: 'mariana',
    comprador: 'ana',
    producto: 'Molletes',
    categoria: 'comida',
    foto: 'molletes',
    precio: 3500,
    diasAtras: 10,
    estrellas: 5,
  },
  {
    vendedor: 'mariana',
    comprador: 'jorge',
    producto: 'Agua de jamaica 1 L',
    categoria: 'bebidas',
    foto: 'jamaica',
    precio: 2500,
    diasAtras: 15,
    estrellas: 5,
    comentario: 'Bien fría, justo lo que necesitaba saliendo del lab.',
  },
  {
    vendedor: 'mariana',
    comprador: 'paola',
    producto: 'Molletes',
    categoria: 'comida',
    foto: 'molletes',
    precio: 3500,
    diasAtras: 22,
    estrellas: 3,
    comentario: 'Tardó un poco en aceptar, pero sí llegó.',
  },
  {
    vendedor: 'mariana',
    comprador: 'beto',
    producto: 'Molletes',
    categoria: 'comida',
    foto: 'molletes',
    precio: 3500,
    diasAtras: 30,
  },
  {
    vendedor: 'diego',
    comprador: 'mariana',
    producto: 'Chilaquiles verdes en vaso',
    categoria: 'comida',
    foto: 'chilaquiles',
    precio: 4500,
    diasAtras: 2,
    estrellas: 5,
    comentario: 'Pican poquito como dice, perfectos.',
  },
  {
    vendedor: 'diego',
    comprador: 'andrea',
    producto: 'Chilaquiles verdes en vaso',
    categoria: 'comida',
    foto: 'chilaquiles',
    precio: 4500,
    diasAtras: 9,
    estrellas: 4,
  },
  {
    vendedor: 'fernanda',
    comprador: 'ana',
    producto: 'Café de olla 12 oz',
    categoria: 'bebidas',
    foto: 'cafe',
    precio: 2000,
    diasAtras: 4,
    estrellas: 5,
    comentario: 'El mejor café del campus, sin exagerar.',
  },
  {
    vendedor: 'fernanda',
    comprador: 'luis',
    producto: 'Café de olla 12 oz',
    categoria: 'bebidas',
    foto: 'cafe',
    precio: 2000,
    diasAtras: 11,
    estrellas: 5,
  },
  {
    vendedor: 'andrea',
    comprador: 'sofia',
    producto: 'Galletas de avena y chocolate (paquete de 3)',
    categoria: 'snacks',
    foto: 'galletas',
    precio: 2500,
    diasAtras: 6,
    estrellas: 4,
    comentario: 'Muy ricas, aunque un poco duras.',
  },
]

// Pedidos de HOY (para "Mis ventas" de Mariana). `producto` es el índice en PRODUCTOS;
// la cantidad de PRODUCTOS ya es lo que queda después de estos pedidos.
type PedidoHoy = {
  comprador: Clave
  producto: number
  cantidad: number
  punto: number
  estado: 'pendiente' | 'aceptado' | 'entregado'
  minutosAtras: number
}

const PEDIDOS_HOY: PedidoHoy[] = [
  { comprador: 'ana', producto: 2, cantidad: 2, punto: 0, estado: 'pendiente', minutosAtras: 1 },
  { comprador: 'luis', producto: 2, cantidad: 1, punto: 1, estado: 'aceptado', minutosAtras: 12 },
  { comprador: 'sofia', producto: 2, cantidad: 2, punto: 0, estado: 'entregado', minutosAtras: 35 },
  { comprador: 'jorge', producto: 6, cantidad: 3, punto: 0, estado: 'entregado', minutosAtras: 60 },
  {
    comprador: 'andrea',
    producto: 6,
    cantidad: 3,
    punto: 1,
    estado: 'entregado',
    minutosAtras: 85,
  },
]

// Reportes de ejemplo. `objetivo` es una clave de usuario o el índice de un producto de PRODUCTOS.
type ReporteSeed = {
  reportante: Clave
  objetivo: Clave | number
  motivo: string
  detalle: string
  horasAtras: number
  estado?: 'resuelto' | 'descartado'
  nota?: string
}

const REPORTES: ReporteSeed[] = [
  {
    reportante: 'fernanda',
    objetivo: 8,
    motivo: 'Precio sospechoso',
    detalle:
      'Dice que funciona perfecto pero el precio está muy por encima de lo normal para una usada.',
    horasAtras: 2,
  },
  {
    reportante: 'sofia',
    objetivo: 'diego',
    motivo: 'No llegó al punto de entrega',
    detalle:
      'Me aceptó el pedido, lo esperé 20 minutos en el Edificio T y nunca llegó ni contestó.',
    horasAtras: 20,
  },
  {
    reportante: 'andrea',
    objetivo: 'beto',
    motivo: 'Trato ofensivo',
    detalle: 'Me escribió de mala manera cuando le pregunté por el pedido.',
    horasAtras: 30,
  },
  {
    reportante: 'jorge',
    objetivo: 'mariana',
    motivo: 'Cobró más de lo anunciado',
    detalle: 'Decía $30 y me cobró $40 al entregar.',
    horasAtras: 24 * 11,
    estado: 'resuelto',
    nota: 'Se habló con la vendedora; corrigió el precio y devolvió la diferencia.',
  },
  {
    reportante: 'paola',
    objetivo: 'jorge',
    motivo: 'Reporte por error',
    detalle: 'Perdón, le di reportar sin querer.',
    horasAtras: 24 * 12,
    estado: 'descartado',
    nota: 'Lo pidió quien reportó.',
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
        creado_en: haceDias(ALTA[clave]).toISOString(),
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
      categoria: p.categoria,
      // Ilustraciones de ejemplo: el frontend las sirve desde /productos/<archivo>.svg.
      foto_key: `ejemplo/${p.foto}.svg`,
      fecha: p.fecha ?? hoy,
      hora_limite: p.horaLimite ?? enMinutos(p.cierraEn),
      estado: p.cantidad === 0 ? 'agotado' : 'disponible',
    }),
  ),
  ...HISTORIAL.flatMap((v, i) => {
    const dia = haceDias(v.diasAtras)
    const [productoId, pedidoId] = [id(301 + i), id(401 + i)]
    return [
      insert('productos', {
        id: productoId,
        vendedor_id: uid[v.vendedor],
        nombre: v.producto,
        descripcion: '',
        precio: v.precio,
        cantidad: 0,
        categoria: v.categoria,
        foto_key: `ejemplo/${v.foto}.svg`,
        fecha: ahoraCampus(dia).fecha,
        hora_limite: '14:00',
        estado: 'agotado',
      }),
      insert('pedidos', {
        id: pedidoId,
        comprador_id: uid[v.comprador],
        vendedor_id: uid[v.vendedor],
        punto_entrega_id: id(101 + (i % 3)),
        estado: 'entregado',
        total: v.precio,
        creado_en: dia.toISOString(),
      }),
      insert('detalle_pedido', {
        id: id(501 + i),
        pedido_id: pedidoId,
        producto_id: productoId,
        cantidad: 1,
        precio_unitario: v.precio,
      }),
      ...(v.estrellas
        ? [
            insert('calificaciones', {
              id: id(601 + i),
              pedido_id: pedidoId,
              estrellas: v.estrellas,
              comentario: v.comentario ?? null,
              fecha: dia.toISOString(),
            }),
          ]
        : []),
    ]
  }),
  ...PEDIDOS_HOY.flatMap((p, i) => {
    const producto = PRODUCTOS[p.producto]!
    const pedidoId = id(801 + i)
    return [
      insert('pedidos', {
        id: pedidoId,
        comprador_id: uid[p.comprador],
        vendedor_id: uid[producto.vendedor],
        punto_entrega_id: id(101 + p.punto),
        estado: p.estado,
        total: producto.precio * p.cantidad,
        creado_en: new Date(ahora.getTime() - p.minutosAtras * 60 * 1000).toISOString(),
      }),
      insert('detalle_pedido', {
        id: id(851 + i),
        pedido_id: pedidoId,
        producto_id: id(201 + p.producto),
        cantidad: p.cantidad,
        precio_unitario: producto.precio,
      }),
    ]
  }),
  ...REPORTES.map((r, i) =>
    insert('reportes', {
      id: id(701 + i),
      reportante_id: uid[r.reportante],
      objetivo_id: typeof r.objetivo === 'number' ? id(201 + r.objetivo) : uid[r.objetivo],
      tipo_objetivo: typeof r.objetivo === 'number' ? 'producto' : 'usuario',
      motivo: r.motivo,
      detalle: r.detalle,
      estado: r.estado ?? 'abierto',
      nota: r.nota ?? null,
      creado_en: new Date(ahora.getTime() - r.horasAtras * 60 * 60 * 1000).toISOString(),
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
