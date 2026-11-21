export const ROLES = ['usuario', 'admin'] as const
export type Rol = (typeof ROLES)[number]

export const TIPOS_CODIGO = ['registro', 'institucional'] as const
export type TipoCodigo = (typeof TIPOS_CODIGO)[number]

// `oculto`: lo sacó del catálogo un admin; el vendedor no lo puede volver a mostrar.
export const ESTADOS_PRODUCTO = ['disponible', 'agotado', 'oculto'] as const
export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[number]

export const CATEGORIAS_PRODUCTO = ['comida', 'bebidas', 'snacks', 'articulos', 'utiles'] as const
export type CategoriaProducto = (typeof CATEGORIAS_PRODUCTO)[number]

export const ESTADOS_PEDIDO = [
  'pendiente',
  'aceptado',
  'rechazado',
  'entregado',
  'cancelado',
] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]

export const ESTADOS_REPORTE = ['abierto', 'resuelto', 'descartado'] as const
export type EstadoReporte = (typeof ESTADOS_REPORTE)[number]

export const TIPOS_OBJETIVO_REPORTE = ['usuario', 'producto'] as const
export type TipoObjetivoReporte = (typeof TIPOS_OBJETIVO_REPORTE)[number]
