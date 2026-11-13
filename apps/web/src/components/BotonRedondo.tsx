import type { ReactNode } from 'react'
import { Link } from 'react-router'

const CLASES =
  'flex size-[46px] flex-none items-center justify-center rounded-full bg-tarjeta text-tinta shadow-tarjeta transition active:scale-95'

/** Botón de icono redondo de 46 px (regresar, compartir, cerrar). */
export function BotonRedondo({
  to,
  onClick,
  label,
  children,
}: {
  to?: string
  onClick?: () => void
  label: string
  children: ReactNode
}) {
  if (to) {
    return (
      <Link to={to} aria-label={label} className={CLASES}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={CLASES}>
      {children}
    </button>
  )
}
