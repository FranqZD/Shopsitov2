import { useState } from 'react'
import { Link } from 'react-router'
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ShoppingBag,
  Star,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { NOTIFICACIONES, type TipoNotificacion } from '../lib/ejemplos'

const TIPOS: Record<TipoNotificacion, { Icono: LucideIcon; clases: string; relleno?: boolean }> = {
  ok: { Icono: Check, clases: 'bg-verde-50 text-verde' },
  reloj: { Icono: Timer, clases: 'bg-mango text-[#1B2333]' },
  bolsa: { Icono: ShoppingBag, clases: 'bg-azul-50 text-azul' },
  x: { Icono: X, clases: 'bg-error-50 text-error' },
  estrella: { Icono: Star, clases: 'bg-mango-50 text-mango-tinta', relleno: true },
  insignia: { Icono: BadgeCheck, clases: 'bg-mango text-[#1B2333]' },
}

// TODO: GET /api/notificaciones y PATCH /api/notificaciones/:id/leida.
// TODO(tiempo real): por ahora no hay push; se consulta al abrir la pantalla.
export function NotificacionesPage() {
  const [leidas, setLeidas] = useState<string[]>([])
  const nueva = (id: string, n: boolean) => n && !leidas.includes(id)
  const sinLeer = NOTIFICACIONES.flatMap((g) => g.items).filter((n) => nueva(n.id, n.nueva)).length

  return (
    <main className="flex flex-col px-3 pt-3.5 pb-10">
      <div className="flex items-center gap-3 px-1">
        <BotonRedondo to="/" label="Regresar">
          <ChevronLeft size={22} strokeWidth={2.2} />
        </BotonRedondo>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.015em] text-azul">
          Notificaciones
        </h1>
      </div>
      <div className="flex items-center justify-between px-2 pt-4">
        <span className="text-[15px] text-tinta-2">
          {sinLeer ? `${sinLeer} sin leer` : 'Todo leído'}
        </span>
        <Boton
          variante="suave"
          tamano="sm"
          disabled={!sinLeer}
          onClick={() => setLeidas(NOTIFICACIONES.flatMap((g) => g.items.map((n) => n.id)))}
        >
          Marcar todo como leído
        </Boton>
      </div>

      {NOTIFICACIONES.map((g) => (
        <section key={g.titulo} className="flex flex-col gap-1.5 pt-6">
          <h2 className="px-2 pb-1 font-display text-lg font-bold">{g.titulo}</h2>
          {g.items.map((n) => {
            const { Icono, clases, relleno } = TIPOS[n.tipo]
            const esNueva = nueva(n.id, n.nueva)
            const contenido = (
              <>
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
                  <span className={`text-[15px] leading-[1.4] ${esNueva ? 'font-semibold' : ''}`}>
                    {n.texto}
                  </span>
                  <span className="text-[13px] text-tinta-2 tabular-nums">{n.hora}</span>
                </span>
                {esNueva && (
                  <span
                    aria-label="Sin leer"
                    className="mt-1.5 size-2.5 flex-none rounded-full bg-mango"
                  />
                )}
              </>
            )
            const clasesFila = `flex items-start gap-3.5 rounded-tarjeta px-3 py-3 ${esNueva ? 'bg-tarjeta' : ''}`
            const marcar = () => setLeidas((l) => [...l, n.id])
            return n.href ? (
              <Link key={n.id} to={n.href} onClick={marcar} className={clasesFila}>
                {contenido}
              </Link>
            ) : (
              <div key={n.id} onClick={marcar} className={clasesFila}>
                {contenido}
              </div>
            )
          })}
        </section>
      ))}
    </main>
  )
}
