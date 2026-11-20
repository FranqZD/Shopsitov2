import { Navigate, Outlet, useLocation } from 'react-router'
import { getSesion, rutaLogin } from '../lib/sesion'

/** Sin sesión vigente no se entra a la app: manda a /login y luego regresa aquí. */
export function RequiereSesion() {
  const { pathname, search } = useLocation()
  if (!getSesion()) return <Navigate to={rutaLogin(pathname + search)} replace />
  return <Outlet />
}

/** Pantallas de acceso: con sesión ya abierta no tiene caso ver "Entrar". */
export function SoloSinSesion() {
  const sesion = getSesion()
  if (sesion) return <Navigate to={sesion.usuario.rol === 'admin' ? '/admin' : '/'} replace />
  return <Outlet />
}
