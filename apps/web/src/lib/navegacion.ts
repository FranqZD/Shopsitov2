import { CirclePlus, ShoppingBag, Sun, User, type LucideIcon } from 'lucide-react'
import { useLocation } from 'react-router'
import { ACTIVOS, NOTIFICACIONES, PEDIDOS } from './ejemplos'
import { getSesion } from './sesion'

// TODO: contar con GET /api/pedidos/compras y GET /api/notificaciones cuando existan.
export const PEDIDOS_ACTIVOS = PEDIDOS.filter((p) => ACTIVOS.includes(p.estado)).length
export const NOTIFICACIONES_SIN_LEER = NOTIFICACIONES.flatMap((g) => g.items).filter(
  (n) => n.nueva,
).length

export type ItemNav = {
  to: string
  label: string
  Icono: LucideIcon
  activo: boolean
  badge?: number
}

/** Secciones principales (Hoy · Vender · Pedidos · Perfil), compartidas por la nav inferior y la superior. */
export function useItemsNav(): ItemNav[] {
  const { pathname } = useLocation()
  const sesion = getSesion()
  return [
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
      activo: !!sesion && pathname === `/perfil/${sesion.usuario.id}`,
    },
  ]
}
