import { useState } from 'react'
import { Link } from 'react-router'
import { RefreshCw, Star } from 'lucide-react'
import { Boton } from '../components/Boton'
import { FotoProducto } from '../components/FotoProducto'
import { PastillaEstado } from '../components/PastillaEstado'
import { formatoPrecio, nombreCorto } from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import {
  ESTADOS_ACTIVOS,
  estadoVigente,
  notaPedido,
  subtituloPedido,
  tituloPedido,
} from '../lib/pedidos'
import { useAhora } from '../lib/useAhora'
import { useCompras } from '../lib/useCompras'

export function PedidosPage() {
  const [pestana, setPestana] = useState<'activos' | 'anteriores'>('activos')
  const { estado, recargar } = useCompras()
  const ahora = useAhora(30_000)

  const pedidos = (estado.tipo === 'listo' ? estado.pedidos : []).map((p) => ({
    p,
    vigente: estadoVigente(p, ahora),
  }))
  const activos = pedidos.filter((x) => ESTADOS_ACTIVOS.includes(x.vigente))
  const lista = pestana === 'activos' ? activos : pedidos.filter((x) => !activos.includes(x))

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
    <main className="flex flex-col px-5 pt-5 md:mx-auto md:max-w-4xl">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.015em] text-azul">
        Mis pedidos
      </h1>
      <div
        role="tablist"
        aria-label="Pedidos"
        className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-azul-50 p-1 md:max-w-sm"
      >
        {tab('activos', `Activos · ${activos.length}`)}
        {tab('anteriores', 'Anteriores')}
      </div>

      {estado.tipo === 'cargando' && (
        <div aria-busy="true" className="mt-[18px] flex flex-col gap-3 lg:grid lg:grid-cols-2">
          <span className="sr-only">Cargando</span>
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-[98px] skeleton rounded-[22px]" />
          ))}
        </div>
      )}

      {estado.tipo === 'error' && (
        <div
          role="alert"
          className="mt-[18px] flex flex-col items-center gap-3 rounded-grande bg-tarjeta px-6 py-7 text-center shadow-tarjeta"
        >
          <h2 className="font-display text-[21px] font-bold">No se pudieron cargar</h2>
          <p className="text-[15px] text-tinta-2">{estado.mensaje}</p>
          <Boton variante="suave" tamano="md" onClick={recargar}>
            <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
            Reintentar
          </Boton>
        </div>
      )}

      {estado.tipo === 'listo' && lista.length === 0 && (
        <div className="mt-[18px] flex flex-col items-center gap-3 rounded-grande bg-tarjeta px-6 py-7 text-center shadow-tarjeta">
          <p className="text-[15px] leading-normal text-tinta-2">
            {pestana === 'activos'
              ? 'No tienes pedidos en curso. Mira qué hay hoy y aparta lo que se te antoje.'
              : 'Aquí van tus pedidos entregados, rechazados o cancelados.'}
          </p>
          {pestana === 'activos' && (
            <Boton to="/" tamano="md">
              Ver qué hay hoy
            </Boton>
          )}
        </div>
      )}

      <div className="mt-[18px] flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start">
        {lista.map(({ p, vigente }) => {
          const apagado = vigente === 'rechazado' || vigente === 'cancelado'
          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-[22px] bg-tarjeta p-3 shadow-tarjeta"
            >
              <Link to={`/pedidos/${p.id}`} className="flex items-center gap-3 text-tinta">
                <FotoProducto
                  url={urlFoto(p.items[0]?.fotoKey ?? null)}
                  gris={apagado}
                  className="size-16 flex-none rounded-chico"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15px] font-bold">{tituloPedido(p.items)}</span>
                    <span className="flex-none num text-[17px] font-bold">
                      {formatoPrecio(p.total)}
                    </span>
                  </span>
                  <span className="text-[13px] text-tinta-2">{subtituloPedido(p)}</span>
                  <span className="flex items-center gap-2">
                    <PastillaEstado estado={vigente} />
                    <span className="truncate text-[12.5px] text-tinta-2">
                      {notaPedido(p, vigente)}
                    </span>
                  </span>
                </span>
              </Link>
              {vigente === 'entregado' && (
                <Link
                  to={`/calificar/${p.id}`}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-mango-50 text-[14.5px] font-bold text-mango-tinta"
                >
                  <Star size={17} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                  Calificar a {nombreCorto(p.vendedor.nombre)}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {pestana === 'activos' && activos.length > 0 && (
        <p className="mx-1.5 mt-[18px] text-center text-[13.5px] leading-normal text-tinta-2">
          Te avisamos cuando cambie el estado de tus pedidos.
        </p>
      )}
    </main>
  )
}
