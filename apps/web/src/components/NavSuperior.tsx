import { Bell } from 'lucide-react'
import { Link } from 'react-router'
import { NOTIFICACIONES_SIN_LEER, useItemsNav } from '../lib/navegacion'
import { getSesion } from '../lib/sesion'
import { Avatar } from './Avatar'
import { LogoShopsito } from './LogoShopsito'

/** Tablet y computadora: la misma navegación como pastilla flotante arriba. */
export function NavSuperior() {
  const items = useItemsNav()
  const sesion = getSesion()
  return (
    <div className="sticky top-0 z-30 hidden bg-papel/95 px-6 pt-4 pb-2 md:block">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-[70px] max-w-6xl items-center gap-2 rounded-full bg-tarjeta pr-3 pl-5 shadow-flotante"
      >
        <Link to="/" className="mr-2 flex flex-none items-center gap-2.5">
          <LogoShopsito size={34} />
          <span className="font-display text-[22px] font-bold tracking-[-0.01em] text-azul">
            Shopsito
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-center gap-1">
          {items
            .filter((i) => i.label !== 'Perfil')
            .map(({ to, label, Icono, activo, badge }) => (
              <Link
                key={label}
                to={to}
                aria-current={activo ? 'page' : undefined}
                className={`relative flex h-11 items-center gap-2 rounded-full px-4 text-[15px] ${activo ? 'bg-azul-50 font-bold text-azul' : 'font-semibold text-tinta-2 hover:text-tinta'}`}
              >
                <Icono size={20} strokeWidth={activo ? 2 : 1.9} aria-hidden="true" />
                {label}
                {!!badge && (
                  <span className="flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-mango px-1 text-[11px] font-extrabold text-sobre-mango">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
        </div>
        <Link
          to="/notificaciones"
          aria-label={
            NOTIFICACIONES_SIN_LEER
              ? `Notificaciones, ${NOTIFICACIONES_SIN_LEER} sin leer`
              : 'Notificaciones'
          }
          className="relative flex size-11 flex-none items-center justify-center rounded-full bg-azul-50 text-azul"
        >
          <Bell size={20} strokeWidth={1.9} aria-hidden="true" />
          {NOTIFICACIONES_SIN_LEER > 0 && (
            <span className="absolute top-2 right-2.5 size-2.5 rounded-full border-2 border-azul-50 bg-mango" />
          )}
        </Link>
        {sesion ? (
          <Link
            to={`/perfil/${sesion.usuario.id}`}
            aria-label="Tu perfil"
            className="flex flex-none items-center gap-2 rounded-full py-1 pr-4 pl-1 hover:bg-azul-50"
          >
            <Avatar id={sesion.usuario.id} nombre={sesion.usuario.nombre} size={40} />
            <span className="hidden text-[15px] font-semibold lg:inline">
              {sesion.usuario.nombre.split(' ')[0]}
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex h-11 flex-none items-center rounded-full bg-azul px-5 text-[15px] font-bold text-sobre-azul"
          >
            Entrar
          </Link>
        )}
      </nav>
    </div>
  )
}
