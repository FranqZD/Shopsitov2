import type { ReactNode } from 'react'

/** Chip seleccionable en pastilla (categorías, horas, etiquetas). Alto 42 px. */
export function Chip({
  activo,
  onClick,
  icono,
  children,
  className = '',
}: {
  activo: boolean
  onClick: () => void
  icono?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex h-[42px] flex-none items-center gap-[7px] rounded-full text-sm font-semibold transition active:scale-95 ${icono ? 'pr-4 pl-[13px]' : 'px-4'} ${activo ? 'bg-azul text-sobre-azul' : 'bg-azul-50 text-azul'} ${className}`}
    >
      {icono}
      {children}
    </button>
  )
}
