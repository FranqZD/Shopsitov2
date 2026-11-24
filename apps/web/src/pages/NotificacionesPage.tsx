import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  RefreshCw,
  ShoppingBag,
  Star,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ahoraCampus, type Notificacion } from '@shopsito/shared'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { api } from '../lib/api'
import { refrescarAvisos } from '../lib/avisos'
import {
  agruparPorDia,
  destinoNotificacion,
  tipoNotificacion,
  type TipoNotificacion,
} from '../lib/notificaciones'
import { useSondeo } from '../lib/useSondeo'

const TIPOS: Record<TipoNotificacion, { Icono: LucideIcon; clases: string; relleno?: boolean }> = {
  ok: { Icono: Check, clases: 'bg-verde-50 text-verde' },
  reloj: { Icono: Timer, clases: 'bg-mango text-[#1B2333]' },
  bolsa: { Icono: ShoppingBag, clases: 'bg-azul-50 text-azul' },
  x: { Icono: X, clases: 'bg-error-50 text-error' },
  estrella: { Icono: Star, clases: 'bg-mango-50 text-mango-tinta', relleno: true },
  insignia: { Icono: BadgeCheck, clases: 'bg-mango text-[#1B2333]' },
}

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; lista: Notificacion[] }

// Tiempo real por consulta periódica: el Worker no mantiene conexiones abiertas.
export function NotificacionesPage() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })

  const cargar = useCallback(() => {
    api.notificaciones.listar().then(
      (lista) => setEstado({ tipo: 'listo', lista }),
      // Con datos en pantalla, un fallo en segundo plano no los tapa.
      (e: Error) =>
        setEstado((a) => (a.tipo === 'listo' ? a : { tipo: 'error', mensaje: e.message })),
    )
  }, [])
  useSondeo(cargar, 20_000)

  const lista = estado.tipo === 'listo' ? estado.lista : []
  const sinLeer = lista.filter((n) => !n.leida).length

  const poner = (cuales: (n: Notificacion) => boolean) =>
    setEstado((e) =>
      e.tipo === 'listo'
        ? { ...e, lista: e.lista.map((n) => (cuales(n) ? { ...n, leida: true } : n)) }
        : e,
    )

  const marcar = (id: string) => {
    poner((n) => n.id === id)
    api.notificaciones.marcarLeida(id).then(refrescarAvisos, cargar)
  }
  const marcarTodas = () => {
    poner(() => true)
    api.notificaciones.marcarTodas().then(refrescarAvisos, cargar)
  }

  return (
    <main className="flex flex-col px-3 pt-3.5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3 px-1">
        <BotonRedondo to="/" label="Regresar">
          <ChevronLeft size={22} strokeWidth={2.2} />
        </BotonRedondo>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.015em] text-azul">
          Notificaciones
        </h1>
      </div>

      {estado.tipo === 'cargando' && (
        <div aria-busy="true" className="flex flex-col gap-3 px-2 pt-6">
          <span className="sr-only">Cargando</span>
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-[68px] skeleton rounded-tarjeta" />
          ))}
        </div>
      )}

      {estado.tipo === 'error' && (
        <div
          role="alert"
          className="mx-2 mt-6 flex flex-col items-center gap-3 rounded-grande bg-tarjeta px-6 py-7 text-center shadow-tarjeta"
        >
          <h2 className="font-display text-[21px] font-bold">No se pudieron cargar</h2>
          <p className="text-[15px] text-tinta-2">{estado.mensaje}</p>
          <Boton variante="suave" tamano="md" onClick={cargar}>
            <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
            Reintentar
          </Boton>
        </div>
      )}

      {estado.tipo === 'listo' && lista.length === 0 && (
        <p className="mx-2 mt-6 rounded-grande bg-tarjeta px-6 py-7 text-center text-[15px] leading-normal text-tinta-2 shadow-tarjeta">
          Todavía no tienes avisos. Te avisamos cuando alguien te haga un pedido o responda el tuyo.
        </p>
      )}

      {estado.tipo === 'listo' && lista.length > 0 && (
        <>
          <div className="flex items-center justify-between px-2 pt-4">
            <span className="text-[15px] text-tinta-2">
              {sinLeer ? `${sinLeer} sin leer` : 'Todo leído'}
            </span>
            <Boton variante="suave" tamano="sm" disabled={!sinLeer} onClick={marcarTodas}>
              Marcar todo como leído
            </Boton>
          </div>

          {agruparPorDia(lista).map((g) => (
            <section key={g.titulo} className="flex flex-col gap-1.5 pt-6">
              <h2 className="px-2 pb-1 font-display text-lg font-bold">{g.titulo}</h2>
              {g.items.map((n) => {
                const { Icono, clases, relleno } = TIPOS[tipoNotificacion(n.mensaje)]
                return (
                  <Link
                    key={n.id}
                    to={destinoNotificacion(n.mensaje)}
                    onClick={() => !n.leida && marcar(n.id)}
                    className={`flex items-start gap-3.5 rounded-tarjeta px-3 py-3 ${n.leida ? '' : 'bg-tarjeta'}`}
                  >
                    <span
                      className={`flex size-[42px] flex-none items-center justify-center rounded-full ${clases}`}
                    >
                      <Icono
                        size={20}
                        strokeWidth={2.2}
                        fill={relleno ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex flex-1 flex-col gap-1">
                      <span
                        className={`text-[15px] leading-[1.4] ${n.leida ? '' : 'font-semibold'}`}
                      >
                        {n.mensaje}
                      </span>
                      <span className="text-[13px] text-tinta-2 tabular-nums">
                        {ahoraCampus(new Date(n.fecha)).hora}
                      </span>
                    </span>
                    {!n.leida && (
                      <span
                        aria-label="Sin leer"
                        className="mt-1.5 size-2.5 flex-none rounded-full bg-mango"
                      />
                    )}
                  </Link>
                )
              })}
            </section>
          ))}
        </>
      )}
    </main>
  )
}
