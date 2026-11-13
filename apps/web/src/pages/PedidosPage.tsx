import { useState } from 'react'
import { Link } from 'react-router'
import { Star } from 'lucide-react'
import { PastillaEstado } from '../components/PastillaEstado'
import { ACTIVOS, PEDIDOS } from '../lib/ejemplos'
import { formatoPrecio, nombreCorto } from '../lib/formato'

// TODO: reemplazar los datos de ejemplo por GET /api/pedidos/compras.
export function PedidosPage() {
  const [pestana, setPestana] = useState<'activos' | 'anteriores'>('activos')
  const activos = PEDIDOS.filter((p) => ACTIVOS.includes(p.estado))
  const lista = pestana === 'activos' ? activos : PEDIDOS.filter((p) => !ACTIVOS.includes(p.estado))

  const tab = (id: typeof pestana, texto: string) => (
    <button
      role="tab"
      aria-selected={pestana === id}
      onClick={() => setPestana(id)}
      className={`h-[42px] rounded-full text-[14.5px] font-bold text-azul ${pestana === id ? 'bg-tarjeta shadow-[0_1px_3px_rgb(27_35_51/0.1)]' : ''}`}
    >
      {texto}
    </button>
  )

  return (
    <main className="flex flex-col px-5 pt-5">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.015em] text-azul">
        Mis pedidos
      </h1>
      <div
        role="tablist"
        aria-label="Pedidos"
        className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-azul-50 p-1"
      >
        {tab('activos', `Activos · ${activos.length}`)}
        {tab('anteriores', 'Anteriores')}
      </div>

      <div className="mt-[18px] flex flex-col gap-3">
        {lista.map((o) => {
          const apagado = o.estado === 'rechazado' || o.estado === 'cancelado'
          return (
            <div
              key={o.id}
              className="flex flex-col gap-3 rounded-[22px] bg-tarjeta p-3 shadow-tarjeta"
            >
              <Link to={`/pedidos/${o.id}`} className="flex items-center gap-3 text-tinta">
                <img
                  src={o.foto}
                  alt=""
                  className="size-16 flex-none rounded-chico object-cover"
                  style={apagado ? { filter: 'grayscale(0.6)' } : undefined}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15px] font-bold">{o.producto}</span>
                    <span className="flex-none num text-[17px] font-bold">
                      {formatoPrecio(o.precio * o.cantidad)}
                    </span>
                  </span>
                  <span className="text-[13px] text-tinta-2">
                    {o.cantidad} × {formatoPrecio(o.precio)} · {o.vendedor.nombre}
                  </span>
                  <span className="flex items-center gap-2">
                    <PastillaEstado estado={o.estado} />
                    <span className="truncate text-[12.5px] text-tinta-2">{o.nota}</span>
                  </span>
                </span>
              </Link>
              {o.estado === 'entregado' && (
                <Link
                  to={`/calificar/${o.id}`}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-mango-50 text-[14.5px] font-bold text-mango-tinta"
                >
                  <Star size={17} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                  Calificar a {nombreCorto(o.vendedor.nombre)}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {pestana === 'activos' && (
        <p className="mx-1.5 mt-[18px] text-center text-[13.5px] leading-normal text-tinta-2">
          Te avisamos cuando cambie el estado de tus pedidos.
        </p>
      )}
    </main>
  )
}
