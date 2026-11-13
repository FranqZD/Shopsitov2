import { ShoppingBag } from 'lucide-react'

/** Foto con object-fit: cover; si no hay foto, un placeholder suave en azul-50. */
export function FotoProducto({
  url,
  alt = '',
  className = '',
  gris = false,
}: {
  url: string | null
  alt?: string
  className?: string
  gris?: boolean
}) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-azul-50 text-azul/50 ${className}`}>
        <ShoppingBag size={32} strokeWidth={1.8} aria-hidden="true" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      className={`block object-cover ${className}`}
      style={gris ? { filter: 'grayscale(0.85) opacity(0.8)' } : undefined}
    />
  )
}
