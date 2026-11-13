import { CirclePlus, ShoppingBag, Sun, User, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { ACTIVOS, PEDIDOS } from '../lib/ejemplos'
import { getSesion } from '../lib/sesion'

// TODO: contar con GET /api/pedidos/compras cuando exista (pedidos pendientes o aceptados).
const PEDIDOS_ACTIVOS = PEDIDOS.filter((p) => ACTIVOS.includes(p.estado)).length

/** Pastilla flotante con Hoy · Vender · Pedidos · Perfil (DESIGN.md §5). */
export function NavInferior() {
  const { pathname } = useLocation()
  const sesion = getSesion()
  const items: { to: string; label: string; Icono: LucideIcon; activo: boolean; badge?: number }[] =
    [
      { to: '/', label: 'Hoy', Icono: Sun, activo: pathname === '/' },
      {
        to: '/vender',
        label: 'Vender',
        Icono: CirclePlus,
        activo: pathname.startsWith('/vender') || pathname.startsWith('/ventas'),
      },
      {
        to: '/pedidos',
        label: 'Pedidos',
        Icono: ShoppingBag,
        activo: pathname.startsWith('/pedidos'),
        badge: PEDIDOS_ACTIVOS,
      },
      {
        to: sesion ? `/perfil/${sesion.usuario.id}` : '/login',
        label: 'Perfil',
        Icono: User,
        activo: pathname.startsWith('/perfil'),
      },
    ]
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] px-4 pt-3 pb-[max(22px,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Principal"
        className="pointer-events-auto grid h-[70px] grid-cols-4 items-center rounded-full bg-tarjeta px-1.5 shadow-flotante"
      >
        {items.map(({ to, label, Icono, activo, badge }) => (
          <Link
            key={label}
            to={to}
            aria-current={activo ? 'page' : undefined}
            className={`flex flex-col items-center gap-[3px] ${activo ? 'text-azul' : 'text-tinta-2'}`}
          >
            <span
              className={`relative flex h-[30px] w-[54px] items-center justify-center rounded-full ${activo ? 'bg-azul-50' : ''}`}
            >
              <Icono size={21} strokeWidth={activo ? 2 : 1.9} aria-hidden="true" />
              {!!badge && (
                <span className="absolute -top-0.5 right-[7px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-mango px-1 text-[10.5px] font-extrabold text-sobre-mango">
                  {badge}
                </span>
              )}
            </span>
            <span className={`text-[11.5px] ${activo ? 'font-bold' : 'font-semibold'}`}>
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
