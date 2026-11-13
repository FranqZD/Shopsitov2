import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  Bell,
  Cookie,
  CupSoda,
  LayoutGrid,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Timer,
  Utensils,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { ahoraCampus, segundosHastaHora, type ProductoHoy } from '@shopsito/shared'
import { Boton } from '../components/Boton'
import { ChipFaltan, SEGUNDOS_URGENTE } from '../components/ChipHora'
import { Chip } from '../components/Chip'
import { FotoProducto } from '../components/FotoProducto'
import { ProntoSkeleton, TarjetaSkeleton } from '../components/Skeleton'
import { Tarjeta } from '../components/Tarjeta'
import { NOTIFICACIONES } from '../lib/ejemplos'
import { cosas, formatoPrecio, saludo, tituloHoy } from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import { useAhora } from '../lib/useAhora'
import { useProductosHoy } from '../lib/useProductosHoy'

// TODO: los productos aún no tienen categoría en la API; por ahora solo "Todo" filtra de verdad.
const CATEGORIAS: { id: string; nombre: string; Icono: LucideIcon }[] = [
  { id: 'todo', nombre: 'Todo', Icono: LayoutGrid },
  { id: 'comida', nombre: 'Comida', Icono: Utensils },
  { id: 'bebidas', nombre: 'Bebidas', Icono: CupSoda },
  { id: 'snacks', nombre: 'Snacks', Icono: Cookie },
  { id: 'articulos', nombre: 'Artículos', Icono: Package },
  { id: 'utiles', nombre: 'Útiles', Icono: Pencil },
]

/** Publicaciones que cierran en menos de 1 h aparecen en "Se acaba pronto". */
const SEGUNDOS_PRONTO = 3600

// TODO: contar con GET /api/notificaciones.
const SIN_LEER = NOTIFICACIONES.flatMap((g) => g.items).filter((n) => n.nueva).length

export function CatalogoPage() {
  const { estado, recargar } = useProductosHoy()
  const ahora = useAhora()
  const { fecha, hora } = ahoraCampus(ahora)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('todo')

  const segundos = (p: ProductoHoy) => segundosHastaHora(p.horaLimite, ahora)
  const productos = useMemo(() => (estado.tipo === 'listo' ? estado.productos : []), [estado])
  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return q ? productos.filter((p) => p.nombre.toLowerCase().includes(q)) : productos
  }, [productos, busqueda])
  // La lista que llega de la API ya viene ordenada por hora límite.
  const pronto = lista.filter((p) => p.cantidad > 0 && segundos(p) <= SEGUNDOS_PRONTO).slice(0, 5)

  const lleno = estado.tipo === 'listo' && productos.length > 0
  const subtitulo =
    estado.tipo === 'listo'
      ? productos.length
        ? `${cosas(productos.length)} a la venta en el campus`
        : 'Aún no hay nada a la venta'
      : 'Buscando lo de hoy…'

  return (
    <main className="flex flex-col">
      <div className="flex items-start justify-between px-5 pt-[18px]">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta-2">{saludo(hora)}</span>
          <h1 className="font-display text-[27px] leading-[1.1] font-bold tracking-[-0.015em] text-azul">
            {tituloHoy(fecha)}
          </h1>
          <span className="text-sm text-tinta-2">{subtitulo}</span>
        </div>
        <Link
          to="/notificaciones"
          aria-label={SIN_LEER ? `Notificaciones, ${SIN_LEER} sin leer` : 'Notificaciones'}
          className="relative flex size-[46px] flex-none items-center justify-center rounded-full bg-tarjeta text-azul shadow-tarjeta"
        >
          <Bell size={21} strokeWidth={1.9} aria-hidden="true" />
          {SIN_LEER > 0 && (
            <span className="absolute top-[9px] right-2.5 size-2.5 rounded-full border-2 border-tarjeta bg-mango" />
          )}
        </Link>
      </div>

      <div className="px-5 pt-[18px]">
        <label className="flex h-[50px] items-center gap-2.5 rounded-full bg-tarjeta px-[18px] text-tinta-2 shadow-tarjeta focus-within:ring-2 focus-within:ring-azul/30">
          <Search size={19} strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">Buscar en lo de hoy</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Molletes, café, calculadora…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-tinta outline-none placeholder:text-tinta-2"
          />
        </label>
      </div>

      {lleno && (
        <div className="px-5 pt-[18px]">
          <div className="relative flex items-center gap-3.5 overflow-hidden rounded-grande bg-banner py-[18px] pr-[18px] pl-5 text-white">
            <span className="absolute -top-[30px] -right-[26px] size-[120px] rounded-full bg-mango/16" />
            <div className="relative flex flex-1 flex-col gap-1">
              <span className="font-display text-[19px] leading-[1.15] font-bold">
                ¿Trajiste algo para vender?
              </span>
              <span className="text-sm text-[#D5E1F0]">Publícalo en 1 minuto.</span>
            </div>
            <Boton
              to="/vender"
              variante="mango"
              tamano="sm"
              className="relative flex-none px-[18px] text-[15px]"
            >
              <Plus size={17} strokeWidth={2.4} aria-hidden="true" />
              Publicar
            </Boton>
          </div>
        </div>
      )}

      <div className="sin-scrollbar flex gap-2 overflow-x-auto px-5 pt-[18px] pb-1">
        {CATEGORIAS.map(({ id, nombre, Icono }) => (
          <Chip
            key={id}
            activo={categoria === id}
            onClick={() => setCategoria(id)}
            icono={<Icono size={17} strokeWidth={2} aria-hidden="true" />}
          >
            {nombre}
          </Chip>
        ))}
      </div>

      {estado.tipo === 'cargando' && (
        <section aria-busy="true" className="pt-[22px]">
          <span className="sr-only">Cargando lo de hoy</span>
          <div className="px-5">
            <div className="h-6 w-[170px] skeleton rounded-full" />
          </div>
          <div className="flex gap-3 overflow-hidden px-5 pt-3.5">
            {[1, 2, 3].map((k) => (
              <ProntoSkeleton key={k} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 px-5 pt-[26px]">
            {[1, 2, 3, 4].map((k) => (
              <TarjetaSkeleton key={k} />
            ))}
          </div>
        </section>
      )}

      {estado.tipo === 'error' && (
        <section role="alert" className="px-5 pt-[22px]">
          <div className="flex flex-col items-center gap-3 rounded-hoja bg-tarjeta px-6 pt-7 pb-6 text-center shadow-tarjeta">
            <div className="flex size-[72px] items-center justify-center rounded-full bg-error-50 text-error">
              <WifiOff size={32} strokeWidth={1.9} aria-hidden="true" />
            </div>
            <h2 className="font-display text-[23px] leading-[1.15] font-bold">
              No se pudo cargar lo de hoy
            </h2>
            <p className="text-[15px] leading-normal text-tinta-2">
              Parece que se fue la señal. Pasa seguido entre edificios; dale otra vez cuando agarres
              red.
            </p>
            <Boton variante="suave" tamano="md" className="mt-1.5 text-base" onClick={recargar}>
              <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
              Reintentar
            </Boton>
            <span className="text-[12.5px] text-tinta-2">
              Último intento a las {ahoraCampus(estado.intento).hora.replace(/^0/, '')}
            </span>
          </div>
        </section>
      )}

      {estado.tipo === 'listo' && productos.length === 0 && (
        <section className="px-5 pt-[22px]">
          <div className="flex flex-col items-center gap-3 rounded-hoja bg-tarjeta px-6 pt-[30px] pb-[26px] text-center shadow-tarjeta">
            <div className="mb-1 flex size-[116px] items-center justify-center rounded-full bg-azul-50">
              <svg width="70" height="70" viewBox="0 0 100 100" aria-hidden="true">
                <path
                  d="M26 38 Q26 34 30 34 L70 34 Q74 34 74 38 L77 80 Q77 86 71 86 L29 86 Q23 86 23 80 Z"
                  className="fill-azul"
                />
                <path
                  d="M38 36 L38 30 Q38 18 50 18 Q62 18 62 30 L62 36"
                  fill="none"
                  className="stroke-azul"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="60" r="12" fill="#FFB547" />
              </svg>
            </div>
            <h2 className="font-display text-2xl leading-[1.15] font-bold tracking-[-0.01em] text-azul">
              Todavía nadie ha publicado hoy.
            </h2>
            <p className="text-[15px] leading-normal text-tinta-2">
              Lo que se publique aparece aquí hasta su hora límite. Si traes algo para vender,
              estrénala tú.
            </p>
            <Boton to="/vender" tamano="md" className="mt-2 text-base">
              <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
              Publicar algo
            </Boton>
          </div>
          {/* TODO: "Ayer se publicaron 23 cosas. La primera, a las 7:40." cuando la API dé ese dato. */}
        </section>
      )}

      {lleno && (
        <>
          {pronto.length > 0 && (
            <section aria-labelledby="pronto" className="pt-5">
              <div className="flex items-center justify-between px-5">
                <h2
                  id="pronto"
                  className="flex items-center gap-2 font-display text-[21px] font-bold tracking-[-0.01em]"
                >
                  <span className="flex size-[30px] items-center justify-center rounded-full bg-mango text-sobre-mango">
                    <Timer size={17} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  Se acaba pronto
                </h2>
              </div>
              <div className="sin-scrollbar flex gap-3 overflow-x-auto px-5 pt-2 pb-[18px]">
                {pronto.map((p) => {
                  const s = segundos(p)
                  return (
                    <Link
                      key={p.id}
                      to={`/producto/${p.id}`}
                      className="flex w-[156px] flex-none flex-col gap-2 rounded-tarjeta bg-tarjeta px-1.5 pt-1.5 pb-3 text-tinta shadow-tarjeta"
                    >
                      <div className="relative h-36 overflow-hidden rounded-[15px]">
                        <FotoProducto url={urlFoto(p.fotoKey)} className="size-full" />
                        <span className="absolute bottom-2 left-2">
                          {s <= SEGUNDOS_URGENTE ? (
                            <ChipFaltan segundos={s} />
                          ) : (
                            <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-white/95 pr-2.5 pl-2 text-xs font-bold text-[#1B2333] tabular-nums">
                              <span className="size-[7px] rounded-full bg-[#1B2333]" />
                              Faltan {Math.round(s / 60)} min
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-[3px] px-1.5">
                        <span className="num text-[19px] font-bold">{formatoPrecio(p.precio)}</span>
                        <span className="truncate text-[13.5px] leading-[1.3] font-medium">
                          {p.nombre}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          <section aria-labelledby="todo" className="flex flex-col gap-3.5 px-5 pt-2 pb-2">
            <div className="flex items-baseline justify-between">
              <h2 id="todo" className="font-display text-[21px] font-bold tracking-[-0.01em]">
                Todo lo de hoy
              </h2>
              <span className="text-[13px] text-tinta-2">
                {lista.length ? cosas(lista.length) : 'Nada con esa búsqueda'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
              {lista.map((p) => (
                <Tarjeta
                  key={p.id}
                  p={{ ...p, fotoUrl: urlFoto(p.fotoKey) }}
                  segundos={segundos(p)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
