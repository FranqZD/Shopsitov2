import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Flag, Package, RefreshCw, User } from 'lucide-react'
import type { EstadoReporte, Reporte } from '@shopsito/shared'
import { Boton } from '../components/Boton'
import { PastillaReporte } from '../components/PastillaEstado'
import { api } from '../lib/api'
import { useContextoAdmin } from '../lib/contextoAdmin'
import { haceCuanto } from '../lib/formato'

const PESTANAS: { id: EstadoReporte; texto: string }[] = [
  { id: 'abierto', texto: 'Abiertos' },
  { id: 'resuelto', texto: 'Resueltos' },
  { id: 'descartado', texto: 'Descartados' },
]

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: 'numeric',
    minute: '2-digit',
  })

/** "Hoy, 9:41", "Ayer, 13:05" o "Hace 3 días". */
const cuando = (iso: string) => {
  const dia = haceCuanto(iso)
  return dia === 'Hoy' || dia === 'Ayer' ? `${dia}, ${hora(iso)}` : dia
}

/** Texto corto de lo reportado para la lista. */
function sobre(r: Reporte) {
  const o = r.objetivo
  if (!o) return 'Ya no existe'
  return o.tipo === 'producto'
    ? `Publicación: ${o.nombre} · ${o.vendedor.nombre}`
    : `Usuario: ${o.nombre}`
}

type Estado =
  { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'listo'; reportes: Reporte[] }

export function AdminReportesPage() {
  const { recontarReportes } = useContextoAdmin()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [pestana, setPestana] = useState<EstadoReporte>('abierto')
  const [selId, setSelId] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    api.reportes.listar().then(
      (reportes) => setEstado({ tipo: 'listo', reportes }),
      (e: Error) => setEstado({ tipo: 'error', mensaje: e.message }),
    )
  }, [])
  useEffect(cargar, [cargar])

  const reportes = estado.tipo === 'listo' ? estado.reportes : []
  const lista = reportes.filter((r) => r.estado === pestana)
  const d = lista.find((r) => r.id === selId) ?? lista[0]

  const ejecutar = (accion: Promise<unknown>, despues?: () => void) => {
    setEnviando(true)
    setError(null)
    accion
      .then(
        () => {
          despues?.()
          cargar()
          recontarReportes()
        },
        (e: Error) => setError(e.message),
      )
      .finally(() => setEnviando(false))
  }

  const cambiar = (nuevo: EstadoReporte) => {
    if (!d) return
    ejecutar(api.reportes.actualizar(d.id, { estado: nuevo, nota }), () => {
      setNota('')
      setSelId(null)
    })
  }

  const objetivo = d?.objetivo
  const productoOculto = objetivo?.tipo === 'producto' && objetivo.estado === 'oculto'

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
                setNota('')
              }}
              className={`inline-flex h-11 items-center gap-2.5 rounded-full px-[18px] text-base font-bold ${on ? 'bg-azul text-sobre-azul' : 'bg-azul-50 text-azul'}`}
            >
              {t.texto}
              <span
                className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-xs font-extrabold ${on ? 'bg-mango text-[#1B2333]' : 'bg-tarjeta text-azul'}`}
              >
                {reportes.filter((r) => r.estado === t.id).length}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-chico bg-error-50 px-4 py-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      )}

      {estado.tipo === 'error' && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-grande bg-tarjeta px-6 py-8 text-center shadow-tarjeta"
        >
          <p className="text-[15px] text-tinta-2">{estado.mensaje}</p>
          <Boton
            variante="suave"
            tamano="md"
            onClick={() => {
              setEstado({ tipo: 'cargando' })
              cargar()
            }}
          >
            <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
            Reintentar
          </Boton>
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex flex-1 flex-col gap-2.5">
          {estado.tipo === 'cargando' &&
            [1, 2, 3].map((k) => <div key={k} className="h-[76px] skeleton rounded-grande" />)}
          {estado.tipo === 'listo' && lista.length === 0 && (
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
                onClick={() => {
                  setSelId(r.id)
                  setNota('')
                }}
                className={`flex items-center gap-4 rounded-grande bg-tarjeta px-5 py-4 text-left outline-2 -outline-offset-2 ${on ? 'outline-azul' : 'shadow-tarjeta outline-transparent'}`}
              >
                <span
                  className={`flex size-10 flex-none items-center justify-center rounded-full ${r.estado === 'abierto' ? 'bg-mango-50 text-mango-tinta' : 'bg-gris-50 text-tinta-2'}`}
                >
                  <Flag size={19} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-base font-bold">{r.motivo}</span>
                  <span className="truncate text-[14.5px] text-tinta-2">{sobre(r)}</span>
                </span>
                <span className="flex flex-none flex-col items-end gap-1.5">
                  <PastillaReporte estado={r.estado} />
                  <span className="text-[13.5px] text-tinta-2">{cuando(r.creadoEn)}</span>
                </span>
              </button>
            )
          })}
        </div>

        {d && (
          <article className="flex flex-col gap-4 rounded-[28px] bg-tarjeta p-5 shadow-tarjeta xl:w-[340px]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-tinta-2">{cuando(d.creadoEn)}</span>
              <PastillaReporte estado={d.estado} />
            </div>
            <h2 className="font-display text-2xl leading-tight font-bold">{d.motivo}</h2>
            <dl className="flex flex-col gap-2 text-[14.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-tinta-2">Sobre</dt>
                <dd className="text-right font-bold">
                  {!objetivo
                    ? 'Ya no existe'
                    : objetivo.tipo === 'producto'
                      ? `${objetivo.nombre}${productoOculto ? ' (oculto)' : ''}`
                      : objetivo.nombre}
                </dd>
              </div>
              {objetivo?.tipo === 'producto' && (
                <div className="flex justify-between gap-4">
                  <dt className="text-tinta-2">Vende</dt>
                  <dd className="text-right font-bold">{objetivo.vendedor.nombre}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-tinta-2">Reportó</dt>
                <dd className="text-right font-bold">{d.reportante.nombre}</dd>
              </div>
            </dl>
            {d.detalle && (
              <p className="rounded-chico bg-papel px-4 py-3.5 text-[15px] leading-relaxed">
                “{d.detalle}”
              </p>
            )}
            {objetivo && (
              <Link
                to={
                  objetivo.tipo === 'producto'
                    ? `/perfil/${objetivo.vendedor.id}`
                    : `/perfil/${objetivo.id}`
                }
                className="inline-flex h-11 items-center gap-2 self-start text-[14.5px] font-bold text-azul"
              >
                {objetivo.tipo === 'producto' ? (
                  <Package size={18} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <User size={18} strokeWidth={2} aria-hidden="true" />
                )}
                {objetivo.tipo === 'producto' ? 'Ver perfil de quien vende' : 'Ver su perfil'}
              </Link>
            )}
            {d.estado === 'abierto' ? (
              <>
                <label htmlFor="nint" className="text-sm font-bold">
                  Nota interna
                </label>
                <textarea
                  id="nint"
                  rows={2}
                  maxLength={500}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Qué hiciste o qué falta revisar"
                  className="-mt-2 resize-none rounded-chico border-[1.5px] border-azul-100 bg-tarjeta px-4 py-3 text-[15px] outline-none focus:border-azul focus:ring-2 focus:ring-azul/30"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <Boton
                    variante="verde"
                    tamano="md"
                    disabled={enviando}
                    onClick={() => cambiar('resuelto')}
                  >
                    Resolver
                  </Boton>
                  <Boton
                    variante="gris"
                    tamano="md"
                    disabled={enviando}
                    onClick={() => cambiar('descartado')}
                  >
                    Descartar
                  </Boton>
                </div>
                {objetivo?.tipo === 'producto' && (
                  <Boton
                    variante={productoOculto ? 'suave' : 'peligro'}
                    tamano="sm"
                    className="w-full"
                    disabled={enviando}
                    onClick={() =>
                      ejecutar(
                        api.admin.cambiarEstado(objetivo.id, {
                          estado: productoOculto ? 'disponible' : 'oculto',
                        }),
                      )
                    }
                  >
                    {productoOculto ? 'Volver a mostrar la publicación' : 'Ocultar la publicación'}
                  </Boton>
                )}
              </>
            ) : (
              <>
                {d.nota && (
                  <p className="text-sm text-tinta-2">
                    <span className="font-bold text-tinta">Nota:</span> {d.nota}
                  </p>
                )}
                <Boton
                  variante="suave"
                  tamano="sm"
                  disabled={enviando}
                  onClick={() => ejecutar(api.reportes.actualizar(d.id, { estado: 'abierto' }))}
                >
                  Reabrir
                </Boton>
              </>
            )}
          </article>
        )}
      </div>
    </div>
  )
}
