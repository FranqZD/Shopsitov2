import { Link } from 'react-router'
import { useItemsNav } from '../lib/navegacion'

/** Celular: pastilla flotante abajo con Hoy · Vender · Pedidos · Perfil. */
export function NavInferior() {
  const items = useItemsNav()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] px-4 pt-3 pb-[max(22px,env(safe-area-inset-bottom))] md:hidden">
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
