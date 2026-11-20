import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Camera, Clock, Image, Minus, Plus, RefreshCw, X } from 'lucide-react'
import { ahoraCampus, segundosHastaHora, type MiPublicacion } from '@shopsito/shared'
import { BarraExistencias } from '../components/BarraExistencias'
import { Boton } from '../components/Boton'
import { Chip } from '../components/Chip'
import { SelectorCantidad } from '../components/SelectorCantidad'
import { FotoProducto } from '../components/FotoProducto'
import { api } from '../lib/api'
import { VENTAS } from '../lib/ejemplos'
import { formatoFaltan, formatoPrecio } from '../lib/formato'
import { prepararFoto, urlFoto } from '../lib/fotos'
import { useAhora } from '../lib/useAhora'
import { invalidarProductosHoy } from '../lib/useProductosHoy'
import { useVistaPrevia } from '../lib/useVistaPrevia'

type EstadoPublicaciones =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; publicaciones: MiPublicacion[] }

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
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [mias, setMias] = useState<EstadoPublicaciones>({ tipo: 'cargando' })
  const [foto, setFoto] = useState<File | null>(null)
  const vistaPrevia = useVistaPrevia(foto)
  const camaraRef = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)

  const cargarMias = useCallback(() => {
    api.productos.mios().then(
      (publicaciones) => setMias({ tipo: 'listo', publicaciones }),
      (e: Error) => setMias({ tipo: 'error', mensaje: e.message }),
    )
  }, [setMias])

  useEffect(cargarMias, [cargarMias])

  const publicar = async () => {
    const centavos = aCentavos(precio)
    if (centavos === null) {
      setMensaje({ texto: 'Revisa el precio: solo números, como 35 o 12.50.', ok: false })
      return
    }
    setMensaje(null)
    setEnviando(true)
    try {
      // TODO: guardar la categoría cuando la API la tenga.
      const creado = await api.productos.crear({
        nombre,
        descripcion,
        precio: centavos,
        cantidad,
        horaLimite: hora,
      })
      let texto = '¡Listo! Ya está en el catálogo.'
      if (foto) {
        // El producto ya existe aunque la foto falle: se puede reintentar desde "Editar".
        await api.productos.subirFoto(creado.id, await prepararFoto(foto)).catch((e: Error) => {
          texto = `Se publicó, pero la foto no se subió (${e.message}). Agrégala desde Editar.`
        })
      }
      setMensaje({ texto, ok: true })
      setNombre('')
      setDescripcion('')
      setPrecio('')
      setFoto(null)
      invalidarProductosHoy()
      cargarMias()
    } catch (e) {
      setMensaje({ texto: (e as Error).message, ok: false })
    } finally {
      setEnviando(false)
    }
  }

  const elegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) setFoto(archivo)
    // Permite volver a elegir el mismo archivo después de quitarlo.
    e.target.value = ''
  }

  return (
    <main className="flex flex-col md:mx-auto md:max-w-2xl lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-x-2">
      <div className="flex items-start justify-between px-5 pt-5 lg:col-span-2">
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
          void publicar()
        }}
      >
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">Foto</span>
          <div className="flex gap-3">
            {vistaPrevia && (
              <div className="relative size-[100px] flex-none">
                <img
                  src={vistaPrevia}
                  alt="Foto elegida"
                  className="size-full rounded-chico object-cover"
                />
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => setFoto(null)}
                  className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-tarjeta text-tinta shadow-tarjeta"
                >
                  <X size={17} strokeWidth={2.4} aria-hidden="true" />
                </button>
              </div>
            )}
            {/* `capture` abre la cámara directo en el celular; en computadora abre el selector. */}
            <input
              ref={camaraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={elegirFoto}
            />
            <input ref={galeriaRef} type="file" accept="image/*" hidden onChange={elegirFoto} />
            <button
              type="button"
              onClick={() => camaraRef.current?.click()}
              className="flex size-[100px] flex-col items-center justify-center gap-1.5 rounded-chico border-2 border-dashed border-azul-100 bg-azul-50 text-[13.5px] font-bold text-azul"
            >
              <Camera size={26} strokeWidth={2} aria-hidden="true" />
              {foto ? 'Otra foto' : 'Tomar foto'}
            </button>
            <button
              type="button"
              onClick={() => galeriaRef.current?.click()}
              className="flex size-[100px] flex-col items-center justify-center gap-1.5 rounded-chico bg-gris-50 text-[13.5px] font-semibold text-tinta-2"
            >
              <Image size={24} strokeWidth={2} aria-hidden="true" />
              Galería
            </button>
          </div>
          <span className="text-[13px] leading-[1.4] text-tinta-2">
            Una buena foto vende el doble. Es la que sale en el catálogo.
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
          <p
            role={mensaje.ok ? 'status' : 'alert'}
            className={`text-center text-sm font-semibold ${mensaje.ok ? 'text-verde' : 'text-error'}`}
          >
            {mensaje.texto}
          </p>
        )}
        <Boton type="submit" className="w-full" disabled={enviando}>
          {enviando ? 'Publicando…' : 'Publicar'}
        </Boton>
      </form>

      <section className="flex flex-col gap-3 px-5 pt-7 lg:sticky lg:top-28 lg:pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">
            Lo que vendes hoy
          </h2>
          {mias.tipo === 'listo' && (
            <span className="text-[13px] text-tinta-2">
              {mias.publicaciones.length}{' '}
              {mias.publicaciones.length === 1 ? 'publicación' : 'publicaciones'}
            </span>
          )}
        </div>
        {mias.tipo === 'cargando' && (
          <div aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Cargando</span>
            <div className="h-[150px] skeleton rounded-[22px]" />
            <div className="h-[150px] skeleton rounded-[22px]" />
          </div>
        )}
        {mias.tipo === 'error' && (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-[22px] bg-tarjeta px-5 py-6 text-center shadow-tarjeta"
          >
            <p className="text-[15px] text-tinta-2">{mias.mensaje}</p>
            <Boton
              variante="suave"
              tamano="md"
              onClick={() => {
                setMias({ tipo: 'cargando' })
                cargarMias()
              }}
            >
              <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
              Reintentar
            </Boton>
          </div>
        )}
        {mias.tipo === 'listo' && mias.publicaciones.length === 0 && (
          <p className="rounded-[22px] bg-tarjeta px-5 py-6 text-center text-[15px] text-tinta-2 shadow-tarjeta">
            Todavía no publicas nada hoy. Lo que subas aparece aquí con lo que llevas vendido.
          </p>
        )}
        {(mias.tipo === 'listo' ? mias.publicaciones : []).map((pub) => (
          <TarjetaPublicacion
            key={pub.id}
            pub={pub}
            ahora={ahora}
            onCambio={() => {
              invalidarProductosHoy()
              cargarMias()
            }}
          />
        ))}
      </section>
    </main>
  )
}

/** Pesos con hasta dos decimales a centavos; null si no es un número. */
function aCentavos(texto: string) {
  const centavos = Math.round(Number(texto) * 100)
  return texto.trim() !== '' && Number.isFinite(centavos) ? centavos : null
}

function TarjetaPublicacion({
  pub,
  ahora,
  onCambio,
}: {
  pub: MiPublicacion
  ahora: Date
  onCambio: () => void
}) {
  const [modo, setModo] = useState<'ver' | 'editar' | 'quitar'>('ver')
  const [nombre, setNombre] = useState(pub.nombre)
  const [precio, setPrecio] = useState(String(pub.precio / 100))
  const [cantidad, setCantidad] = useState(Math.max(1, pub.cantidad))
  const [hora, setHora] = useState(pub.horaLimite)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [fotoNueva, setFotoNueva] = useState<File | null>(null)
  const vistaPrevia = useVistaPrevia(fotoNueva)
  const fotoRef = useRef<HTMLInputElement>(null)

  const agotado = pub.estado === 'agotado' || pub.cantidad === 0
  const restante = segundosHastaHora(pub.horaLimite, ahora)
  const cerrada = !agotado && restante <= 0

  const abrirEditor = () => {
    setNombre(pub.nombre)
    setPrecio(String(pub.precio / 100))
    setCantidad(Math.max(1, pub.cantidad))
    setHora(pub.horaLimite)
    setFotoNueva(null)
    setError(null)
    setModo('editar')
  }

  const enviar = async (accion: () => Promise<unknown>) => {
    setError(null)
    setEnviando(true)
    try {
      await accion()
      setModo('ver')
      onCambio()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const guardar = () => {
    const centavos = aCentavos(precio)
    if (centavos === null) {
      setError('Revisa el precio: solo números, como 35 o 12.50.')
      return
    }
    // Solo mandamos lo que cambió: así una hora límite que ya pasó no bloquea editar el precio.
    const cambios = {
      ...(nombre.trim() !== pub.nombre && { nombre }),
      ...(centavos !== pub.precio && { precio: centavos }),
      ...(cantidad !== pub.cantidad && { cantidad }),
      ...(hora !== pub.horaLimite && { horaLimite: hora }),
    }
    void enviar(async () => {
      if (Object.keys(cambios).length > 0) await api.productos.actualizar(pub.id, cambios)
      if (fotoNueva) await api.productos.subirFoto(pub.id, await prepararFoto(fotoNueva))
    })
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] bg-tarjeta p-3.5 shadow-tarjeta">
      <div className="flex items-center gap-3">
        <FotoProducto
          url={urlFoto(pub.fotoKey)}
          className="size-[60px] flex-none rounded-chico"
          gris={agotado || cerrada}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] leading-[1.25] font-bold">{pub.nombre}</span>
          <span className="text-[13px] text-tinta-2">
            {formatoPrecio(pub.precio)} · hasta {pub.horaLimite}
            {!agotado && !cerrada && (
              <span className="font-bold text-azul"> · faltan {formatoFaltan(restante)}</span>
            )}
          </span>
        </div>
        <span
          className={`inline-flex h-[26px] flex-none items-center rounded-full px-2.5 text-[12.5px] font-bold ${agotado || cerrada ? 'bg-gris-50 text-tinta-2' : 'bg-verde-50 text-verde'}`}
        >
          {agotado ? 'Agotado' : cerrada ? 'Cerrada' : 'Activo'}
        </span>
      </div>

      {modo === 'editar' ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            guardar()
          }}
        >
          <div className="flex items-center gap-3">
            <FotoProducto
              url={vistaPrevia ?? urlFoto(pub.fotoKey)}
              className="size-[60px] flex-none rounded-chico"
            />
            {/* Sin `capture`: en el celular deja elegir entre cámara y galería. */}
            <input
              ref={fotoRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const archivo = e.target.files?.[0]
                if (archivo) setFotoNueva(archivo)
                e.target.value = ''
              }}
            />
            <Boton
              type="button"
              variante="suave"
              tamano="sm"
              onClick={() => fotoRef.current?.click()}
            >
              <Camera size={17} strokeWidth={2.2} aria-hidden="true" />
              {pub.fotoKey || fotoNueva ? 'Cambiar foto' : 'Agregar foto'}
            </Boton>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`nombre-${pub.id}`} className="text-[13px] font-bold">
              Nombre
            </label>
            <input
              id={`nombre-${pub.id}`}
              required
              minLength={2}
              maxLength={80}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`${CAMPO} h-12`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`precio-${pub.id}`} className="text-[13px] font-bold">
                Precio
              </label>
              <div
                className={`${CAMPO} flex h-12 items-center gap-2 focus-within:border-azul focus-within:ring-2 focus-within:ring-azul/30`}
              >
                <span className="num font-bold text-tinta-2">$</span>
                <input
                  id={`precio-${pub.id}`}
                  inputMode="decimal"
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value.replace(/[^\d.]/g, ''))}
                  className="w-full min-w-0 bg-transparent num font-bold outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`hora-${pub.id}`} className="text-[13px] font-bold">
                Hasta
              </label>
              <input
                id={`hora-${pub.id}`}
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={`${CAMPO} h-12 num`}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold">¿Cuántos quedan?</span>
            <SelectorCantidad valor={cantidad} max={99} onChange={setCantidad} alto={48} />
          </div>
          {error && (
            <p role="alert" className="text-center text-sm font-semibold text-error">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <Boton type="button" variante="gris" tamano="sm" onClick={() => setModo('ver')}>
              Cancelar
            </Boton>
            <Boton type="submit" tamano="sm" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </Boton>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px]">
              <span className={`font-bold ${agotado ? 'text-verde' : 'text-azul'}`}>
                {agotado
                  ? `Se vendieron las ${pub.total}`
                  : `Quedan ${pub.cantidad} de ${pub.total}`}
              </span>
              <span className="text-tinta-2">
                {agotado
                  ? formatoPrecio(pub.ingresos)
                  : `${pub.vendidos} vendidos · ${formatoPrecio(pub.ingresos)}`}
              </span>
            </div>
            {agotado ? (
              <BarraExistencias quedan={1} total={1} alto={8} color="bg-verde" />
            ) : (
              <BarraExistencias quedan={pub.cantidad} total={pub.total} alto={8} />
            )}
          </div>
          {modo === 'quitar' ? (
            <div className="flex flex-col gap-2.5 rounded-chico bg-papel p-3">
              <p className="text-sm leading-normal text-error">
                {pub.vendidos > 0
                  ? 'Se quita del catálogo y ya nadie lo puede pedir. Lo que ya vendiste se queda.'
                  : 'Se borra la publicación y desaparece del catálogo.'}
              </p>
              {error && (
                <p role="alert" className="text-sm font-semibold text-error">
                  {error}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <Boton variante="gris" tamano="sm" onClick={() => setModo('ver')}>
                  No, déjalo
                </Boton>
                <Boton
                  variante="peligro"
                  tamano="sm"
                  disabled={enviando}
                  onClick={() => void enviar(() => api.productos.eliminar(pub.id))}
                >
                  {enviando ? 'Quitando…' : 'Sí, quitar'}
                </Boton>
              </div>
            </div>
          ) : cerrada ? null : agotado ? (
            <Boton variante="suave" tamano="sm" className="w-full" onClick={abrirEditor}>
              Agregar más
            </Boton>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Boton variante="suave" tamano="sm" onClick={abrirEditor}>
                Editar
              </Boton>
              <Boton
                variante="gris"
                tamano="sm"
                onClick={() => {
                  setError(null)
                  setModo('quitar')
                }}
              >
                Quitar
              </Boton>
            </div>
          )}
        </>
      )}
    </div>
  )
}
