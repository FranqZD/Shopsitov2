import { Link, useParams } from 'react-router'
import { Banknote, Check, ChevronLeft, Clock, MapPin, Star, X } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { BarraAccion } from '../components/BarraAccion'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { PEDIDOS, type PasoPedido } from '../lib/ejemplos'
import { formatoCuenta, formatoPrecio, nombreCorto } from '../lib/formato'
import { useAhora } from '../lib/useAhora'
import { NotFoundPage } from './NotFoundPage'

// Las cuentas regresivas de ejemplo arrancan al cargar la app.
const inicio = Date.now()

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

// TODO: reemplazar por el pedido real (GET /api/pedidos/compras) y las acciones POST /api/pedidos/:id/cancelar.
export function PedidoDetallePage() {
  const { id } = useParams()
  const ahora = useAhora()
  const d = PEDIDOS.find((p) => p.id === id)
  if (!d) return <NotFoundPage />

  const hero = HERO[d.estado]
  const total = d.precio * d.cantidad
  const corto = nombreCorto(d.vendedor.nombre)
  // Cuenta regresiva de ejemplo: arranca al abrir la pantalla.
  const restante = Math.max(
    0,
    (d.segundosParaAceptar ?? 0) - Math.floor((ahora.getTime() - inicio) / 1000),
  )

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
            <span className="text-[13px] text-tinta-2">{d.cuando}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col gap-4">
            <div className={`flex flex-col gap-2 rounded-grande p-5 ${hero.fondo}`}>
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-11 flex-none items-center justify-center rounded-full ${hero.icono}`}
                >
                  {d.estado === 'pendiente' && <Clock size={22} strokeWidth={2.2} />}
                  {(d.estado === 'aceptado' || d.estado === 'entregado') && (
                    <Check size={22} strokeWidth={2.6} />
                  )}
                  {(d.estado === 'rechazado' || d.estado === 'cancelado') && (
                    <X size={22} strokeWidth={2.4} />
                  )}
                </span>
                <h2
                  className={`font-display text-[23px] leading-[1.15] font-bold tracking-[-0.01em] ${hero.titulo}`}
                >
                  {d.titulo}
                </h2>
              </div>
              <p className="text-[15px] leading-normal">{d.texto}</p>
              {d.mensaje && (
                <p className="mt-1 rounded-chico bg-tarjeta px-3.5 py-3 text-[14.5px] leading-[1.45] italic">
                  “{d.mensaje}” <span className="text-tinta-2 not-italic">— {corto}</span>
                </p>
              )}
              {d.estado === 'pendiente' && (
                <span className="mt-1.5 inline-flex h-[34px] items-center gap-2 self-start rounded-full bg-mango pr-3.5 pl-3 text-sm font-bold text-[#1B2333] tabular-nums">
                  <span className="size-2 animate-pulso rounded-full bg-[#1B2333]" />
                  Tiene {formatoCuenta(restante)} para aceptarlo
                </span>
              )}
            </div>

            <section
              aria-label="Seguimiento"
              className="rounded-grande bg-tarjeta px-5 pt-5 pb-2 shadow-tarjeta"
            >
              {d.pasos.map((paso, i) => (
                <Paso key={paso.titulo} paso={paso} ultimo={i === d.pasos.length - 1} />
              ))}
            </section>
          </div>
          <div className="flex flex-col gap-4 md:sticky md:top-28">
            <div className="flex flex-col gap-3.5 rounded-grande bg-tarjeta p-3.5 shadow-tarjeta">
              <div className="flex items-center gap-3">
                <img
                  src={d.foto}
                  alt=""
                  className="size-[60px] flex-none rounded-[15px] object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-[15px] font-bold">{d.producto}</span>
                  <span className="text-[13px] text-tinta-2">
                    {d.cantidad} × {formatoPrecio(d.precio)}
                  </span>
                </div>
                <span className="num text-xl font-bold">{formatoPrecio(total)}</span>
              </div>
              <Link
                to={`/perfil/${d.vendedor.id}`}
                className="flex items-center gap-2.5 rounded-chico bg-papel px-3 py-2.5 text-tinta"
              >
                <Avatar id={d.vendedor.id} nombre={d.vendedor.nombre} size={32} />
                <span className="flex-1 text-sm font-semibold">{d.vendedor.nombre}</span>
                <span className="text-[13.5px] font-bold text-azul">Ver perfil</span>
              </Link>
            </div>

            <div className="flex items-center gap-3 rounded-tarjeta bg-azul-50 py-3.5 pr-4 pl-3.5">
              <span className="flex size-[42px] flex-none items-center justify-center rounded-full bg-tarjeta text-azul">
                <MapPin size={20} strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[14.5px] font-bold text-azul">{d.punto}</span>
                <span className="text-[13.5px] leading-[1.4]">{d.puntoNota}</span>
              </div>
            </div>
            <BarraAccion>
              {d.estado === 'pendiente' && (
                <Boton variante="gris" tamano="md" className="w-full">
                  Cancelar pedido
                </Boton>
              )}
              {d.estado === 'aceptado' && (
                <div className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-verde-50 text-[15px] font-bold text-verde">
                  <Banknote size={18} strokeWidth={2} aria-hidden="true" />
                  Pagas {formatoPrecio(total)} en efectivo al recoger
                </div>
              )}
              {d.estado === 'entregado' && (
                <Boton to={`/calificar/${d.id}`} className="w-full">
                  <Star size={18} fill="#FFB547" strokeWidth={0} aria-hidden="true" />
                  Calificar a {corto}
                </Boton>
              )}
              {(d.estado === 'rechazado' || d.estado === 'cancelado') && (
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
