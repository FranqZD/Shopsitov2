import type { ReactNode } from 'react'

/** Clases de input: fondo tarjeta, r18, borde azul-100 de 1.5 px y anillo azul al enfocar. */
export const CLASE_INPUT =
  'w-full rounded-[18px] border-[1.5px] border-azul-100 bg-tarjeta px-[18px] text-base text-tinta outline-none placeholder:text-tinta-2/70 focus:border-azul focus:ring-2 focus:ring-azul/30'

export function Etiqueta({
  htmlFor,
  children,
  extra,
}: {
  htmlFor?: string
  children: ReactNode
  extra?: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-bold">
      <span>{children}</span>
      {extra && <span className="text-[13.5px] font-medium text-tinta-2">{extra}</span>}
    </label>
  )
}
