import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

const VARIANTES = {
  principal: 'bg-azul text-sobre-azul',
  suave: 'bg-azul-50 text-azul',
  gris: 'bg-gris-50 text-tinta',
  verde: 'bg-verde text-sobre-verde',
  mango: 'bg-mango text-sobre-mango',
  'mango-suave': 'bg-mango-50 text-mango-tinta',
  peligro: 'bg-error-50 text-error',
}
const TAMANOS = {
  lg: 'h-14 px-6 text-[16.5px]',
  md: 'h-[52px] px-5 text-[15.5px]',
  sm: 'h-11 px-4 text-[14.5px]',
}

type Props = {
  variante?: keyof typeof VARIANTES
  tamano?: keyof typeof TAMANOS
  to?: string
  className?: string
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

/** Botón en pastilla. Con `to` se renderiza como enlace. Mínimo 44 px de alto. */
export function Boton({
  variante = 'principal',
  tamano = 'lg',
  to,
  className = '',
  children,
  ...props
}: Props) {
  const clases = `inline-flex items-center justify-center gap-2 rounded-full font-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:bg-gris-50 disabled:text-tinta-2 ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`
  if (to) {
    return (
      <Link to={to} className={clases}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className={clases} {...props}>
      {children}
    </button>
  )
}
