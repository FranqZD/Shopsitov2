import { colorAvatar, iniciales } from '../lib/formato'

/** Círculo con iniciales en Gabarito sobre un pastel estable por usuario. */
/** `mini` (22 px en tarjetas) usa Figtree y texto #1B2333, como en el diseño. */
export function Avatar({
  id,
  nombre,
  size = 34,
  mini = false,
}: {
  id: string
  nombre: string
  size?: number
  mini?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex flex-none items-center justify-center rounded-full font-bold ${mini ? 'font-sans text-[#1B2333]' : 'font-display text-[#1F3A68]'}`}
      style={{
        width: size,
        height: size,
        background: colorAvatar(id),
        fontSize: mini ? 9.5 : Math.round(size * 0.37),
      }}
    >
      {iniciales(nombre)}
    </span>
  )
}
