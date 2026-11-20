import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Flag,
  LogOut,
  Mail,
  Moon,
  RefreshCw,
  Share,
  Shield,
  Star,
} from 'lucide-react'
import {
  segundosHastaHora,
  type PerfilUsuario,
  type Resena,
  type UsuarioPrivado,
} from '@shopsito/shared'
import { Avatar } from '../components/Avatar'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { Estrellas } from '../components/Estrellas'
import { SinVerificar } from '../components/Insignia'
import { NavInferior } from '../components/NavInferior'
import { Tarjeta } from '../components/Tarjeta'
import { api, ApiRequestError } from '../lib/api'
import { cosas, desdeCuando, haceCuanto, nombreConInicial, nombreCorto } from '../lib/formato'
import { urlFoto } from '../lib/fotos'
import { getSesion, guardarSesion } from '../lib/sesion'
import { cambiarTema, temaActual } from '../lib/tema'
import { useAhora } from '../lib/useAhora'
import { useProductosHoy } from '../lib/useProductosHoy'

/** Reseñas que se ven antes de "Ver las N reseñas". */
const RESENAS_VISIBLES = 3

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'no-encontrado' }
  | { tipo: 'listo'; perfil: PerfilUsuario; resenas: Resena[] }

function usePerfil(id: string) {
  // Se guarda de qué id es la respuesta: al cambiar de perfil se ve "cargando" sin limpiar en el efecto.
  const [respuesta, setRespuesta] = useState<{ id: string; estado: Estado } | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    const responder = (estado: Estado) => vigente && setRespuesta({ id, estado })
    Promise.all([api.usuarios.perfil(id), api.calificaciones.deVendedor(id)]).then(
      ([perfil, resenas]) => responder({ tipo: 'listo', perfil, resenas }),
      (e: Error) =>
        responder(
          e instanceof ApiRequestError && (e.status === 404 || e.status === 400)
            ? { tipo: 'no-encontrado' }
            : { tipo: 'error', mensaje: e.message },
        ),
    )
    return () => {
      vigente = false
    }
  }, [id, intento])

  const estado: Estado = respuesta?.id === id ? respuesta.estado : { tipo: 'cargando' }
  const recargar = () => {
    setRespuesta(null)
    setIntento((n) => n + 1)
  }
  return { estado, recargar }
}

export function PerfilPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { estado, recargar } = usePerfil(id)
  const regresar = () => (history.length > 1 ? navigate(-1) : navigate('/'))

  return (
    <div className="pb-10">
      <div className="relative h-[150px] overflow-hidden rounded-b-hoja bg-azul-50 md:mx-5 md:mt-4 md:h-[190px] md:rounded-hoja">
        <span className="absolute -top-10 -right-10 size-[190px] rounded-full bg-mango/30" />
        <span className="absolute -bottom-20 left-10 size-[160px] rounded-full bg-azul-100" />
        <div className="absolute inset-x-4 top-3.5 flex justify-between">
          <BotonRedondo onClick={regresar} label="Regresar">
            <ChevronLeft size={22} strokeWidth={2.2} />
          </BotonRedondo>
          {estado.tipo === 'listo' && (
            <BotonRedondo
              onClick={() => {
                const datos = { title: estado.perfil.nombre, url: location.href }
                if (navigator.share) navigator.share(datos).catch(() => {})
                else navigator.clipboard?.writeText(location.href)
              }}
              label="Compartir perfil"
            >
              <Share size={20} strokeWidth={2} />
            </BotonRedondo>
          )}
        </div>
      </div>
      {estado.tipo === 'listo' ? (
        <Perfil key={id} perfil={estado.perfil} resenas={estado.resenas} />
      ) : (
        <EstadoPerfil estado={estado} recargar={recargar} />
      )}
    </div>
  )
}

function EstadoPerfil({
  estado,
  recargar,
}: {
  estado: Exclude<Estado, { tipo: 'listo' }>
  recargar: () => void
}) {
  if (estado.tipo === 'cargando')
    return (
      <div aria-busy="true" className="-mt-[60px] flex flex-col items-center gap-3 px-5">
        <span className="sr-only">Cargando perfil</span>
        <span className="size-[116px] skeleton rounded-full border-[6px] border-papel" />
        <span className="h-7 w-48 skeleton rounded-full" />
        <span className="h-4 w-56 skeleton rounded-full" />
        <div className="grid w-full grid-cols-3 gap-3 pt-3 md:max-w-2xl">
          {[1, 2, 3].map((k) => (
            <span key={k} className="h-[74px] skeleton rounded-tarjeta" />
          ))}
        </div>
      </div>
    )
  return (
    <main className="px-5 pt-6 md:mx-auto md:max-w-lg">
      <div
        role={estado.tipo === 'error' ? 'alert' : undefined}
        className="flex flex-col items-center gap-3 rounded-hoja bg-tarjeta px-6 py-7 text-center shadow-tarjeta"
      >
        {estado.tipo === 'error' ? (
          <>
            <h1 className="font-display text-[23px] font-bold">No se pudo cargar el perfil</h1>
            <p className="text-[15px] text-tinta-2">{estado.mensaje}</p>
            <Boton variante="suave" tamano="md" onClick={recargar}>
              <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
              Reintentar
            </Boton>
          </>
        ) : (
          <>
            <h1 className="font-display text-[23px] font-bold text-azul">Este perfil no existe</h1>
            <p className="text-[15px] leading-normal text-tinta-2">
              Puede que la cuenta se haya dado de baja.
            </p>
            <Boton to="/" tamano="md">
              Ver qué hay hoy
            </Boton>
          </>
        )}
      </div>
    </main>
  )
}

function Perfil({ perfil, resenas }: { perfil: PerfilUsuario; resenas: Resena[] }) {
  const { estado } = useProductosHoy()
  const ahora = useAhora()
  const sesion = getSesion()
  const propio = sesion?.usuario.id === perfil.id
  const corto = nombreCorto(perfil.nombre)
  const [todas, setTodas] = useState(false)
  const { promedio, total, porEstrellas } = perfil.calificaciones

  const productos =
    estado.tipo === 'listo' ? estado.productos.filter((p) => p.vendedor.id === perfil.id) : []
  const visibles = todas ? resenas : resenas.slice(0, RESENAS_VISIBLES)

  return (
    <>
      <main
        className={`flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-8 ${propio ? 'pb-[110px] md:pb-0' : ''}`}
      >
        <div className="-mt-[60px] flex flex-col items-center gap-2 px-5 text-center lg:col-span-2">
          <span className="relative rounded-full border-[6px] border-papel">
            <Avatar id={perfil.id} nombre={perfil.nombre} size={104} />
          </span>
          <h1 className="font-display text-[28px] font-bold tracking-[-0.015em]">
            {perfil.nombre}
          </h1>
          {perfil.insigniaComunidad ? (
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-mango pr-3.5 pl-2.5 text-sm font-bold text-sobre-mango">
              <BadgeCheck size={17} strokeWidth={2.2} aria-hidden="true" />
              Miembro de la comunidad
            </span>
          ) : (
            <SinVerificar />
          )}
          <span className="text-sm text-tinta-2">{desdeCuando(perfil.creadoEn, ahora)}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 px-5 pt-5 md:mx-auto md:w-full md:max-w-2xl lg:col-span-2">
          {[
            {
              valor: promedio?.toFixed(1) ?? '—',
              sub: total === 1 ? '1 reseña' : `${total} reseñas`,
              estrella: promedio !== null,
            },
            { valor: perfil.ventas, sub: perfil.ventas === 1 ? 'venta' : 'ventas' },
            {
              valor: perfil.publicaciones,
              sub: perfil.publicaciones === 1 ? 'publicación' : 'publicaciones',
            },
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

        {/* Columna izquierda: en computadora "Tu cuenta" baja hasta donde terminan las reseñas. */}
        <div className="flex flex-col lg:col-start-1">
          <section className="flex flex-col gap-3.5 px-5 pt-7">
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

          {propio ? (
            <TuCuenta esAdmin={sesion?.usuario.rol === 'admin'} />
          ) : (
            <div className="flex flex-col items-center gap-2 px-10 pt-7 text-center lg:mt-auto">
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
        </div>

        <section className="flex flex-col gap-3 px-5 pt-7 lg:col-start-2 lg:row-start-3">
          <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">Reseñas</h2>
          {total === 0 ? (
            <p className="rounded-tarjeta bg-tarjeta px-4 py-5 text-center text-sm text-tinta-2 shadow-tarjeta">
              {propio
                ? 'Todavía no tienes reseñas. Llegan cuando entregas un pedido.'
                : `${corto} todavía no tiene reseñas.`}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-6 rounded-grande bg-tarjeta px-6 py-5 shadow-tarjeta">
                <div className="flex flex-col items-center">
                  <span className="num text-[44px] leading-none font-extrabold text-azul">
                    {promedio?.toFixed(1)}
                  </span>
                  <span className="text-[13px] text-tinta-2">de 5</span>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {porEstrellas.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-tinta-2 tabular-nums"
                    >
                      <span className="w-2">{5 - i}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-azul-50">
                        <span
                          className="block h-full rounded-full bg-mango"
                          style={{ width: `${Math.round((c / total) * 100)}%` }}
                        />
                      </span>
                      <span className="w-4 text-right">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
              {visibles.map((r) => (
                <article
                  key={r.id}
                  className="flex flex-col gap-2.5 rounded-grande bg-tarjeta p-4 shadow-tarjeta"
                >
                  <div className="flex items-center gap-3">
                    <Avatar id={r.comprador.id} nombre={r.comprador.nombre} size={38} />
                    <div className="flex flex-1 flex-col">
                      <span className="text-[15px] font-bold">
                        {nombreConInicial(r.comprador.nombre)}
                      </span>
                      <span className="text-[13px] text-tinta-2">
                        {haceCuanto(r.fecha, ahora)}
                        {r.producto && ` · ${r.producto}`}
                      </span>
                    </div>
                    <Estrellas valor={r.estrellas} size={14} />
                  </div>
                  {r.comentario && <p className="text-[15px] leading-normal">{r.comentario}</p>}
                </article>
              ))}
              {resenas.length > RESENAS_VISIBLES && (
                <Boton
                  variante="suave"
                  tamano="md"
                  className="w-full"
                  onClick={() => setTodas(!todas)}
                >
                  {todas ? 'Ver menos' : `Ver las ${resenas.length} reseñas`}
                </Boton>
              )}
            </>
          )}
        </section>
      </main>
      {propio && <NavInferior />}
    </>
  )
}

/** Ajustes de la cuenta propia. "Salir" solo aquí en celular; en computadora va en el menú del avatar. */
function TuCuenta({ esAdmin }: { esAdmin: boolean }) {
  const navigate = useNavigate()
  const [oscuro, setOscuro] = useState(() => temaActual() === 'oscuro')
  const [yo, setYo] = useState<UsuarioPrivado | null>(null)

  useEffect(() => {
    api.usuarios.yo().then(setYo, () => setYo(null))
  }, [])

  return (
    <section className="flex flex-col gap-2 px-5 pt-7 lg:mt-auto">
      <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">Tu cuenta</h2>
      <div className="flex flex-col overflow-hidden rounded-grande bg-tarjeta shadow-tarjeta">
        {yo && (
          <div className="flex min-h-14 items-center gap-3 px-4 py-2.5 text-[15px]">
            <Mail size={20} strokeWidth={2} className="flex-none text-azul" aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">{yo.correo}</span>
              {yo.correoInstitucional && yo.correoInstitucional !== yo.correo && (
                <span className="truncate text-[13px] text-tinta-2">
                  Institucional: {yo.correoInstitucional}
                </span>
              )}
            </span>
          </div>
        )}
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
        {esAdmin && (
          <Link to="/admin" className="flex h-14 items-center gap-3 px-4 text-[15px] font-semibold">
            <Shield size={20} strokeWidth={2} className="text-azul" aria-hidden="true" />
            <span className="flex-1">Panel de administración</span>
            <ChevronRight size={20} className="text-tinta-2" aria-hidden="true" />
          </Link>
        )}
        <button
          onClick={() => {
            guardarSesion(null)
            navigate('/login', { replace: true })
          }}
          className="flex h-14 items-center gap-3 px-4 text-left text-[15px] font-semibold md:hidden"
        >
          <LogOut size={20} strokeWidth={2} className="text-tinta-2" aria-hidden="true" />
          Salir
        </button>
      </div>
    </section>
  )
}
