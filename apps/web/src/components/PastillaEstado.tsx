import type { EstadoPedido, EstadoReporte } from '@shopsito/shared'

const PEDIDO: Record<EstadoPedido, { texto: string; clases: string }> = {
  pendiente: { texto: 'Pendiente', clases: 'bg-mango-50 text-mango-tinta' },
  aceptado: { texto: 'Aceptado', clases: 'bg-verde-50 text-verde' },
  entregado: { texto: 'Entregado', clases: 'bg-verde text-sobre-verde' },
  rechazado: { texto: 'Rechazado', clases: 'bg-error-50 text-error' },
  cancelado: { texto: 'Cancelado', clases: 'bg-gris-50 text-tinta-2' },
}

const REPORTE: Record<EstadoReporte, { texto: string; clases: string }> = {
  abierto: { texto: 'Abierto', clases: 'bg-mango-50 text-mango-tinta' },
  resuelto: { texto: 'Resuelto', clases: 'bg-verde-50 text-verde' },
  descartado: { texto: 'Descartado', clases: 'bg-gris-50 text-tinta-2' },
}

/** Pastilla de estado de pedido; "Pendiente" lleva punto pulsante. */
export function PastillaEstado({ estado }: { estado: EstadoPedido }) {
  const { texto, clases } = PEDIDO[estado]
  return (
    <span
      className={`inline-flex h-6 flex-none items-center gap-1.5 rounded-full px-2.5 text-xs font-bold ${clases}`}
    >
      {estado === 'pendiente' && <span className="size-1.5 animate-pulso rounded-full bg-mango" />}
      {texto}
    </span>
  )
}

export function PastillaReporte({ estado }: { estado: EstadoReporte }) {
  const { texto, clases } = REPORTE[estado]
  return (
    <span
      className={`inline-flex h-7 flex-none items-center rounded-full px-3 text-[13px] font-bold ${clases}`}
    >
      {texto}
    </span>
  )
}

/** "Quedan 3" / "Queda 1" / "Se acabó". Mango si quedan ≤ 2. */
export function PastillaCantidad({ quedan }: { quedan: number }) {
  const clases =
    quedan === 0
      ? 'bg-gris-50 text-tinta-2'
      : quedan <= 2
        ? 'bg-mango-50 text-mango-tinta'
        : 'bg-azul-50 text-azul'
  const texto = quedan === 0 ? 'Se acabó' : quedan === 1 ? 'Queda 1' : `Quedan ${quedan}`
  return (
    <span
      className={`inline-flex h-[22px] flex-none items-center rounded-full px-2 text-[11.5px] font-bold ${clases}`}
    >
      {texto}
    </span>
  )
}
