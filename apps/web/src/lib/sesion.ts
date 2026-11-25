import type { LoginResponse } from '@shopsito/shared'
import { identificar } from './monitoreo'

const CLAVE = 'shopsito.sesion'

/** Lee `exp` del JWT sin validar la firma (eso lo hace la API) para saber si ya venció. */
export function tokenVigente(token: string, ahoraMs = Date.now()) {
  try {
    const payload = token.split('.')[1]!.replaceAll('-', '+').replaceAll('_', '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown }
    return typeof exp === 'number' && exp * 1000 > ahoraMs
  } catch {
    return false
  }
}

/** Sesión guardada si sigue vigente; una vencida o corrupta se borra. */
export function getSesion(): LoginResponse | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return null
    const sesion = JSON.parse(raw) as LoginResponse
    if (!tokenVigente(sesion.token)) {
      localStorage.removeItem(CLAVE)
      return null
    }
    return sesion
  } catch {
    return null
  }
}

export const getToken = () => getSesion()?.token ?? null

export function guardarSesion(sesion: LoginResponse | null) {
  if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion))
  else localStorage.removeItem(CLAVE)
  identificar(sesion?.usuario ?? null)
}

/** `/login?volver=<ruta>` para regresar a donde iba después de entrar. */
export function rutaLogin(volver: string) {
  return volver === '/' ? '/login' : `/login?volver=${encodeURIComponent(volver)}`
}

/** Solo rutas internas: evita que `volver` mande a otro sitio. */
export function destinoSeguro(volver: string | null) {
  return volver?.startsWith('/') && !volver.startsWith('//') ? volver : null
}
