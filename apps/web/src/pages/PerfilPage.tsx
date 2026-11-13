import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Flag,
  LogOut,
  Moon,
  Share,
  Shield,
  Star,
} from 'lucide-react'
import { segundosHastaHora } from '@shopsito/shared'
import { Avatar } from '../components/Avatar'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { Estrellas } from '../components/Estrellas'
import { SinVerificar } from '../components/Insignia'
import { NavInferior } from '../components/NavInferior'
import { Tarjeta } from '../components/Tarjeta'
import { PEDIDOS, PERFIL } from '../lib/ejemplos'
import { cosas, nombreCorto } from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import { getSesion, guardarSesion } from '../lib/sesion'
import { cambiarTema, temaActual } from '../lib/tema'
import { useAhora } from '../lib/useAhora'
import { useProductosHoy } from '../lib/useProductosHoy'

// TODO: GET /api/usuarios/:id para nombre, insignia y fecha de alta; hoy se toman del catálogo del día.
export function PerfilPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { estado } = useProductosHoy()
  const ahora = useAhora()
  const [oscuro, setOscuro] = useState(() => temaActual() === 'oscuro')
  const sesion = getSesion()
  const propio = sesion?.usuario.id === id

  const productos =
    estado.tipo === 'listo' ? estado.productos.filter((p) => p.vendedor.id === id) : []
  const ejemplo = PEDIDOS.find((p) => p.vendedor.id === id)?.vendedor
  const nombre =
    productos[0]?.vendedor.nombre ??
    (propio ? sesion?.usuario.nombre : ejemplo?.nombre) ??
    'Alguien del campus'
  // null = no sabemos (sin productos hoy ni datos de ejemplo); entonces no se muestra la insignia.
  const insignia = productos[0]?.vendedor.insigniaComunidad ?? ejemplo?.insignia ?? null
  const corto = nombreCorto(nombre)

  const regresar = () => (history.length > 1 ? navigate(-1) : navigate('/'))
  const compartir = () => {
    if (navigator.share) navigator.share({ title: nombre, url: location.href }).catch(() => {})
    else navigator.clipboard?.writeText(location.href)
  }

  return (
    <div className={propio ? 'pb-[120px]' : 'pb-10'}>
      <div className="relative h-[150px] overflow-hidden rounded-b-hoja bg-azul-50 md:mx-5 md:mt-4 md:h-[190px] md:rounded-hoja">
        <span className="absolute -top-10 -right-10 size-[190px] rounded-full bg-mango/30" />
        <span className="absolute -bottom-20 left-10 size-[160px] rounded-full bg-azul-100" />
        <div className="absolute inset-x-4 top-3.5 flex justify-between">
          <BotonRedondo onClick={regresar} label="Regresar">
            <ChevronLeft size={22} strokeWidth={2.2} />
          </BotonRedondo>
          <BotonRedondo onClick={compartir} label="Compartir perfil">
            <Share size={20} strokeWidth={2} />
          </BotonRedondo>
        </div>
      </div>

      <main className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-x-8">
        <div className="-mt-[60px] flex flex-col items-center gap-2 px-5 text-center lg:col-span-2">
          <span className="relative rounded-full border-[6px] border-papel">
            <Avatar id={id} nombre={nombre} size={104} />
          </span>
          <h1 className="font-display text-[28px] font-bold tracking-[-0.015em]">{nombre}</h1>
          {insignia ? (
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-mango pr-3.5 pl-2.5 text-sm font-bold text-sobre-mango">
              <BadgeCheck size={17} strokeWidth={2.2} aria-hidden="true" />
              Miembro de la comunidad
            </span>
          ) : (
            insignia === false && <SinVerificar />
          )}
          {/* TODO: dato de ejemplo */}
          <span className="text-sm text-tinta-2">{PERFIL.desde}</span>
        </div>

        {/* TODO: estadísticas de ejemplo; salen de calificaciones y pedidos. */}
        <div className="grid grid-cols-3 gap-3 px-5 pt-5 md:mx-auto md:w-full md:max-w-2xl lg:col-span-2">
          {[
            { valor: PERFIL.rating, sub: `${PERFIL.totalResenas} reseñas`, estrella: true },
            { valor: PERFIL.ventas, sub: 'ventas' },
            { valor: PERFIL.tiempoAceptar, sub: 'en aceptar' },
          ].map((s) => (
            <div
              key={s.sub}
              className="flex flex-col items-center gap-0.5 rounded-tarjeta bg-tarjeta py-3.5 shadow-tarjeta"
            >
              <span className="flex items-center gap-1 num text-[23px] font-bold">
                {s.estrella && (
                  <Star size={17} className="fill-mango text-mango" aria-hidden="true" />
                )}
                {s.valor}
              </span>
              <span className="text-[13px] text-tinta-2">{s.sub}</span>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-3.5 px-5 pt-7 lg:col-start-1">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">
              {propio ? 'Lo que vendes hoy' : 'Lo que vende hoy'}
            </h2>
            <span className="text-[13px] text-tinta-2">{cosas(productos.length)}</span>
          </div>
          {productos.length === 0 ? (
            <p className="rounded-tarjeta bg-tarjeta px-4 py-5 text-center text-sm text-tinta-2 shadow-tarjeta">
              {propio ? 'Hoy no has publicado nada.' : `${corto} no tiene nada a la venta hoy.`}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 md:grid-cols-3 md:gap-x-4 md:gap-y-5">
              {productos.map((p) => (
                <Tarjeta
                  key={p.id}
                  p={{ ...p, fotoUrl: urlFoto(p.fotoKey) }}
                  segundos={segundosHastaHora(p.horaLimite, ahora)}
                />
              ))}
            </div>
          )}
        </section>

        {/* TODO: reseñas de ejemplo; reemplazar por GET /api/calificaciones/vendedor/:id. */}
        <section className="flex flex-col gap-3 px-5 pt-7 lg:col-start-2 lg:row-span-2 lg:row-start-3">
          <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">Reseñas</h2>
          <div className="flex items-center gap-6 rounded-grande bg-tarjeta px-6 py-5 shadow-tarjeta">
            <div className="flex flex-col items-center">
              <span className="num text-[44px] leading-none font-extrabold text-azul">
                {PERFIL.rating}
              </span>
              <span className="text-[13px] text-tinta-2">de 5</span>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              {PERFIL.barras.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-xs text-tinta-2 tabular-nums"
                >
                  <span className="w-2">{5 - i}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-azul-50">
                    <span
                      className="block h-full rounded-full bg-mango"
                      style={{ width: `${Math.round((c / PERFIL.totalResenas) * 100)}%` }}
                    />
                  </span>
                  <span className="w-4 text-right">{c}</span>
                </div>
              ))}
            </div>
          </div>
          {PERFIL.resenas.map((r) => (
            <article
              key={r.nombre}
              className="flex flex-col gap-2.5 rounded-grande bg-tarjeta p-4 shadow-tarjeta"
            >
              <div className="flex items-center gap-3">
                <Avatar id={r.nombre} nombre={r.nombre} size={38} />
                <div className="flex flex-1 flex-col">
                  <span className="text-[15px] font-bold">{r.nombre}</span>
                  <span className="text-[13px] text-tinta-2">
                    {r.cuando} · {r.que}
                  </span>
                </div>
                <Estrellas valor={r.estrellas} size={14} />
              </div>
              <p className="text-[15px] leading-normal">{r.texto}</p>
            </article>
          ))}
          <Boton variante="suave" tamano="md" className="w-full">
            Ver las {PERFIL.totalResenas} reseñas
          </Boton>
        </section>

        {propio ? (
          <section className="flex flex-col gap-2 px-5 pt-7 lg:col-start-1">
            <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">Tu cuenta</h2>
            <div className="flex flex-col overflow-hidden rounded-grande bg-tarjeta shadow-tarjeta">
              <button
                role="switch"
                aria-checked={oscuro}
                onClick={() => {
                  cambiarTema(oscuro ? 'claro' : 'oscuro')
                  setOscuro(!oscuro)
                }}
                className="flex h-14 items-center gap-3 px-4 text-left text-[15px] font-semibold"
              >
                <Moon size={20} strokeWidth={2} className="text-azul" aria-hidden="true" />
                <span className="flex-1">Modo oscuro</span>
                <span
                  className={`flex h-7 w-12 items-center rounded-full p-0.5 transition ${oscuro ? 'bg-azul' : 'bg-azul-100'}`}
                >
                  <span
                    className={`size-6 rounded-full bg-tarjeta shadow transition ${oscuro ? 'translate-x-5' : ''}`}
                  />
                </span>
              </button>
              {sesion?.usuario.rol === 'admin' && (
                <Link
                  to="/admin"
                  className="flex h-14 items-center gap-3 px-4 text-[15px] font-semibold"
                >
                  <Shield size={20} strokeWidth={2} className="text-azul" aria-hidden="true" />
                  <span className="flex-1">Panel de administración</span>
                  <ChevronRight size={20} className="text-tinta-2" aria-hidden="true" />
                </Link>
              )}
              <button
                onClick={() => {
                  guardarSesion(null)
                  navigate('/login')
                }}
                className="flex h-14 items-center gap-3 px-4 text-left text-[15px] font-semibold"
              >
                <LogOut size={20} strokeWidth={2} className="text-tinta-2" aria-hidden="true" />
                Salir
              </button>
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center gap-2 px-10 pt-7 text-center lg:col-start-1">
            {/* TODO: POST /api/reportes con objetivoId = id. */}
            <button className="flex h-11 items-center gap-2 text-[15px] font-semibold text-tinta-2">
              <Flag size={18} strokeWidth={2} aria-hidden="true" />
              Reportar a {corto}
            </button>
            <span className="text-[13px] leading-normal text-tinta-2">
              Lo revisa el equipo de Shopsito. {corto} no sabe quién hizo el reporte.
            </span>
          </div>
        )}
      </main>
      {propio && <NavInferior />}
    </div>
  )
}
