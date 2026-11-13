import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  BookOpen,
  Building2,
  Check,
  ChevronLeft,
  Clock,
  Coffee,
  MapPin,
  type LucideIcon,
} from 'lucide-react'
import type { PuntoEntrega } from '@shopsito/shared'
import { Avatar } from '../components/Avatar'
import { BarraAccion } from '../components/BarraAccion'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { FotoProducto } from '../components/FotoProducto'
import { InsigniaMini } from '../components/Insignia'
import { api } from '../lib/api'
import { formatoPrecio, nombreCorto } from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import { useProductosHoy } from '../lib/useProductosHoy'
import { EstadoCarga } from './EstadoCarga'

/** Icono según el nombre del punto (biblioteca, edificio, cafetería). */
function iconoPunto(nombre: string): LucideIcon {
  const n = nombre.toLowerCase()
  if (n.includes('biblioteca')) return BookOpen
  if (n.includes('edificio')) return Building2
  if (n.includes('cafeter')) return Coffee
  return MapPin
}

export function ConfirmarPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { estado, recargar } = useProductosHoy()
  const [puntos, setPuntos] = useState<PuntoEntrega[] | null>(null)
  const [puntoId, setPuntoId] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    // TODO: filtrar por los puntos donde entrega este vendedor cuando la API lo soporte.
    api.puntosEntrega.listar().then(
      (todos) => {
        const activos = todos.filter((x) => x.activo)
        setPuntos(activos)
        setPuntoId((actual) => actual ?? activos[0]?.id ?? null)
      },
      () => setPuntos([]),
    )
  }, [])

  if (estado.tipo !== 'listo') return <EstadoCarga estado={estado} recargar={recargar} />
  const p = estado.productos.find((x) => x.id === id)
  if (!p || p.cantidad === 0)
    return <EstadoCarga estado={{ tipo: 'no-encontrado' }} recargar={recargar} />

  const cantidad = Math.min(Math.max(Number(params.get('cantidad')) || 1, 1), p.cantidad)
  const total = p.precio * cantidad
  const corto = nombreCorto(p.vendedor.nombre)
  const punto = puntos?.find((x) => x.id === puntoId)

  const confirmar = () => {
    if (!puntoId) return
    setEnviando(true)
    setError(null)
    // TODO: enviar `nota` cuando el esquema de pedidos la incluya.
    api.pedidos
      .crear({ puntoEntregaId: puntoId, items: [{ productoId: p.id, cantidad }] })
      .then(
        () => navigate('/pedidos'),
        (e: Error) => setError(e.message),
      )
      .finally(() => setEnviando(false))
  }

  return (
    <>
      <main className="flex flex-col pb-[150px]">
        <div className="flex items-center gap-3 pt-3.5 pr-5 pl-4">
          <BotonRedondo to={`/producto/${p.id}`} label="Regresar al producto">
            <ChevronLeft size={22} strokeWidth={2.2} />
          </BotonRedondo>
          <h1 className="font-display text-[25px] font-bold tracking-[-0.015em] text-azul">
            Confirmar pedido
          </h1>
        </div>

        <div className="px-5 pt-5">
          <div className="relative rounded-grande bg-tarjeta shadow-tarjeta">
            <div className="flex flex-col gap-4 px-[18px] pt-[18px] pb-4">
              <div className="flex items-center gap-2.5">
                <Avatar id={p.vendedor.id} nombre={p.vendedor.nombre} size={34} />
                <span className="text-sm text-tinta-2">
                  Le compras a <span className="font-bold text-tinta">{p.vendedor.nombre}</span>
                </span>
                {p.vendedor.insigniaComunidad && <InsigniaMini size={17} />}
              </div>
              <div className="flex items-center gap-3.5">
                <FotoProducto
                  url={urlFoto(p.fotoKey)}
                  className="size-[68px] flex-none rounded-chico"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-[15.5px] leading-[1.25] font-bold">{p.nombre}</span>
                  <span className="text-[13.5px] text-tinta-2">
                    {cantidad} × {formatoPrecio(p.precio)}
                  </span>
                </div>
                <span className="num text-[19px] font-bold">{formatoPrecio(total)}</span>
              </div>
            </div>

            {/* Separador tipo ticket, suave */}
            <div aria-hidden="true" className="relative h-[22px]">
              <span className="absolute top-0 -left-[11px] size-[22px] rounded-full bg-papel" />
              <span className="absolute top-0 -right-[11px] size-[22px] rounded-full bg-papel" />
              <span className="absolute inset-x-5 top-2.5 border-t-2 border-dashed border-azul-100" />
            </div>

            <div className="flex flex-col gap-2.5 px-[18px] pt-2.5 pb-5">
              <div className="flex justify-between gap-3 text-[14.5px]">
                <span className="text-tinta-2">Recoges en</span>
                <span className="text-right font-bold">{punto?.nombre ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-3 text-[14.5px]">
                <span className="text-tinta-2">Antes de</span>
                <span className="font-bold tabular-nums">{p.horaLimite}</span>
              </div>
              <div className="flex justify-between gap-3 text-[14.5px]">
                <span className="text-tinta-2">Pago</span>
                {/* TODO: dato de ejemplo del diseño; definir métodos de pago. */}
                <span className="font-bold">Efectivo al recoger</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded-chico bg-azul-50 px-3.5 py-3">
                <span className="font-display text-lg font-bold text-azul">Total</span>
                <span className="num text-[30px] font-extrabold tracking-[-0.02em] text-azul">
                  {formatoPrecio(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <fieldset className="flex min-w-0 flex-col gap-3 px-5 pt-7">
          <legend className="font-display text-[21px] font-bold tracking-[-0.01em]">
            ¿Dónde lo recoges?
          </legend>
          <span className="-mt-1 text-sm text-tinta-2">{corto} entrega en estos puntos.</span>
          {puntos === null &&
            [1, 2, 3].map((k) => <div key={k} className="h-[74px] skeleton rounded-tarjeta" />)}
          {puntos?.length === 0 && (
            <span className="text-sm text-tinta-2">
              No hay puntos de entrega activos por ahora.
            </span>
          )}
          {puntos?.map((pt) => {
            const sel = pt.id === puntoId
            const Icono = iconoPunto(pt.nombre)
            return (
              <label
                key={pt.id}
                className={`flex cursor-pointer items-center gap-3.5 rounded-tarjeta py-3.5 pr-4 pl-3.5 outline-2 -outline-offset-2 ${
                  sel ? 'bg-azul-50 outline-azul' : 'bg-tarjeta shadow-tarjeta outline-transparent'
                }`}
              >
                <span
                  className={`flex size-[46px] flex-none items-center justify-center rounded-full ${sel ? 'bg-azul text-sobre-azul' : 'bg-azul-50 text-azul'}`}
                >
                  <Icono size={21} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{pt.nombre}</span>
                  <span className="text-[13px] leading-[1.4] text-tinta-2">{pt.ubicacion}</span>
                </span>
                <input
                  type="radio"
                  name="punto"
                  checked={sel}
                  onChange={() => setPuntoId(pt.id)}
                  className="size-[22px] flex-none accent-azul"
                />
              </label>
            )
          })}
        </fieldset>

        <div className="flex flex-col gap-2 px-5 pt-6">
          <label htmlFor="nota" className="text-[14.5px] font-bold">
            Nota para {corto} <span className="font-medium text-tinta-2">(opcional)</span>
          </label>
          <textarea
            id="nota"
            rows={2}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. sin cebolla"
            className="resize-none rounded-[18px] border-[1.5px] border-azul-100 bg-tarjeta px-4 py-[13px] text-[15px] leading-[1.4] outline-none focus:border-azul focus:ring-2 focus:ring-azul/30"
          />
        </div>

        <div className="mx-5 mt-[18px] flex items-start gap-3 rounded-[18px] bg-mango-50 px-4 py-3.5">
          <span className="flex size-8 flex-none items-center justify-center rounded-full bg-mango text-sobre-mango">
            <Clock size={17} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <p className="text-sm leading-normal">
            {corto} tiene que aceptar tu pedido. Si no lo acepta antes de las{' '}
            <span className="font-bold">{p.horaLimite}</span>, se cancela solo y no pagas nada.
          </p>
        </div>
      </main>

      <BarraAccion>
        {error && (
          <p role="alert" className="text-center text-[13.5px] font-semibold text-error">
            {error}{' '}
            {error.startsWith('Entra') && (
              <Link to="/login" className="text-azul underline">
                Entrar
              </Link>
            )}
          </p>
        )}
        <Boton onClick={confirmar} disabled={!puntoId || enviando} className="w-full">
          <Check size={19} strokeWidth={2.4} aria-hidden="true" />
          Confirmar pedido · <span className="num">{formatoPrecio(total)}</span>
        </Boton>
        <span className="text-center text-[12.5px] text-tinta-2">
          Apartas {cantidad} de{' '}
          {p.cantidad === 1 ? 'la única que queda' : `las ${p.cantidad} que quedan`}.
        </span>
      </BarraAccion>
    </>
  )
}
