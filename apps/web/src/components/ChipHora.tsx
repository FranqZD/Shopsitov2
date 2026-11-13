import { Clock } from 'lucide-react'
import { formatoCuenta } from '../lib/formato'

/** Una publicación es urgente cuando faltan ≤ 30 min (DESIGN.md §6). */
export const SEGUNDOS_URGENTE = 1800

/** Chip blanco "Hasta 10:30" (colores fijos: va sobre la foto en ambos temas). */
export function ChipHasta({ hora, apagado = false }: { hora: string; apagado?: boolean }) {
  return (
    <span
      className={`inline-flex h-[26px] items-center gap-1 rounded-full bg-white/95 pr-[9px] pl-[7px] text-xs font-semibold text-[#1F3A68] tabular-nums ${apagado ? 'opacity-70' : ''}`}
    >
      <Clock size={13} strokeWidth={2.2} aria-hidden="true" />
      Hasta {hora}
    </span>
  )
}

/** Chip mango "Faltan 17:42" con punto que pulsa. */
export function ChipFaltan({ segundos }: { segundos: number }) {
  return (
    <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-mango pr-2.5 pl-2 text-xs font-bold text-sobre-mango tabular-nums shadow-[0_4px_12px_rgb(122_74_0/0.18)]">
      <span className="size-[7px] animate-pulso rounded-full bg-sobre-mango" />
      Faltan {formatoCuenta(segundos)}
    </span>
  )
}
