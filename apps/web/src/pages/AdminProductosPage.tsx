import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Eye, EyeOff, Flag, RefreshCw, Search, Trash2 } from 'lucide-react'
import { ahoraCampus, segundosHastaHora, type AdminProducto } from '@shopsito/shared'
import { Avatar } from '../components/Avatar'
import { Boton } from '../components/Boton'
import { FotoProducto } from '../components/FotoProducto'
import { api } from '../lib/api'
import { nombreCategoria } from '../lib/categorias'
import { formatoPrecio } from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import { useAhora } from '../lib/useAhora'

type Situacion = 'venta' | 'agotado' | 'cerrado' | 'oculto'

const SITUACION: Record<Situacion, { texto: string; clases: string }> = {
  venta: { texto: 'A la venta', clases: 'bg-verde-50 text-verde' },
  agotado: { texto: 'Agotado', clases: 'bg-gris-50 text-tinta-2' },
  cerrado: { texto: 'Cerrado', clases: 'bg-gris-50 text-tinta-2' },
  oculto: { texto: 'Oculto', clases: 'bg-mango-50 text-mango-tinta' },
}

const PESTANAS: { id: Situacion | 'todo'; texto: string }[] = [
  { id: 'todo', texto: 'Todo' },
  { id: 'venta', texto: 'A la venta' },
  { id: 'agotado', texto: 'Agotados' },
  { id: 'cerrado', texto: 'Cerrados' },
  { id: 'oculto', texto: 'Ocultos' },
]

/** Lo que ve un comprador: oculto gana a todo; luego sin existencias; luego pasó la hora. */
function situacion(p: AdminProducto, ahora: Date): Situacion {
  if (p.estado === 'oculto') return 'oculto'
  if (p.estado === 'agotado' || p.cantidad === 0) return 'agotado'
  const { fecha } = ahoraCampus(ahora)
  if (p.fecha < fecha || (p.fecha === fecha && segundosHastaHora(p.horaLimite, ahora) <= 0))
    return 'cerrado'
  return 'venta'
}

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; productos: AdminProducto[] }

export function AdminProductosPage() {
  const ahora = useAhora(30_000)
  const hoy = ahoraCampus(ahora).fecha
  const [fecha, setFecha] = useState(hoy)
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [pestana, setPestana] = useState<Situacion | 'todo'>('todo')
  const [busqueda, setBusqueda] = useState('')
  const [confirmar, setConfirmar] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    api.admin.productos(fecha).then(
      (productos) => setEstado({ tipo: 'listo', productos }),
      (e: Error) => setEstado({ tipo: 'error', mensaje: e.message }),
    )
  }, [fecha])
  useEffect(cargar, [cargar])

  const ejecutar = (id: string, accion: Promise<unknown>) => {
    setOcupado(id)
    setError(null)
    accion
      .then(cargar, (e: Error) => setError(e.message))
      .finally(() => {
        setOcupado(null)
        setConfirmar(null)
      })
  }

  const productos = estado.tipo === 'listo' ? estado.productos : []
  const conSituacion = productos.map((p) => ({ p, s: situacion(p, ahora) }))
  const cuantos = (s: Situacion) => conSituacion.filter((x) => x.s === s).length
  const q = busqueda.trim().toLowerCase()
  const lista = conSituacion.filter(
    ({ p, s }) =>
      (pestana === 'todo' || s === pestana) &&
      (!q || p.nombre.toLowerCase().includes(q) || p.vendedor.nombre.toLowerCase().includes(q)),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-display text-[34px] font-bold tracking-[-0.02em] text-azul">
            Productos
          </h1>
          <p className="text-base text-tinta-2">
            Todo lo publicado en el día, incluidos agotados, cerrados y ocultos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="afecha" className="sr-only">
            Día
          </label>
          <input
            id="afecha"
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => {
              if (!e.target.value) return
              setEstado({ tipo: 'cargando' })
              setFecha(e.target.value)
            }}
            className="h-11 rounded-full border-[1.5px] border-azul-100 bg-tarjeta px-4 text-[15px] text-tinta outline-none focus:border-azul focus:ring-2 focus:ring-azul/30"
          />
          {fecha !== hoy && (
            <Boton
              variante="suave"
              tamano="sm"
              onClick={() => {
                setEstado({ tipo: 'cargando' })
                setFecha(hoy)
              }}
            >
              Hoy
            </Boton>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Publicados', productos.length],
          ['A la venta', cuantos('venta')],
          ['Ocultos', cuantos('oculto')],
          ['Con reportes abiertos', productos.filter((p) => p.reportesAbiertos > 0).length],
        ].map(([t, v]) => (
          <div
            key={t}
            className="flex flex-col gap-1 rounded-grande bg-tarjeta px-5 py-5 shadow-tarjeta"
          >
            <span className="text-[15px] text-tinta-2">{t}</span>
            <span className="num text-[32px] leading-none font-extrabold">
              {estado.tipo === 'listo' ? v : '—'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Situación" className="flex flex-wrap gap-2.5">
          {PESTANAS.map((t) => {
            const on = pestana === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => setPestana(t.id)}
                className={`inline-flex h-11 items-center gap-2.5 rounded-full px-[18px] text-base font-bold ${on ? 'bg-azul text-sobre-azul' : 'bg-azul-50 text-azul'}`}
              >
                {t.texto}
                <span
                  className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-xs font-extrabold ${on ? 'bg-mango text-[#1B2333]' : 'bg-tarjeta text-azul'}`}
                >
                  {t.id === 'todo' ? productos.length : cuantos(t.id)}
                </span>
              </button>
            )
          })}
        </div>
        <label className="flex h-11 w-full items-center gap-2.5 rounded-full bg-tarjeta px-4 text-tinta-2 shadow-tarjeta focus-within:ring-2 focus-within:ring-azul/30 sm:w-72">
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">Buscar producto o vendedor</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Producto o vendedor"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-tinta outline-none placeholder:text-tinta-2"
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-chico bg-error-50 px-4 py-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      )}

      {estado.tipo === 'error' ? (
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
      ) : (
        <div className="overflow-x-auto rounded-grande bg-tarjeta p-2 shadow-tarjeta">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="text-sm text-tinta-2">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Quedan · vendidos</th>
                <th className="px-4 py-3 font-medium">Hasta</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {estado.tipo === 'cargando' &&
                [1, 2, 3, 4].map((k) => (
                  <tr key={k}>
                    <td colSpan={7} className="px-2 py-1.5">
                      <div className="h-14 skeleton rounded-chico" />
                    </td>
                  </tr>
                ))}
              {estado.tipo === 'listo' && lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-tinta-2">
                    {productos.length === 0
                      ? 'Ese día no se publicó nada.'
                      : 'Nada con ese filtro.'}
                  </td>
                </tr>
              )}
              {lista.map(({ p, s }) => {
                const oculto = s === 'oculto'
                return (
                  <tr key={p.id} className="border-t border-azul-50 first:border-t-0">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <FotoProducto
                          url={urlFoto(p.fotoKey)}
                          className="size-11 flex-none rounded-chico"
                          gris={s !== 'venta'}
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="max-w-[240px] truncate text-[15px] font-bold">
                            {p.nombre}
                          </span>
                          <span className="flex items-center gap-2 text-[13px] text-tinta-2">
                            {nombreCategoria(p.categoria)}
                            {p.reportesAbiertos > 0 && (
                              <Link
                                to="/admin/reportes"
                                className="inline-flex items-center gap-1 font-bold text-mango-tinta"
                              >
                                <Flag size={13} strokeWidth={2.2} aria-hidden="true" />
                                {p.reportesAbiertos === 1
                                  ? '1 reporte'
                                  : `${p.reportesAbiertos} reportes`}
                              </Link>
                            )}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/perfil/${p.vendedor.id}`}
                        className="flex items-center gap-2 text-[14.5px] font-semibold hover:text-azul"
                      >
                        <Avatar id={p.vendedor.id} nombre={p.vendedor.nombre} size={28} />
                        {p.vendedor.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 num text-[15px] font-bold">
                      {formatoPrecio(p.precio)}
                    </td>
                    <td className="px-4 py-3 text-[15px] tabular-nums">
                      {p.cantidad} · <span className="text-tinta-2">{p.vendidos}</span>
                    </td>
                    <td className="px-4 py-3 text-[15px] tabular-nums">{p.horaLimite}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 items-center rounded-full px-3 text-[13px] font-bold whitespace-nowrap ${SITUACION[s].clases}`}
                      >
                        {SITUACION[s].texto}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {confirmar === p.id ? (
                          <>
                            {/* Si ya tiene pedidos la API lo oculta en vez de borrarlo. */}
                            <span className="text-[13px] text-tinta-2">¿Quitarlo?</span>
                            <Boton
                              variante="peligro"
                              tamano="sm"
                              disabled={ocupado === p.id}
                              onClick={() => ejecutar(p.id, api.admin.eliminar(p.id))}
                            >
                              Sí, quitar
                            </Boton>
                            <Boton variante="gris" tamano="sm" onClick={() => setConfirmar(null)}>
                              No
                            </Boton>
                          </>
                        ) : (
                          <>
                            <Boton
                              variante={oculto ? 'suave' : 'mango-suave'}
                              tamano="sm"
                              disabled={ocupado === p.id}
                              onClick={() =>
                                ejecutar(
                                  p.id,
                                  api.admin.cambiarEstado(p.id, {
                                    estado: oculto ? 'disponible' : 'oculto',
                                  }),
                                )
                              }
                            >
                              {oculto ? (
                                <Eye size={17} strokeWidth={2.2} aria-hidden="true" />
                              ) : (
                                <EyeOff size={17} strokeWidth={2.2} aria-hidden="true" />
                              )}
                              {oculto ? 'Mostrar' : 'Ocultar'}
                            </Boton>
                            <button
                              aria-label={`Quitar ${p.nombre}`}
                              onClick={() => setConfirmar(p.id)}
                              className="flex size-11 items-center justify-center rounded-full text-tinta-2 hover:bg-error-50 hover:text-error"
                            >
                              <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
