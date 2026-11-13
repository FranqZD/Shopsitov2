import type { ReactNode } from 'react'

/** Barra de acción fija abajo: fondo tarjeta, esquinas superiores r28 y sombra hacia arriba. */
export function BarraAccion({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px]">
      <div className="flex flex-col gap-2 rounded-t-hoja bg-tarjeta px-5 pt-3.5 pb-[max(26px,env(safe-area-inset-bottom))] shadow-hoja">
        {children}
      </div>
    </div>
  )
}
