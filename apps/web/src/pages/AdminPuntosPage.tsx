import { useCallback, useEffect, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import type { PuntoEntrega } from '@shopsito/shared'
import { Boton } from '../components/Boton'
import { api } from '../lib/api'

type Edicion = { id: string | null; nombre: string; ubicacion: string }

const CAMPO =
  'w-full rounded-chico border-[1.5px] border-azul-100 bg-tarjeta px-4 text-[15px] text-tinta outline-none focus:border-azul focus:ring-2 focus:ring-azul/30'

/** Interruptor activo/inactivo de la tabla. */
function Interruptor({
  activo,
  nombre,
  onClick,
}: {
  activo: boolean
  nombre: string
  onClick: () => void
}) {
  return (
    <button
      role="switch"
      aria-checked={activo}
      aria-label={`Activar ${nombre}`}
      onClick={onClick}
      className="flex items-center gap-2.5"
    >
      <span
        className={`flex h-[26px] w-11 items-center rounded-full p-[3px] transition ${activo ? 'bg-verde' : 'bg-azul-100'}`}
      >
        <span
          className={`size-5 rounded-full bg-white shadow transition ${activo ? 'translate-x-[18px]' : ''}`}
        />
      </span>
      <span className={`text-[15px] font-semibold ${activo ? 'text-verde' : 'text-tinta-2'}`}>
        {activo ? 'Activo' : 'Inactivo'}
      </span>
    </button>
  )
}

export function AdminPuntosPage() {
  const [puntos, setPuntos] = useState<PuntoEntrega[] | null>(null)
  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    api.puntosEntrega.listar().then(
      (lista) => {
        setPuntos(lista)
        setEdicion((e) => {
          if (e) return e
          const p = lista[0]
          return p ? { id: p.id, nombre: p.nombre, ubicacion: p.ubicacion } : null
        })
      },
      (e: Error) => setError(e.message),
    )
  }, [])
  useEffect(cargar, [cargar])

  const ejecutar = (accion: Promise<unknown>, despues?: () => void) =>
    accion.then(
      () => {
        setError(null)
        despues?.()
        cargar()
      },
      (e: Error) => setError(e.message),
    )

  const guardar = () => {
    if (!edicion) return
    const datos = { nombre: edicion.nombre, ubicacion: edicion.ubicacion }
    if (edicion.id) ejecutar(api.puntosEntrega.actualizar(edicion.id, datos))
    else ejecutar(api.puntosEntrega.crear(datos), () => setEdicion(null))
  }

  const activos = puntos?.filter((p) => p.activo).length ?? 0
  const seleccionado = puntos?.find((p) => p.id === edicion?.id)
  const indice = (id: string) =>
    `P-${String((puntos?.findIndex((p) => p.id === id) ?? 0) + 1).padStart(2, '0')}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-display text-[34px] font-bold tracking-[-0.02em] text-azul">
            Puntos de entrega
          </h1>
          <p className="text-base text-tinta-2">
            Donde se ven compradores y vendedores. En la app solo aparecen los activos.
          </p>
        </div>
        <Boton onClick={() => setEdicion({ id: null, nombre: '', ubicacion: '' })}>
          <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
          Nuevo punto
        </Boton>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Activos', activos],
          ['Inactivos', (puntos?.length ?? 0) - activos],
          // TODO: entregas de hoy por punto cuando exista la consulta de pedidos.
          ['Entregas hoy', '—'],
        ].map(([t, v]) => (
          <div
            key={t}
            className="flex flex-col gap-1 rounded-grande bg-tarjeta px-5 py-5 shadow-tarjeta"
          >
            <span className="text-[15px] text-tinta-2">{t}</span>
            <span className="num text-[32px] leading-none font-extrabold">{v}</span>
          </div>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-chico bg-error-50 px-4 py-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex-1 overflow-x-auto rounded-grande bg-tarjeta p-2 shadow-tarjeta">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="text-sm text-tinta-2">
                <th className="px-4 py-3 font-medium">Punto</th>
                <th className="px-4 py-3 font-medium">Indicaciones</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {puntos === null &&
                [1, 2, 3].map((k) => (
                  <tr key={k}>
                    <td colSpan={4} className="px-2 py-1.5">
                      <div className="h-14 skeleton rounded-chico" />
                    </td>
                  </tr>
                ))}
              {puntos?.map((p) => {
                const sel = p.id === edicion?.id
                return (
                  <tr
                    key={p.id}
                    className={
                      sel
                        ? 'bg-azul-50 [&>td:first-child]:rounded-l-chico [&>td:last-child]:rounded-r-chico'
                        : ''
                    }
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center gap-3 text-[15px] font-bold ${p.activo ? 'text-tinta' : 'text-tinta-2'}`}
                      >
                        <span
                          className={`flex size-[38px] flex-none items-center justify-center rounded-full ${p.activo ? 'bg-azul-50 text-azul' : 'bg-gris-50 text-tinta-2'} ${sel ? 'bg-tarjeta' : ''}`}
                        >
                          <MapPin size={18} strokeWidth={2} aria-hidden="true" />
                        </span>
                        {p.nombre}
                      </span>
                    </td>
                    <td className="max-w-[320px] px-4 py-3 text-[15px] leading-snug text-tinta-2">
                      {p.ubicacion}
                    </td>
                    <td className="px-4 py-3">
                      <Interruptor
                        activo={p.activo}
                        nombre={p.nombre}
                        onClick={() =>
                          ejecutar(api.puntosEntrega.actualizar(p.id, { activo: !p.activo }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Boton
                        variante="suave"
                        tamano="sm"
                        className={sel ? 'bg-transparent' : ''}
                        onClick={() =>
                          setEdicion({ id: p.id, nombre: p.nombre, ubicacion: p.ubicacion })
                        }
                      >
                        Editar
                      </Boton>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {edicion && (
          <form
            className="flex flex-col gap-3 rounded-grande bg-tarjeta p-5 shadow-tarjeta xl:w-[300px]"
            onSubmit={(e) => {
              e.preventDefault()
              guardar()
            }}
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[22px] font-bold">
                {edicion.id ? 'Editar punto' : 'Nuevo punto'}
              </h2>
              {edicion.id && <span className="text-[13px] text-tinta-2">{indice(edicion.id)}</span>}
            </div>
            <label htmlFor="pnombre" className="text-sm font-bold">
              Nombre
            </label>
            <input
              id="pnombre"
              required
              minLength={2}
              value={edicion.nombre}
              onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
              className={`${CAMPO} h-[50px]`}
            />
            <label htmlFor="pnota" className="mt-1 text-sm font-bold">
              Indicaciones para encontrarlo
            </label>
            <textarea
              id="pnota"
              required
              minLength={2}
              rows={3}
              value={edicion.ubicacion}
              onChange={(e) => setEdicion({ ...edicion, ubicacion: e.target.value })}
              className={`${CAMPO} resize-none py-3 leading-normal`}
            />
            {!seleccionado || seleccionado.activo ? (
              <span className="mt-1 rounded-chico bg-verde-50 px-4 py-3 text-sm leading-normal">
                Activo: aparece al confirmar pedidos. Si lo desactivas, los pedidos de hoy en este
                punto siguen igual.
              </span>
            ) : (
              <span className="mt-1 rounded-chico bg-gris-50 px-4 py-3 text-sm leading-normal">
                Inactivo: no aparece para pedidos nuevos. Actívalo con el interruptor de la tabla.
              </span>
            )}
            <div className="mt-1 grid grid-cols-[1.4fr_1fr] gap-2.5">
              <Boton type="submit" tamano="md">
                Guardar
              </Boton>
              <Boton variante="gris" tamano="md" onClick={() => setEdicion(null)}>
                Cancelar
              </Boton>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
