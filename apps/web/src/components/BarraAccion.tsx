import type { ReactNode } from 'react'

/**
 * Celular: barra fija abajo (fondo tarjeta, esquinas superiores r28, sombra hacia arriba).
 * Tablet/computadora: tarjeta normal dentro de la columna donde se coloque.
 */
export function BarraAccion({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] md:static md:z-auto md:max-w-none">
      <div className="flex flex-col gap-2 rounded-t-hoja bg-tarjeta px-5 pt-3.5 pb-[max(26px,env(safe-area-inset-bottom))] shadow-hoja md:rounded-grande md:p-4 md:shadow-tarjeta">
        {children}
      </div>
    </div>
  )
}
