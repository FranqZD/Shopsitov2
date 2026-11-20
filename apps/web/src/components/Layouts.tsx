import { Outlet } from 'react-router'
import { NavInferior } from './NavInferior'
import { NavSuperior } from './NavSuperior'

/**
 * Celular: columna de 430 px. Tablet/computadora (md+): nav superior y contenido hasta 1152 px.
 * Las pantallas deciden sus columnas con prefijos md:/lg:.
 */
function LayoutApp({ navInferior }: { navInferior: boolean }) {
  return (
    <div className="min-h-dvh bg-papel">
      <NavSuperior />
      <div
        className={`mx-auto w-full max-w-[430px] md:max-w-6xl md:px-3 md:pb-12 ${navInferior ? 'pb-[120px]' : ''}`}
      >
        <Outlet />
      </div>
      {navInferior && <NavInferior />}
    </div>
  )
}

/** Pantallas principales: Hoy, Vender, Pedidos (con nav inferior en celular). */
export const LayoutConNav = () => <LayoutApp navInferior />

/** Pantallas de detalle o con barra de acción propia. */
export const LayoutMovil = () => <LayoutApp navInferior={false} />

const MUESTRAS = ['molletes', 'cafe', 'tejuino', 'galletas']

/** Entrar / registro / código: en computadora se agrega un panel de marca a la izquierda. */
export function LayoutAcceso() {
  return (
    <div className="min-h-dvh bg-papel lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-banner p-12 text-white lg:flex">
        <span className="absolute -top-24 -right-24 size-[340px] rounded-full bg-mango/16" />
        <span className="absolute -bottom-32 -left-20 size-[300px] rounded-full bg-white/6" />
        <div className="relative flex items-center gap-3">
          {/* Variante clara del icono: la normal es azul y se pierde sobre el banner. */}
          <img src="/icon-claro.svg" alt="" className="size-11" />
          <span className="font-display text-[26px] font-bold">Shopsito</span>
        </div>
        <div className="relative flex flex-col gap-8">
          <div className="grid max-w-[300px] grid-cols-2 gap-3.5 xl:max-w-[340px]">
            {MUESTRAS.map((m, i) => (
              <img
                key={m}
                src={`/productos/${m}.svg`}
                alt=""
                className={`aspect-[4/5] w-full rounded-tarjeta object-cover shadow-flotante ${i % 2 ? 'translate-y-6' : ''}`}
              />
            ))}
          </div>
          <div className="flex max-w-md flex-col gap-2 pt-4">
            <h2 className="font-display text-[34px] leading-[1.1] font-bold tracking-[-0.02em]">
              Lo que se vende hoy en el campus, a dos toques.
            </h2>
            <p className="text-[17px] text-[#D5E1F0]">
              ¿Trajiste algo para vender? Publícalo en 1 minuto.
            </p>
          </div>
        </div>
      </aside>
      <div className="mx-auto w-full max-w-[430px] md:max-w-[480px] md:py-6 lg:flex lg:flex-col lg:justify-center lg:overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
