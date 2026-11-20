import type { EstadoPedido } from '@shopsito/shared'

/** Pedidos que cuentan como venta: ya apartaron inventario y no se cancelaron. */
export const ESTADOS_VENTA = [
  'pendiente',
  'aceptado',
  'entregado',
] as const satisfies EstadoPedido[]

/**
 * Las horas son HH:MM del mismo día, así que comparar texto basta. Exigimos que la hora
 * límite sea posterior a la actual: si no, la publicación nunca aparecería en el catálogo.
 */
export const horaLimiteValida = (horaLimite: string, horaActual: string) => horaLimite > horaActual

/** Al cambiar la cantidad, el estado la sigue: con existencias vuelve a estar disponible. */
export const estadoSegunCantidad = (cantidad: number) =>
  cantidad > 0 ? ('disponible' as const) : ('agotado' as const)

export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'] as const
/** El frontend reduce la foto antes de subirla; esto es solo un tope de seguridad. */
export const MAX_FOTO_BYTES = 5 * 1024 * 1024

/** Mensaje para el usuario si la foto no sirve; null si está bien. */
export function problemaFoto(tipo: string, bytes: number): string | null {
  if (!(TIPOS_FOTO as readonly string[]).includes(tipo)) return 'La foto debe ser JPG, PNG o WebP.'
  if (bytes === 0) return 'La foto llegó vacía, vuelve a intentarlo.'
  if (bytes > MAX_FOTO_BYTES) return 'La foto pesa demasiado (máximo 5 MB).'
  return null
}

/** Solo las fotos subidas viven en R2; las `ejemplo/…` del seed las sirve el frontend. */
export const esFotoR2 = (key: string | null): key is string => !!key?.startsWith('productos/')
