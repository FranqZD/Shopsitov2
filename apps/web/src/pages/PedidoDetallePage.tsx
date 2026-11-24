import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Banknote, Check, ChevronLeft, Clock, MapPin, RefreshCw, Star, X } from 'lucide-react'
import { segundosHastaHora } from '@shopsito/shared'
import { Avatar } from '../components/Avatar'
import { BarraAccion } from '../components/BarraAccion'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { SEGUNDOS_URGENTE } from '../components/ChipHora'
import { FotoProducto } from '../components/FotoProducto'
import { api } from '../lib/api'
import { refrescarAvisos } from '../lib/avisos'
import {
  formatoCuenta,
  formatoFaltan,
  formatoPrecio,
  haceCuanto,
  nombreCorto,
} from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import { estadoVigente, heroPedido, horaDe, pasosPedido, type PasoPedido } from '../lib/pedidos'
import { useAhora } from '../lib/useAhora'
import { useCompras } from '../lib/useCompras'
import { NotFoundPage } from './NotFoundPage'

const HERO = {
  pendiente: { fondo: 'bg-mango-50', icono: 'bg-mango text-[#1B2333]', titulo: 'text-mango-tinta' },
  aceptado: { fondo: 'bg-verde-50', icono: 'bg-verde text-sobre-verde', titulo: 'text-verde' },
  entregado: { fondo: 'bg-verde-50', icono: 'bg-verde text-sobre-verde', titulo: 'text-verde' },
  rechazado: { fondo: 'bg-error-50', icono: 'bg-error text-tarjeta', titulo: 'text-error' },
  cancelado: { fondo: 'bg-gris-50', icono: 'bg-tinta-2 text-tarjeta', titulo: 'text-tinta-2' },
}

const PASO = {
  hecho: { icono: 'bg-verde text-sobre-verde', texto: 'text-tinta', linea: 'bg-verde' },
  actual: {
    icono: 'bg-mango text-[#1B2333] shadow-[0_0_0_5px_var(--color-mango-50)]',
    texto: 'text-tinta',
    linea: 'bg-azul-50',
  },
  mal: { icono: 'bg-error text-tarjeta', texto: 'text-error', linea: 'bg-transparent' },
  falta: { icono: 'bg-azul-50 text-azul', texto: 'text-tinta-2', linea: 'bg-azul-50' },
}

function Paso({ paso, ultimo }: { paso: PasoPedido; ultimo: boolean }) {
  const c = PASO[paso.tipo]
  return (
    <div className="grid grid-cols-[32px_1fr] gap-3.5">
      <div className="flex flex-col items-center">
        <span
          className={`flex size-8 flex-none items-center justify-center rounded-full ${c.icono}`}
        >
          {paso.tipo === 'hecho' && <Check size={16} strokeWidth={3} />}
          {paso.tipo === 'actual' && (
            <span className="size-2.5 animate-pulso rounded-full bg-[#1B2333]" />
          )}
          {paso.tipo === 'mal' && <X size={15} strokeWidth={3} />}
          {paso.tipo === 'falta' && <span className="size-2 rounded-full bg-azul-100" />}
        </span>
        <span
          className={`my-1 min-h-[22px] w-[3px] flex-1 rounded-full ${ultimo ? 'bg-transparent' : c.linea}`}
        />
      </div>
      <div className="flex flex-col gap-0.5 pt-1 pb-[18px]">
        <span className="flex justify-between gap-2.5">
          <span className={`text-[15px] font-bold ${c.texto}`}>{paso.titulo}</span>
          <span className="text-[13px] font-semibold text-tinta-2 tabular-nums">{paso.hora}</span>
        </span>
        <span className="text-[13.5px] leading-[1.4] text-tinta-2">{paso.sub}</span>
      </div>
    </div>
  )
}

/** Marco de la pantalla mientras carga o si falla (el pedido sale de GET /api/pedidos/compras). */
function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col gap-5 px-5 pt-3.5 md:mx-auto md:max-w-lg">
      <BotonRedondo to="/pedidos" label="Regresar a mis pedidos">
        <ChevronLeft size={22} strokeWidth={2.2} />
      </BotonRedondo>
      {children}
    </main>
  )
}

export function PedidoDetallePage() {
  const { id } = useParams()
  const ahora = useAhora()
  const { estado, recargar } = useCompras()
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (estado.tipo === 'cargando') {
    return (
      <Marco>
        <div aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Cargando</span>
          <div className="h-[150px] skeleton rounded-grande" />
          <div className="h-[220px] skeleton rounded-grande" />
        </div>
      </Marco>
    )
  }
  if (estado.tipo === 'error') {
    return (
      <Marco>
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-hoja bg-tarjeta px-6 py-7 text-center shadow-tarjeta"
        >
          <h1 className="font-display text-[23px] font-bold">No se pudo cargar</h1>
          <p className="text-[15px] text-tinta-2">{estado.mensaje}</p>
          <Boton variante="suave" tamano="md" onClick={recargar}>
            <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
            Reintentar
          </Boton>
        </div>
      </Marco>
    )
  }

  const p = estado.pedidos.find((x) => x.id === id)
  if (!p) return <NotFoundPage />

  const vigente = estadoVigente(p, ahora)
  const hero = HERO[vigente]
  const corto = nombreCorto(p.vendedor.nombre)
  const { titulo, texto } = heroPedido(p, vigente, corto)
  const pasos = pasosPedido(p, vigente, corto)
  const restante = Math.max(0, segundosHastaHora(p.horaLimite, ahora))

  const cancelar = async () => {
    setCancelando(true)
    setError(null)
    try {
      await api.pedidos.cancelar(p.id)
      void refrescarAvisos()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCancelando(false)
      recargar()
    }
  }

  return (
    <>
      <main className="flex flex-col gap-4 px-5 pt-3.5 pb-[130px] md:pb-0">
        <div className="-ml-1 flex items-center gap-3">
          <BotonRedondo to="/pedidos" label="Regresar a mis pedidos">
            <ChevronLeft size={22} strokeWidth={2.2} />
          </BotonRedondo>
          <div className="flex flex-col">
            <h1 className="font-display text-2xl font-bold tracking-[-0.015em] text-azul">
              Tu pedido
            </h1>
            <span className="text-[13px] text-tinta-2">
              {haceCuanto(p.creadoEn)}, {horaDe(p.creadoEn)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col gap-4">
            <div className={`flex flex-col gap-2 rounded-grande p-5 ${hero.fondo}`}>
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-11 flex-none items-center justify-center rounded-full ${hero.icono}`}
                >
                  {vigente === 'pendiente' && <Clock size={22} strokeWidth={2.2} />}
                  {(vigente === 'aceptado' || vigente === 'entregado') && (
                    <Check size={22} strokeWidth={2.6} />
                  )}
                  {(vigente === 'rechazado' || vigente === 'cancelado') && (
                    <X size={22} strokeWidth={2.4} />
                  )}
                </span>
                <h2
                  className={`font-display text-[23px] leading-[1.15] font-bold tracking-[-0.01em] ${hero.titulo}`}
                >
                  {titulo}
                </h2>
              </div>
              <p className="text-[15px] leading-normal">{texto}</p>
              {vigente === 'pendiente' && (
                <span className="mt-1.5 inline-flex h-[34px] items-center gap-2 self-start rounded-full bg-mango pr-3.5 pl-3 text-sm font-bold text-[#1B2333] tabular-nums">
                  <span className="size-2 animate-pulso rounded-full bg-[#1B2333]" />
                  Tiene{' '}
                  {restante <= SEGUNDOS_URGENTE
                    ? formatoCuenta(restante)
                    : formatoFaltan(restante)}{' '}
                  para aceptarlo
                </span>
              )}
            </div>

            <section
              aria-label="Seguimiento"
              className="rounded-grande bg-tarjeta px-5 pt-5 pb-2 shadow-tarjeta"
            >
              {pasos.map((paso, i) => (
                <Paso key={paso.titulo} paso={paso} ultimo={i === pasos.length - 1} />
              ))}
            </section>
          </div>
          <div className="flex flex-col gap-4 md:sticky md:top-28">
            <div className="flex flex-col gap-3.5 rounded-grande bg-tarjeta p-3.5 shadow-tarjeta">
              {p.items.map((i) => (
                <div key={i.productoId} className="flex items-center gap-3">
                  <FotoProducto
                    url={urlFoto(i.fotoKey)}
                    className="size-[60px] flex-none rounded-[15px]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-[15px] font-bold">{i.nombre}</span>
                    <span className="text-[13px] text-tinta-2">
                      {i.cantidad} × {formatoPrecio(i.precioUnitario)}
                    </span>
                  </div>
                  <span className="num text-xl font-bold">
                    {formatoPrecio(i.precioUnitario * i.cantidad)}
                  </span>
                </div>
              ))}
              {p.items.length > 1 && (
                <div className="flex items-center justify-between border-t border-azul-50 pt-3">
                  <span className="text-[14.5px] font-bold text-azul">Total</span>
                  <span className="num text-xl font-bold">{formatoPrecio(p.total)}</span>
                </div>
              )}
              <Link
                to={`/perfil/${p.vendedor.id}`}
                className="flex items-center gap-2.5 rounded-chico bg-papel px-3 py-2.5 text-tinta"
              >
                <Avatar id={p.vendedor.id} nombre={p.vendedor.nombre} size={32} />
                <span className="flex-1 text-sm font-semibold">{p.vendedor.nombre}</span>
                <span className="text-[13.5px] font-bold text-azul">Ver perfil</span>
              </Link>
            </div>

            <div className="flex items-center gap-3 rounded-tarjeta bg-azul-50 py-3.5 pr-4 pl-3.5">
              <span className="flex size-[42px] flex-none items-center justify-center rounded-full bg-tarjeta text-azul">
                <MapPin size={20} strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[14.5px] font-bold text-azul">{p.puntoEntrega.nombre}</span>
                <span className="text-[13.5px] leading-[1.4]">
                  {p.puntoEntrega.ubicacion} · antes de las {p.horaLimite}
                </span>
              </div>
            </div>
            <BarraAccion>
              {error && (
                <p role="alert" className="text-center text-[13.5px] font-semibold text-error">
                  {error}
                </p>
              )}
              {vigente === 'pendiente' && (
                <Boton
                  variante="gris"
                  tamano="md"
                  className="w-full"
                  onClick={cancelar}
                  disabled={cancelando}
                >
                  {cancelando ? 'Cancelando…' : 'Cancelar pedido'}
                </Boton>
              )}
              {vigente === 'aceptado' && (
                <div className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-verde-50 text-[15px] font-bold text-verde">
                  <Banknote size={18} strokeWidth={2} aria-hidden="true" />
                  Pagas {formatoPrecio(p.total)} en efectivo al recoger
                </div>
              )}
              {vigente === 'entregado' && (
                <Boton to={`/calificar/${p.id}`} className="w-full">
                  <Star size={18} fill="#FFB547" strokeWidth={0} aria-hidden="true" />
                  Calificar a {corto}
                </Boton>
              )}
              {(vigente === 'rechazado' || vigente === 'cancelado') && (
                <Boton to="/" className="w-full">
                  Ver qué más hay hoy
                </Boton>
              )}
            </BarraAccion>
          </div>
        </div>
      </main>
    </>
  )
}
