import { useState } from 'react'
import { Flag } from 'lucide-react'
import type { EstadoReporte } from '@shopsito/shared'
import { Boton } from '../components/Boton'
import { PastillaReporte } from '../components/PastillaEstado'
import { REPORTES } from '../lib/ejemplos'

const PESTANAS: { id: EstadoReporte; texto: string }[] = [
  { id: 'abierto', texto: 'Abiertos' },
  { id: 'resuelto', texto: 'Resueltos' },
  { id: 'descartado', texto: 'Descartados' },
]

// TODO: GET /api/reportes y PATCH /api/reportes/:id; hoy los cambios solo viven en memoria.
export function AdminReportesPage() {
  const [estados, setEstados] = useState<Record<string, EstadoReporte>>({})
  const [pestana, setPestana] = useState<EstadoReporte>('abierto')
  const [selId, setSelId] = useState<string | null>(null)
  const reportes = REPORTES.map((r) => ({ ...r, estado: estados[r.id] ?? r.estado }))
  const lista = reportes.filter((r) => r.estado === pestana)
  const d = lista.find((r) => r.id === selId) ?? lista[0]

  const cambiar = (estado: EstadoReporte) => {
    if (!d) return
    setEstados((e) => ({ ...e, [d.id]: estado }))
    setSelId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-2">
        <h1 className="font-display text-[34px] font-bold tracking-[-0.02em] text-azul">
          Reportes
        </h1>
        <p className="text-base text-tinta-2">
          Lo que la comunidad marcó como raro. Quien reporta nunca se muestra a la persona
          reportada.
        </p>
      </div>

      <div role="tablist" aria-label="Estado de reportes" className="flex flex-wrap gap-2.5">
        {PESTANAS.map((t) => {
          const on = pestana === t.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setPestana(t.id)
                setSelId(null)
              }}
              className={`inline-flex h-11 items-center gap-2.5 rounded-full px-[18px] text-base font-bold ${on ? 'bg-azul text-sobre-azul' : 'bg-azul-50 text-azul'}`}
            >
              {t.texto}
              <span
                className={`flex size-[22px] items-center justify-center rounded-full text-xs font-extrabold ${on ? 'bg-mango text-[#1B2333]' : 'bg-tarjeta text-azul'}`}
              >
                {reportes.filter((r) => r.estado === t.id).length}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex flex-1 flex-col gap-2.5">
          {lista.length === 0 && (
            <div className="rounded-grande bg-tarjeta px-6 py-8 text-center text-tinta-2 shadow-tarjeta">
              Nada por aquí. Todo tranquilo en el campus.
            </div>
          )}
          {lista.map((r) => {
            const on = r.id === d?.id
            return (
              <button
                key={r.id}
                aria-pressed={on}
                onClick={() => setSelId(r.id)}
                className={`flex items-center gap-4 rounded-grande bg-tarjeta px-5 py-4 text-left outline-2 -outline-offset-2 ${on ? 'outline-azul' : 'shadow-tarjeta outline-transparent'}`}
              >
                <span
                  className={`flex size-10 flex-none items-center justify-center rounded-full ${r.estado === 'abierto' ? 'bg-mango-50 text-mango-tinta' : 'bg-gris-50 text-tinta-2'}`}
                >
                  <Flag size={19} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-base font-bold">{r.motivo}</span>
                  <span className="truncate text-[14.5px] text-tinta-2">{r.sobre}</span>
                </span>
                <span className="flex flex-none flex-col items-end gap-1.5">
                  <PastillaReporte estado={r.estado} />
                  <span className="text-[13.5px] text-tinta-2">{r.cuando}</span>
                </span>
              </button>
            )
          })}
        </div>

        {d && (
          <article className="flex flex-col gap-4 rounded-[28px] bg-tarjeta p-5 shadow-tarjeta xl:w-[330px]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-tinta-2">
                {d.id} · {d.cuando}
              </span>
              <PastillaReporte estado={d.estado} />
            </div>
            <h2 className="font-display text-2xl leading-tight font-bold">{d.motivo}</h2>
            <dl className="flex flex-col gap-2 text-[14.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-tinta-2">Sobre</dt>
                <dd className="text-right font-bold">{d.sobre}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-tinta-2">Reportó</dt>
                <dd className="text-right font-bold">{d.quien}</dd>
              </div>
            </dl>
            <p className="rounded-chico bg-papel px-4 py-3.5 text-[15px] leading-relaxed">
              “{d.texto}”
            </p>
            {d.estado === 'abierto' ? (
              <>
                <label htmlFor="nint" className="text-sm font-bold">
                  Nota interna
                </label>
                <textarea
                  id="nint"
                  rows={2}
                  placeholder="Qué hiciste o qué falta revisar"
                  className="-mt-2 resize-none rounded-chico border-[1.5px] border-azul-100 bg-tarjeta px-4 py-3 text-[15px] outline-none focus:border-azul focus:ring-2 focus:ring-azul/30"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <Boton variante="verde" tamano="md" onClick={() => cambiar('resuelto')}>
                    Resolver
                  </Boton>
                  <Boton variante="gris" tamano="md" onClick={() => cambiar('descartado')}>
                    Descartar
                  </Boton>
                </div>
                {d.esPublicacion && (
                  <Boton variante="peligro" tamano="sm" className="w-full">
                    Ocultar la publicación
                  </Boton>
                )}
              </>
            ) : (
              d.nota && (
                <p className="text-sm text-tinta-2">
                  <span className="font-bold text-tinta">Nota:</span> {d.nota}
                </p>
              )
            )}
          </article>
        )}
      </div>
    </div>
  )
}
