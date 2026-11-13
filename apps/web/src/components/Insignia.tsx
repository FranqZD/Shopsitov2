import { BadgeCheck } from 'lucide-react'

/** Pastilla mango "Comunidad" (o el texto que se pase). */
export function Insignia({ texto = 'Comunidad' }: { texto?: string }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-mango pr-2.5 pl-1.5 text-xs font-bold text-sobre-mango">
      <BadgeCheck size={15} strokeWidth={2.2} aria-hidden="true" />
      {texto}
    </span>
  )
}

/** Versión mini junto al nombre: badge mango con palomita oscura. */
export function InsigniaMini({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Miembro de la comunidad"
      className="flex-none"
    >
      <path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        fill="#FFB547"
      />
      <path
        d="m9 12 2 2 4-4"
        fill="none"
        stroke="#1B2333"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SinVerificar() {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-gris-50 px-2.5 text-xs font-semibold text-tinta-2">
      Sin verificar
    </span>
  )
}
