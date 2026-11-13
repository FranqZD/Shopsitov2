import { useState } from 'react'
import { Link } from 'react-router'
import { Camera, Clock, Image, Minus, Plus } from 'lucide-react'
import { ahoraCampus, segundosHastaHora } from '@shopsito/shared'
import { BarraExistencias } from '../components/BarraExistencias'
import { Boton } from '../components/Boton'
import { Chip } from '../components/Chip'
import { api } from '../lib/api'
import { MIS_PUBLICACIONES, VENTAS } from '../lib/ejemplos'
import { formatoPrecio } from '../lib/formato'
import { useAhora } from '../lib/useAhora'

// TODO: guardar la categoría cuando la API la tenga.
const CATEGORIAS = ['Comida', 'Bebidas', 'Snacks', 'Artículos', 'Útiles']
const MAX_DESC = 200

/** Opciones de hora límite: "En 1 h", horas fijas y "Fin del día" (18:00). */
function opcionesHora(ahora: Date) {
  const { hora } = ahoraCampus(ahora)
  const [h = 0, m = 0] = hora.split(':').map(Number)
  const enUnaHora = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const fijas = ['12:00', '14:00', '16:00'].filter((x) => x > hora)
  return [
    { texto: 'En 1 h', valor: enUnaHora },
    ...fijas.map((x) => ({ texto: x, valor: x })),
    { texto: 'Fin del día', valor: '18:00' },
  ].filter((o, i, arr) => arr.findIndex((x) => x.valor === o.valor) === i)
}

const CAMPO =
  'w-full rounded-[18px] border-[1.5px] border-azul-100 bg-tarjeta px-[18px] text-base text-tinta outline-none placeholder:text-tinta-2/80 focus:border-azul focus:ring-2 focus:ring-azul/30'

export function VenderPage() {
  const ahora = useAhora(30_000)
  const horas = opcionesHora(ahora)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [cantidad, setCantidad] = useState(6)
  const [categoria, setCategoria] = useState('Comida')
  const [hora, setHora] = useState(horas[1]?.valor ?? horas[0]!.valor)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const publicar = () => {
    setMensaje(null)
    // TODO: POST /api/productos responde 501 por ahora; también falta subir la foto a R2.
    api.productos
      .crear({
        nombre,
        descripcion,
        precio: Math.round(Number(precio) * 100),
        cantidad,
        horaLimite: hora,
      })
      .then(
        () => setMensaje('¡Listo! Ya está en el catálogo.'),
        (e: Error) => setMensaje(e.message),
      )
  }

  return (
    <main className="flex flex-col">
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-[-0.015em] text-azul">
            Vender
          </h1>
          <p className="text-[15px] text-tinta-2">¿Qué traes hoy?</p>
        </div>
        <Link
          to="/ventas"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-azul-50 pr-2.5 pl-4 text-[14.5px] font-bold text-azul"
        >
          Mis ventas
          {/* TODO: número de pedidos nuevos (GET /api/pedidos/ventas). */}
          <span className="flex size-[22px] items-center justify-center rounded-full bg-mango text-xs font-extrabold text-sobre-mango">
            {VENTAS.nuevo ? 1 : 0}
          </span>
        </Link>
      </div>

      <form
        className="mx-5 mt-5 flex flex-col gap-5 rounded-grande bg-tarjeta p-5 shadow-tarjeta"
        onSubmit={(e) => {
          e.preventDefault()
          publicar()
        }}
      >
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">Fotos</span>
          <div className="flex gap-3">
            {/* TODO: captura/selección de fotos y subida a R2 (POST /api/productos/:id/foto). */}
            <button
              type="button"
              className="flex size-[100px] flex-col items-center justify-center gap-1.5 rounded-chico border-2 border-dashed border-azul-100 bg-azul-50 text-[13.5px] font-bold text-azul"
            >
              <Camera size={26} strokeWidth={2} aria-hidden="true" />
              Tomar foto
            </button>
            <button
              type="button"
              className="flex size-[100px] flex-col items-center justify-center gap-1.5 rounded-chico bg-gris-50 text-[13.5px] font-semibold text-tinta-2"
            >
              <Image size={24} strokeWidth={2} aria-hidden="true" />
              Galería
            </button>
          </div>
          <span className="text-[13px] leading-[1.4] text-tinta-2">
            Una buena foto vende el doble. La primera es la que sale en el catálogo.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="vnombre" className="text-sm font-bold">
            ¿Qué vendes?
          </label>
          <input
            id="vnombre"
            required
            minLength={2}
            maxLength={80}
            placeholder="Ej. Molletes con pico de gallo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={`${CAMPO} h-[54px]`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="vdesc" className="flex justify-between text-sm font-bold">
            Descripción{' '}
            <span className="font-medium text-tinta-2">
              {descripcion.length}/{MAX_DESC}
            </span>
          </label>
          <textarea
            id="vdesc"
            rows={3}
            maxLength={MAX_DESC}
            placeholder="Qué trae, de qué tamaño es, si pica…"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={`${CAMPO} resize-none py-3.5`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="vprecio" className="text-sm font-bold">
              Precio
            </label>
            <div
              className={`${CAMPO} flex h-[54px] items-center gap-2 focus-within:border-azul focus-within:ring-2 focus-within:ring-azul/30`}
            >
              <span className="num text-lg font-bold text-tinta-2">$</span>
              <input
                id="vprecio"
                inputMode="decimal"
                required
                placeholder="35"
                value={precio}
                onChange={(e) => setPrecio(e.target.value.replace(/[^\d.]/g, ''))}
                className="w-full min-w-0 bg-transparent num text-lg font-bold outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span id="lcant" className="text-sm font-bold">
              ¿Cuántos traes?
            </span>
            <div
              role="group"
              aria-labelledby="lcant"
              className="flex h-[54px] items-center justify-between rounded-full bg-azul-50 px-1.5"
            >
              <button
                type="button"
                aria-label="Uno menos"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="flex size-[42px] items-center justify-center rounded-full bg-tarjeta text-azul shadow-[0_1px_3px_rgb(27_35_51/0.08)]"
              >
                <Minus size={16} strokeWidth={2.6} />
              </button>
              <span
                key={cantidad}
                aria-live="polite"
                className="animate-salto num text-xl font-bold text-azul"
              >
                {cantidad}
              </span>
              <button
                type="button"
                aria-label="Uno más"
                onClick={() => setCantidad(Math.min(99, cantidad + 1))}
                className="flex size-[42px] items-center justify-center rounded-full bg-tarjeta text-azul shadow-[0_1px_3px_rgb(27_35_51/0.08)]"
              >
                <Plus size={16} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold">Categoría</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <Chip
                key={c}
                activo={categoria === c}
                onClick={() => setCategoria(c)}
                className="text-[15px]"
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold">¿Hasta qué hora?</span>
          <div className="flex flex-wrap gap-2">
            {horas.map((h) => (
              <Chip
                key={h.valor}
                activo={hora === h.valor}
                onClick={() => setHora(h.valor)}
                className="h-[46px] text-[15px] tabular-nums"
              >
                {h.texto}
              </Chip>
            ))}
          </div>
          <div className="mt-1 flex items-start gap-2.5 rounded-chico bg-mango-50 px-3.5 py-3 text-mango-tinta">
            <Clock size={18} strokeWidth={2.2} className="mt-0.5 flex-none" aria-hidden="true" />
            <span className="text-sm leading-normal">
              A las <span className="num font-bold">{hora}</span> se quita sola del catálogo y los
              pedidos que no aceptaste se cancelan.
            </span>
          </div>
        </div>

        {mensaje && (
          <p role="status" className="text-center text-sm font-semibold text-error">
            {mensaje}
          </p>
        )}
        <Boton type="submit" className="w-full">
          Publicar
        </Boton>
      </form>

      <section className="flex flex-col gap-3 px-5 pt-7">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">
            Lo que vendes hoy
          </h2>
          <span className="text-[13px] text-tinta-2">{MIS_PUBLICACIONES.length} publicaciones</span>
        </div>
        {/* TODO: datos de ejemplo; reemplazar por las publicaciones reales del vendedor. */}
        {MIS_PUBLICACIONES.map((pub) => {
          const agotado = pub.quedan === 0
          const restante = segundosHastaHora(pub.hasta, ahora)
          return (
            <div
              key={pub.id}
              className="flex flex-col gap-3.5 rounded-[22px] bg-tarjeta p-3.5 shadow-tarjeta"
            >
              <div className="flex items-center gap-3">
                <img
                  src={pub.foto}
                  alt=""
                  className="size-[60px] flex-none rounded-chico object-cover"
                  style={agotado ? { filter: 'grayscale(0.4)' } : undefined}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] leading-[1.25] font-bold">{pub.nombre}</span>
                  <span className="text-[13px] text-tinta-2">
                    {formatoPrecio(pub.precio)} · hasta {pub.hasta}
                    {!agotado && restante > 0 && (
                      <span className="font-bold text-azul">
                        {' '}
                        · faltan {Math.round(restante / 60)} min
                      </span>
                    )}
                  </span>
                </div>
                <span
                  className={`inline-flex h-[26px] flex-none items-center rounded-full px-2.5 text-[12.5px] font-bold ${agotado ? 'bg-gris-50 text-tinta-2' : 'bg-verde-50 text-verde'}`}
                >
                  {agotado ? 'Agotado' : 'Activo'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className={`font-bold ${agotado ? 'text-verde' : 'text-azul'}`}>
                    {agotado
                      ? `Se vendieron las ${pub.total}`
                      : `Quedan ${pub.quedan} de ${pub.total}`}
                  </span>
                  <span className="text-tinta-2">
                    {agotado
                      ? formatoPrecio(pub.precio * pub.vendidos)
                      : `${pub.vendidos} vendidos · ${formatoPrecio(pub.precio * pub.vendidos)}`}
                  </span>
                </div>
                {agotado ? (
                  <BarraExistencias quedan={1} total={1} alto={8} color="bg-verde" />
                ) : (
                  <BarraExistencias quedan={pub.quedan} total={pub.total} alto={8} />
                )}
              </div>
              {agotado ? (
                <Boton variante="suave" tamano="sm" className="w-full">
                  Agregar más
                </Boton>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Boton variante="suave" tamano="sm">
                    Editar
                  </Boton>
                  <Boton variante="gris" tamano="sm">
                    Quitar
                  </Boton>
                </div>
              )}
            </div>
          )
        })}
      </section>
    </main>
  )
}
