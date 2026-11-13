import { Outlet } from 'react-router'
import { NavInferior } from './NavInferior'

/** Columna móvil (máx. 430 px) centrada; en escritorio el fondo papel llena el resto. */
export function LayoutMovil() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-papel">
      <Outlet />
    </div>
  )
}

/** Igual que LayoutMovil pero con la navegación inferior flotante. */
export function LayoutConNav() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-papel pb-[120px]">
      <Outlet />
      <NavInferior />
    </div>
  )
}
