// Datos de ejemplo del diseño para las pantallas
// cuya API todavía responde 501. Cada uso tiene un TODO para cambiarlo por la API real.
import type { EstadoPedido, EstadoReporte } from '@shopsito/shared'

const foto = (n: string) => `/productos/${n}.svg`

export type PasoPedido = {
  titulo: string
  sub: string
  hora: string
  tipo: 'hecho' | 'actual' | 'mal' | 'falta'
}

export type PedidoEjemplo = {
  id: string
  estado: EstadoPedido
  producto: string
  /** Cómo se nombra al calificar: "¿Qué tal los molletes de Mariana?" */
  queTal: string
  foto: string
  cantidad: number
  precio: number
  vendedor: { id: string; nombre: string; insignia: boolean }
  punto: string
  puntoNota: string
  nota: string
  cuando: string
  titulo: string
  texto: string
  mensaje?: string
  /** Segundos que le quedan al vendedor para aceptar (solo pendiente). */
  segundosParaAceptar?: number
  pasos: PasoPedido[]
}

const mariana = { id: 'ejemplo-mariana', nombre: 'Mariana López', insignia: true }
const fernanda = { id: 'ejemplo-fernanda', nombre: 'Fernanda Ruiz', insignia: true }
const diego = { id: 'ejemplo-diego', nombre: 'Diego Hernández', insignia: false }
const andrea = { id: 'ejemplo-andrea', nombre: 'Andrea Gutiérrez', insignia: true }

// TODO: reemplazar por GET /api/pedidos/compras.
export const PEDIDOS: PedidoEjemplo[] = [
  {
    id: 'ejemplo-pendiente',
    estado: 'pendiente',
    producto: 'Molletes con pico de gallo',
    queTal: 'los molletes',
    foto: foto('molletes'),
    cantidad: 2,
    precio: 3500,
    vendedor: mariana,
    punto: 'Biblioteca, entrada principal',
    puntoNota: 'Junto a los torniquetes · antes de las 11:00',
    nota: 'Biblioteca, antes de 11:00',
    cuando: 'Hoy, 10:14',
    titulo: 'Esperando a Mariana',
    texto:
      'Le avisamos de tu pedido. Si no lo acepta antes de las 11:00, se cancela solo y no pagas nada.',
    segundosParaAceptar: 2760,
    pasos: [
      { titulo: 'Pedido enviado', sub: 'Apartaste 2 molletes.', hora: '10:14', tipo: 'hecho' },
      {
        titulo: 'Esperando que lo acepte',
        sub: 'Mariana ya recibió el aviso.',
        hora: '',
        tipo: 'actual',
      },
      { titulo: 'Entregado', sub: 'Cuando lo recojas en la biblioteca.', hora: '', tipo: 'falta' },
    ],
  },
  {
    id: 'ejemplo-aceptado',
    estado: 'aceptado',
    producto: 'Café de olla 12 oz',
    queTal: 'el café de olla',
    foto: foto('cafe'),
    cantidad: 1,
    precio: 2000,
    vendedor: fernanda,
    punto: 'Edificio T, planta baja',
    puntoNota: 'Frente a las escaleras · antes de las 10:30',
    nota: 'Edificio T, antes de 10:30',
    cuando: 'Hoy, 10:05',
    titulo: '¡Fernanda lo aceptó!',
    texto: 'Ya te está esperando. Pasa por tu café al Edificio T antes de las 10:30.',
    pasos: [
      { titulo: 'Pedido enviado', sub: 'Apartaste 1 café de olla.', hora: '10:05', tipo: 'hecho' },
      {
        titulo: 'Fernanda lo aceptó',
        sub: 'Te espera en el Edificio T.',
        hora: '10:07',
        tipo: 'hecho',
      },
      { titulo: 'Entregado', sub: 'Fernanda lo marca cuando te lo dé.', hora: '', tipo: 'actual' },
    ],
  },
  {
    id: 'ejemplo-entregado',
    estado: 'entregado',
    producto: 'Molletes con pico de gallo',
    queTal: 'los molletes',
    foto: foto('molletes'),
    cantidad: 1,
    precio: 3500,
    vendedor: mariana,
    punto: 'Biblioteca, entrada principal',
    puntoNota: 'Junto a los torniquetes · antes de las 11:00',
    nota: 'Ayer, 10:41',
    cuando: 'Ayer, 10:20',
    titulo: 'Entregado',
    texto:
      'Lo recibiste ayer a las 10:41. ¿Qué tal estuvo? Tu calificación ayuda a otros a decidir.',
    pasos: [
      {
        titulo: 'Pedido enviado',
        sub: 'Apartaste 1 orden de molletes.',
        hora: '10:20',
        tipo: 'hecho',
      },
      {
        titulo: 'Mariana lo aceptó',
        sub: 'Quedaron en la biblioteca.',
        hora: '10:23',
        tipo: 'hecho',
      },
      { titulo: 'Entregado', sub: 'Todo en orden.', hora: '10:41', tipo: 'hecho' },
    ],
  },
  {
    id: 'ejemplo-rechazado',
    estado: 'rechazado',
    producto: 'Chilaquiles verdes en vaso',
    queTal: 'los chilaquiles',
    foto: foto('chilaquiles'),
    cantidad: 1,
    precio: 4500,
    vendedor: diego,
    punto: 'Cafetería central, mesas exteriores',
    puntoNota: 'Las mesas bajo la lona',
    nota: 'Ayer · ya no tenía',
    cuando: 'Ayer, 8:52',
    titulo: 'Diego no pudo aceptarlo',
    texto: 'No pagas nada. Te dejó un mensaje:',
    mensaje: 'Ya se me acabaron, perdón. Mañana traigo más.',
    pasos: [
      {
        titulo: 'Pedido enviado',
        sub: 'Apartaste 1 vaso de chilaquiles.',
        hora: '8:52',
        tipo: 'hecho',
      },
      { titulo: 'Diego lo rechazó', sub: 'No se te cobró nada.', hora: '8:58', tipo: 'mal' },
    ],
  },
  {
    id: 'ejemplo-cancelado',
    estado: 'cancelado',
    producto: 'Galletas de avena y chocolate',
    queTal: 'las galletas',
    foto: foto('galletas'),
    cantidad: 1,
    precio: 2500,
    vendedor: andrea,
    punto: 'Edificio T, planta baja',
    puntoNota: 'Frente a las escaleras',
    nota: 'Lun 9 nov · lo cancelaste',
    cuando: 'Lun 9 nov, 12:10',
    titulo: 'Cancelado',
    texto: 'Cancelaste este pedido. No se te cobró nada.',
    pasos: [
      {
        titulo: 'Pedido enviado',
        sub: 'Apartaste 1 paquete de galletas.',
        hora: '12:10',
        tipo: 'hecho',
      },
      { titulo: 'Lo cancelaste', sub: 'No se te cobró nada.', hora: '12:16', tipo: 'mal' },
    ],
  },
]

export const ACTIVOS: EstadoPedido[] = ['pendiente', 'aceptado']

// TODO: reemplazar por GET /api/pedidos/ventas.
export const VENTAS = {
  nuevo: {
    comprador: 'Ana Ramírez',
    insignia: true,
    hace: 'Hace 1 min',
    producto: 'Molletes con pico de gallo',
    foto: foto('molletes'),
    cantidad: 2,
    total: 7000,
    punto: 'Biblioteca, entrada principal',
    nota: 'Sin cebolla en el pico de gallo, porfa.',
    segundosParaResponder: 2699,
  },
  porEntregar: [
    {
      id: 'luis',
      nombre: 'Luis Ángel Torres',
      que: '1 × Molletes',
      punto: 'Edificio T, PB',
      hasta: '11:00',
      total: 3500,
    },
  ],
  entregados: [
    { nombre: 'Sofía Navarro', que: '2 × Molletes', hora: '9:40', total: 7000 },
    { nombre: 'Jorge Castillo', que: '3 × Agua de jamaica', hora: '9:15', total: 7500 },
    { nombre: 'Andrea Gutiérrez', que: '3 × Agua de jamaica', hora: '8:50', total: 7500 },
  ],
}

// TODO: reemplazar por los productos del vendedor (GET /api/productos?vendedor=me) cuando exista.
export const MIS_PUBLICACIONES = [
  {
    id: 'pub-1',
    nombre: 'Molletes con pico de gallo',
    foto: foto('molletes'),
    precio: 3500,
    hasta: '11:00',
    quedan: 4,
    total: 12,
    vendidos: 8,
  },
  {
    id: 'pub-2',
    nombre: 'Agua de jamaica 1 L',
    foto: foto('jamaica'),
    precio: 2500,
    hasta: '13:00',
    quedan: 0,
    total: 6,
    vendidos: 6,
  },
]

export type TipoNotificacion = 'ok' | 'reloj' | 'bolsa' | 'x' | 'estrella' | 'insignia'

// TODO: reemplazar por GET /api/notificaciones.
export const NOTIFICACIONES: {
  titulo: string
  items: {
    id: string
    tipo: TipoNotificacion
    texto: string
    hora: string
    nueva: boolean
    href?: string
  }[]
}[] = [
  {
    titulo: 'Hoy',
    items: [
      {
        id: 'n1',
        tipo: 'ok',
        texto: 'Fernanda aceptó tu pedido de café de olla. Te espera en el Edificio T.',
        hora: '10:07',
        nueva: true,
        href: '/pedidos/ejemplo-aceptado',
      },
      {
        id: 'n2',
        tipo: 'bolsa',
        texto: 'Nuevo pedido de Ana: 2 × Molletes con pico de gallo.',
        hora: '10:14',
        nueva: true,
        href: '/ventas',
      },
      {
        id: 'n3',
        tipo: 'reloj',
        texto: 'Tus molletes se quitan a las 11:00. Te quedan 4.',
        hora: '10:30',
        nueva: true,
        href: '/vender',
      },
      {
        id: 'n4',
        tipo: 'estrella',
        texto: 'Luis te dejó 5 estrellas: “Llegaron calientitos”.',
        hora: '9:12',
        nueva: false,
      },
    ],
  },
  {
    titulo: 'Ayer',
    items: [
      {
        id: 'n5',
        tipo: 'estrella',
        texto: '¿Qué tal los molletes de Mariana? Califícala.',
        hora: '10:45',
        nueva: false,
        href: '/calificar/ejemplo-entregado',
      },
      {
        id: 'n6',
        tipo: 'x',
        texto: 'Diego no pudo aceptar tu pedido de chilaquiles. No pagas nada.',
        hora: '8:58',
        nueva: false,
        href: '/pedidos/ejemplo-rechazado',
      },
      {
        id: 'n7',
        tipo: 'insignia',
        texto: 'Verificaste tu correo. Ya tienes la insignia de comunidad.',
        hora: '8:30',
        nueva: false,
      },
    ],
  },
]

// TODO: reemplazar por GET /api/usuarios/:id y GET /api/calificaciones/vendedor/:id.
export const PERFIL = {
  desde: 'En Shopsito desde agosto · casi siempre en la biblioteca',
  rating: 4.8,
  totalResenas: 23,
  ventas: 112,
  tiempoAceptar: '~5 min',
  barras: [18, 4, 1, 0, 0],
  resenas: [
    {
      nombre: 'Luis Ángel T.',
      cuando: 'Hoy',
      que: 'Molletes',
      estrellas: 5,
      texto: 'Llegaron calientitos y el pico de gallo aparte fue buenísima idea.',
    },
    {
      nombre: 'Sofía N.',
      cuando: 'Hace 3 días',
      que: 'Agua de jamaica',
      estrellas: 5,
      texto: 'Siempre puntual en la biblioteca. La jamaica no está empalagosa.',
    },
    {
      nombre: 'Diego H.',
      cuando: 'La semana pasada',
      que: 'Molletes',
      estrellas: 4,
      texto: 'Ricos, pero ese día me tocó con poquito queso.',
    },
  ],
}

export type ReporteEjemplo = {
  id: string
  motivo: string
  sobre: string
  quien: string
  cuando: string
  texto: string
  estado: EstadoReporte
  esPublicacion?: boolean
  nota?: string
}

// TODO: reemplazar por GET /api/reportes (admin).
export const REPORTES: ReporteEjemplo[] = [
  {
    id: 'R-118',
    motivo: 'Parece producto falso',
    sobre: 'Publicación: Tenis Nike Air Force talla 26 · Kevin Morales',
    quien: 'Fernanda Ruiz',
    cuando: 'Hoy, 9:41',
    texto:
      'Dice que son originales a $450, pero la caja y la etiqueta se ven clonadas. No es la primera vez que los publica.',
    estado: 'abierto',
    esPublicacion: true,
  },
  {
    id: 'R-117',
    motivo: 'No llegó al punto de entrega',
    sobre: 'Usuario: Diego Hernández',
    quien: 'Sofía Navarro',
    cuando: 'Ayer, 13:05',
    texto: 'Me aceptó el pedido, lo esperé 20 minutos en el Edificio T y nunca llegó ni contestó.',
    estado: 'abierto',
  },
  {
    id: 'R-115',
    motivo: 'Comentario ofensivo en una reseña',
    sobre: 'Reseña de Pablo G. a Andrea Gutiérrez',
    quien: 'Andrea Gutiérrez',
    cuando: 'Ayer, 9:20',
    texto: 'La reseña no habla de las galletas, solo se burla de mí.',
    estado: 'abierto',
  },
  {
    id: 'R-112',
    motivo: 'Cobró más de lo anunciado',
    sobre: 'Publicación: Pastel de chocolate rebanada',
    quien: 'Jorge Castillo',
    cuando: 'Lun 9 nov',
    texto: 'Decía $30 y me cobró $40 al entregar.',
    estado: 'resuelto',
    nota: 'Se habló con la vendedora; corrigió el precio y devolvió la diferencia.',
  },
  {
    id: 'R-110',
    motivo: 'Reporte por error',
    sobre: 'Usuario: Jorge Castillo',
    quien: 'Paola Medina',
    cuando: 'Dom 8 nov',
    texto: 'Perdón, le di reportar sin querer.',
    estado: 'descartado',
    nota: 'Lo pidió quien reportó.',
  },
]
