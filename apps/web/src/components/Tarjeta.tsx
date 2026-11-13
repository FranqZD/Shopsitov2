import { Link } from 'react-router'
import { formatoPrecio } from '../lib/formato'
import { Avatar } from './Avatar'
import { ChipFaltan, ChipHasta, SEGUNDOS_URGENTE } from './ChipHora'
import { FotoProducto } from './FotoProducto'
import { InsigniaMini } from './Insignia'
import { PastillaCantidad } from './PastillaEstado'

export type DatosTarjeta = {
  id: string
  nombre: string
  precio: number
  cantidad: number
  horaLimite: string
  fotoUrl: string | null
  agotado?: boolean
  vendedor: { id: string; nombre: string; insigniaComunidad: boolean }
}

/** Tarjeta de producto del catálogo: la foto es la protagonista (DESIGN.md §5). */
export function Tarjeta({ p, segundos }: { p: DatosTarjeta; segundos: number }) {
  const agotado = p.agotado || p.cantidad === 0
  const urgente = !agotado && segundos <= SEGUNDOS_URGENTE
  const vendedorCorto = p.vendedor.nombre.split(' ')[0]
  return (
    <Link
      to={`/producto/${p.id}`}
      aria-label={`${p.nombre}, ${formatoPrecio(p.precio)}, ${agotado ? 'agotado' : `hasta las ${p.horaLimite}`}`}
      className="flex w-full flex-col rounded-tarjeta bg-tarjeta px-1.5 pt-1.5 pb-3 text-tinta shadow-tarjeta transition active:scale-[.98]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[15px] bg-azul-50">
        <FotoProducto url={p.fotoUrl} className="size-full" gris={agotado} />
        <span className="absolute top-2 left-2">
          <ChipHasta hora={p.horaLimite} apagado={agotado} />
        </span>
        {urgente && (
          <span className="absolute bottom-2 left-2">
            <ChipFaltan segundos={segundos} />
          </span>
        )}
        {agotado && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAF7]/45">
            <span className="inline-flex h-[30px] items-center rounded-full bg-[#1B2333] px-3.5 text-[13px] font-bold text-white">
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 px-1.5 pt-2.5">
        <div className="flex items-center justify-between gap-1.5">
          <span
            className={`num text-[22px] leading-none font-bold tracking-[-0.01em] ${agotado ? 'text-tinta-2' : 'text-tinta'}`}
          >
            {formatoPrecio(p.precio)}
          </span>
          <PastillaCantidad quedan={agotado ? 0 : p.cantidad} />
        </div>
        <span className="line-clamp-2 min-h-9 text-sm leading-[1.3] font-medium">{p.nombre}</span>
        <span className="flex items-center gap-1.5 text-[12.5px] text-tinta-2">
          <Avatar id={p.vendedor.id} nombre={p.vendedor.nombre} size={22} mini />
          <span className="truncate">{vendedorCorto}</span>
          {p.vendedor.insigniaComunidad && <InsigniaMini />}
        </span>
      </div>
    </Link>
  )
}
