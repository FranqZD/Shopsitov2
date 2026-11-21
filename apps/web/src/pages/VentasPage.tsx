import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  MapPin,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import {
  ahoraCampus,
  segundosHastaHora,
  type EstadoPedido,
  type PedidoVenta,
} from '@shopsito/shared'
import { Avatar } from '../components/Avatar'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { FotoProducto } from '../components/FotoProducto'
import { InsigniaMini } from '../components/Insignia'
import { api } from '../lib/api'
import { formatoCuenta, formatoPrecio, nombreCorto } from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import { useAhora } from '../lib/useAhora'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; ventas: PedidoVenta[] }

type Accion = 'aceptar' | 'rechazar' | 'entregar'

const HACIA: Record<Accion, EstadoPedido> = {
  aceptar: 'aceptado',
  rechazar: 'rechazado',
  entregar: 'entregado',
}

const resumen = (p: PedidoVenta) => p.items.map((i) => `${i.cantidad} × ${i.nombre}`).join(', ')
const horaDe = (iso: string) => ahoraCampus(new Date(iso)).hora

/** Pedidos de hoy del vendedor; se vuelve a pedir al regresar a la pestaña. */
function useVentas() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })

  const cargar = useCallback(() => {
    api.pedidos.ventas().then(
      (ventas) => setEstado({ tipo: 'listo', ventas }),
      (e: Error) => setEstado({ tipo: 'error', mensaje: e.message }),
    )
  }, [])

  useEffect(() => {
    cargar()
    const alVolver = () => document.visibilityState === 'visible' && cargar()
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [cargar])

  const cambiarEstado = (id: string, estado: EstadoPedido) =>
    setEstado((e) =>
      e.tipo === 'listo'
        ? { ...e, ventas: e.ventas.map((p) => (p.id === id ? { ...p, estado } : p)) }
        : e,
    )

  return { estado, cargar, cambiarEstado }
}

export function VentasPage() {
  const ahora = useAhora()
  const { estado, cargar, cambiarEstado } = useVentas()
  const [enviando, setEnviando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rechazado, setRechazado] = useState<string | null>(null)

  const responder = async (p: PedidoVenta, accion: Accion) => {
    setEnviando(p.id)
    setError(null)
    try {
      await api.pedidos[accion](p.id)
      cambiarEstado(p.id, HACIA[accion])
      setRechazado(accion === 'rechazar' ? p.comprador.nombre : null)
    } catch (e) {
      setError((e as Error).message)
      // Si el pedido cambió (p. ej. se canceló solo), la lista nueva lo refleja.
      cargar()
    } finally {
      setEnviando(null)
    }
  }

  const ventas = estado.tipo === 'listo' ? estado.ventas : []
  // Un pendiente que ya pasó su hora límite se cancela en el servidor; aquí se oculta en cuanto vence.
  const nuevos = ventas.filter(
    (p) => p.estado === 'pendiente' && segundosHastaHora(p.horaLimite, ahora) > 0,
  )
  const porEntregar = ventas.filter((p) => p.estado === 'aceptado')
  const entregados = ventas.filter((p) => p.estado === 'entregado')
  const ganado = entregados.reduce((a, p) => a + p.total, 0)

  return (
    <main className="flex flex-col gap-6 px-5 pt-3.5 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start md:gap-x-6">
      <div className="-ml-1 flex items-center gap-3 md:col-span-2">
        <BotonRedondo to="/vender" label="Regresar a vender">
          <ChevronLeft size={22} strokeWidth={2.2} />
        </BotonRedondo>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.015em] text-azul">
          Mis ventas
        </h1>
      </div>

      {estado.tipo === 'cargando' && (
        <>
          <span className="h-[124px] skeleton rounded-grande md:col-span-2" />
          <div className="flex flex-col gap-3 md:col-start-1">
            <span className="h-6 w-40 skeleton rounded-full" />
            <span className="h-[150px] skeleton rounded-grande" />
          </div>
          <div className="flex flex-col gap-2 md:col-start-2">
            <span className="h-6 w-40 skeleton rounded-full" />
            {[0, 1, 2].map((k) => (
              <span key={k} className="h-[62px] skeleton rounded-tarjeta" />
            ))}
          </div>
        </>
      )}

      {estado.tipo === 'error' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center md:col-span-2">
          <p role="alert" className="text-[15px] text-tinta-2">
            {estado.mensaje}
          </p>
          <Boton variante="gris" tamano="md" onClick={cargar}>
            <RefreshCw size={18} strokeWidth={2.2} aria-hidden="true" />
            Reintentar
          </Boton>
        </div>
      )}

      {estado.tipo === 'listo' && (
        <>
          <div className="relative flex items-center overflow-hidden rounded-grande bg-banner px-6 py-5 text-white md:col-span-2 md:px-8 md:py-7">
            <span className="absolute -right-10 -bottom-16 size-[200px] rounded-full bg-white/18" />
            <div className="relative flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] text-[#D5E1F0]">Hoy llevas</span>
              <span className="num text-[44px] leading-none font-extrabold tracking-[-0.02em]">
                {formatoPrecio(ganado)}
              </span>
              <span className="text-[15px] text-[#D5E1F0]">
                {entregados.length} entregados · {porEntregar.length} por entregar
              </span>
            </div>
            <span className="relative flex size-[70px] flex-none items-center justify-center rounded-full bg-mango text-sobre-mango">
              <ShoppingBag size={28} strokeWidth={2.1} aria-hidden="true" />
            </span>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-chico bg-error-50 px-4 py-3.5 text-[14.5px] font-semibold text-error md:col-start-1"
            >
              {error}
            </p>
          )}

          {rechazado && (
            <div
              role="status"
              className="rounded-chico bg-gris-50 px-4 py-3.5 text-[14.5px] leading-normal md:col-start-1"
            >
              Rechazaste el pedido de {nombreCorto(rechazado)}. Ya le avisamos y no se le cobra
              nada.
            </div>
          )}

          {nuevos.length > 0 && (
            <section className="flex flex-col gap-3 md:col-start-1">
              <h2 className="flex items-center gap-2.5 font-display text-[21px] font-bold tracking-[-0.01em]">
                <span className="size-2.5 animate-pulso rounded-full bg-mango" />
                {nuevos.length === 1 ? 'Pedido nuevo' : `Pedidos nuevos ${nuevos.length}`}
              </h2>
              {nuevos.map((p) => (
                <div
                  key={p.id}
                  className="flex animate-anillo flex-col gap-3.5 rounded-grande bg-tarjeta p-4 outline-2 outline-mango"
                >
                  <div className="flex items-center gap-3">
                    <Avatar id={p.comprador.id} nombre={p.comprador.nombre} size={50} />
                    <span className="flex flex-1 flex-col">
                      <span className="flex items-center gap-1.5 text-base font-bold">
                        {p.comprador.nombre} {p.comprador.insigniaComunidad && <InsigniaMini />}
                      </span>
                      <span className="text-[13.5px] text-tinta-2">
                        Lo pidió a las {horaDe(p.creadoEn)}
                      </span>
                    </span>
                    <span className="num text-[22px] font-bold">{formatoPrecio(p.total)}</span>
                  </div>
                  <div className="flex flex-col gap-2 rounded-chico bg-papel p-3">
                    {p.items.map((i) => (
                      <div key={i.productoId} className="flex items-center gap-3">
                        <FotoProducto
                          url={urlFoto(i.fotoKey)}
                          className="size-[52px] flex-none rounded-[14px]"
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[15px] font-bold">
                            {i.cantidad} × {i.nombre}
                          </span>
                          <span className="text-[13.5px] text-tinta-2">
                            {p.puntoEntrega.nombre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="flex items-center gap-2 text-sm font-bold text-mango-tinta tabular-nums">
                    <Clock size={16} strokeWidth={2.2} aria-hidden="true" />
                    Tienes {formatoCuenta(segundosHastaHora(p.horaLimite, ahora))} para responder
                  </span>
                  <div className="grid grid-cols-[1fr_1.6fr] gap-2.5">
                    <Boton
                      variante="gris"
                      tamano="md"
                      disabled={enviando === p.id}
                      onClick={() => void responder(p, 'rechazar')}
                    >
                      Rechazar
                    </Boton>
                    <Boton
                      tamano="md"
                      disabled={enviando === p.id}
                      onClick={() => void responder(p, 'aceptar')}
                    >
                      <Check size={18} strokeWidth={2.6} aria-hidden="true" />
                      Aceptar
                    </Boton>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="flex flex-col gap-3 md:col-start-1">
            <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">
              Por entregar <span className="text-base text-tinta-2">{porEntregar.length}</span>
            </h2>
            {porEntregar.length === 0 && (
              <span className="text-sm text-tinta-2">Nada pendiente por ahora.</span>
            )}
            {porEntregar.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-grande bg-tarjeta p-4 shadow-tarjeta"
              >
                <div className="flex items-center gap-3">
                  <Avatar id={p.comprador.id} nombre={p.comprador.nombre} size={50} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-base font-bold">{p.comprador.nombre}</span>
                    <span className="text-[13.5px] text-tinta-2">{resumen(p)}</span>
                  </span>
                  <span className="inline-flex h-7 items-center rounded-full bg-verde-50 px-3 text-[13px] font-bold text-verde">
                    Aceptado
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[14.5px]">
                  <MapPin size={16} strokeWidth={2} className="text-azul" aria-hidden="true" />
                  {p.puntoEntrega.nombre} · antes de {p.horaLimite}
                </div>
                <Boton
                  variante="verde"
                  tamano="md"
                  disabled={enviando === p.id}
                  onClick={() => void responder(p, 'entregar')}
                >
                  <ClipboardCheck size={18} strokeWidth={2.2} aria-hidden="true" />
                  Ya se lo di · <span className="num">{formatoPrecio(p.total)}</span>
                </Boton>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2 md:col-start-2 md:row-span-3 md:row-start-3">
            <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">
              Entregados hoy
            </h2>
            {entregados.length === 0 && (
              <span className="text-sm text-tinta-2">Todavía no entregas nada hoy.</span>
            )}
            {entregados.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-tarjeta bg-tarjeta px-4 py-3"
              >
                <span className="flex size-9 flex-none items-center justify-center rounded-full bg-verde-50 text-verde">
                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold">{p.comprador.nombre}</span>
                  <span className="text-[13px] text-tinta-2">
                    {resumen(p)} · pedido a las {horaDe(p.creadoEn)}
                  </span>
                </span>
                <span className="num text-[17px] font-bold">{formatoPrecio(p.total)}</span>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  )
}
