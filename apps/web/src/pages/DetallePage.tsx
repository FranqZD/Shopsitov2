import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft, ChevronRight, Clock, MapPin, Share, ShoppingBag } from 'lucide-react'
import { segundosHastaHora } from '@shopsito/shared'
import { Avatar } from '../components/Avatar'
import { BarraAccion } from '../components/BarraAccion'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { SEGUNDOS_URGENTE } from '../components/ChipHora'
import { FotoProducto } from '../components/FotoProducto'
import { Insignia, SinVerificar } from '../components/Insignia'
import { SelectorCantidad } from '../components/SelectorCantidad'
import { formatoCuenta, formatoFaltan, formatoPrecio, nombreCorto } from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import { useAhora } from '../lib/useAhora'
import { useProductosHoy } from '../lib/useProductosHoy'
import { EstadoCarga } from './EstadoCarga'

// TODO: usar GET /api/productos/:id cuando exista; por ahora se busca en el catálogo del día.
export function DetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { estado, recargar } = useProductosHoy()
  const ahora = useAhora()
  const [cantidad, setCantidad] = useState(1)
  const [rebote, setRebote] = useState(0)

  if (estado.tipo !== 'listo') return <EstadoCarga estado={estado} recargar={recargar} />
  const p = estado.productos.find((x) => x.id === id)
  if (!p) return <EstadoCarga estado={{ tipo: 'no-encontrado' }} recargar={recargar} />

  const agotado = p.cantidad === 0
  const restante = Math.max(0, segundosHastaHora(p.horaLimite, ahora))
  const urgente = !agotado && restante <= SEGUNDOS_URGENTE
  const q = Math.min(cantidad, Math.max(p.cantidad, 1))
  const corto = nombreCorto(p.vendedor.nombre)

  const compartir = () => {
    const datos = { title: p.nombre, url: location.href }
    if (navigator.share) navigator.share(datos).catch(() => {})
    else navigator.clipboard?.writeText(location.href)
  }

  return (
    <>
      <main className="flex flex-col pb-[130px] md:grid md:grid-cols-2 md:items-start md:gap-10 md:px-5 md:pt-4 md:pb-0 lg:gap-14">
        <div className="relative md:sticky md:top-28">
          <div className="h-[404px] overflow-hidden rounded-b-[32px] md:aspect-[4/5] md:h-auto md:rounded-hoja">
            <FotoProducto
              url={urlFoto(p.fotoKey)}
              alt={p.nombre}
              className="size-full"
              gris={agotado}
            />
          </div>
          <div className="absolute inset-x-4 top-3.5 flex justify-between">
            <BotonRedondo to="/" label="Regresar a lo de hoy">
              <ChevronLeft size={22} strokeWidth={2.2} />
            </BotonRedondo>
            <BotonRedondo onClick={compartir} label="Compartir">
              <Share size={20} strokeWidth={2} />
            </BotonRedondo>
          </div>
          <span
            className={`absolute -bottom-[21px] left-5 inline-flex h-[42px] items-center gap-2 rounded-full pr-4 pl-[13px] text-[14.5px] tabular-nums shadow-[0_2px_4px_rgb(27_35_51/0.06),0_10px_24px_rgb(27_35_51/0.12)] ${
              agotado
                ? 'bg-tinta text-papel'
                : urgente
                  ? 'bg-mango text-[#1B2333]'
                  : 'bg-tarjeta text-tinta'
            }`}
          >
            {urgente && <span className="size-2 animate-pulso rounded-full bg-[#1B2333]" />}
            {!agotado && !urgente && (
              <Clock size={17} strokeWidth={2.2} className="text-azul" aria-hidden="true" />
            )}
            <span className="font-bold">
              {agotado
                ? 'Agotado'
                : urgente
                  ? `Se acaba en ${formatoCuenta(restante)}`
                  : `Hasta ${p.horaLimite}`}
            </span>
            <span className="font-medium opacity-80">
              {agotado
                ? '· por hoy'
                : urgente
                  ? `· hasta ${p.horaLimite}`
                  : `· faltan ${formatoFaltan(restante)}`}
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-[18px] px-5 pt-10 pb-5 md:px-0 md:pt-6">
          <div className="flex flex-col gap-2.5">
            {/* TODO: pastilla de categoría y "Publicado a las 7:42" cuando la API tenga esos datos. */}
            <h1 className="font-display text-[29px] leading-[1.08] font-bold tracking-[-0.015em] md:text-[38px]">
              {p.nombre}
            </h1>
            {p.descripcion && (
              <p className="text-[15px] leading-[1.55] text-tinta-2">{p.descripcion}</p>
            )}
          </div>

          <div className="flex flex-col gap-3.5 rounded-[22px] bg-tarjeta p-[18px] shadow-tarjeta">
            <div className="flex items-end justify-between gap-3">
              <span
                className={`num text-[40px] leading-none font-extrabold tracking-[-0.02em] ${agotado ? 'text-tinta-2 line-through' : 'text-azul'}`}
              >
                {formatoPrecio(p.precio)}
              </span>
              <span
                className={`pb-0.5 text-sm font-bold tabular-nums ${agotado ? 'text-tinta-2' : urgente ? 'text-mango-tinta' : 'text-azul'}`}
              >
                {agotado ? 'Se acabaron' : p.cantidad === 1 ? 'Queda 1' : `Quedan ${p.cantidad}`}
              </span>
            </div>
            {/* TODO: barra "Quedan 4 de 12" (BarraExistencias) cuando la API guarde la cantidad inicial. */}
          </div>

          <Link
            to={`/perfil/${p.vendedor.id}`}
            className="flex items-center gap-3.5 rounded-[22px] bg-tarjeta p-3.5 text-tinta shadow-tarjeta"
          >
            <Avatar id={p.vendedor.id} nombre={p.vendedor.nombre} size={54} />
            <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold">{p.vendedor.nombre}</span>
                {p.vendedor.insigniaComunidad ? <Insignia /> : <SinVerificar />}
              </span>
              {/* TODO: estrellas y número de reseñas (GET /api/calificaciones/vendedor/:id). */}
              <span className="text-[13px] text-tinta-2">Ver su perfil y reseñas</span>
              {!p.vendedor.insigniaComunidad && (
                <span className="text-[12.5px] text-tinta-2">
                  Todavía no verifica su correo institucional.
                </span>
              )}
            </span>
            <ChevronRight size={20} strokeWidth={2} className="text-tinta-2" aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-3 rounded-tarjeta bg-azul-50 py-3.5 pr-4 pl-3.5">
            <span className="flex size-[42px] flex-none items-center justify-center rounded-full bg-tarjeta text-azul">
              <MapPin size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14.5px] font-bold text-azul">Lo recoges en el campus</span>
              <span className="text-[13.5px] leading-[1.4]">Eliges el punto al confirmar.</span>
            </div>
          </div>
          <BarraAccion>
            {agotado ? (
              <div className="flex flex-col gap-1">
                <Boton variante="gris" disabled className="w-full text-base">
                  Se acabó por hoy
                </Boton>
                <Link
                  to={`/perfil/${p.vendedor.id}`}
                  className="flex h-11 items-center self-center text-[14.5px] font-bold text-azul"
                >
                  Ver qué más vende {corto} hoy
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <SelectorCantidad
                  valor={q}
                  max={p.cantidad}
                  onChange={(n) => {
                    setCantidad(n)
                    setRebote((r) => r + 1)
                  }}
                />
                <Boton
                  key={rebote}
                  className={`flex-1 ${rebote ? 'animate-rebote' : ''}`}
                  onClick={() => navigate(`/producto/${p.id}/confirmar?cantidad=${q}`)}
                >
                  <ShoppingBag size={19} strokeWidth={2.1} aria-hidden="true" />
                  Pedir {q} · <span className="num">{formatoPrecio(p.precio * q)}</span>
                </Boton>
              </div>
            )}
          </BarraAccion>
        </div>
      </main>
    </>
  )
}
