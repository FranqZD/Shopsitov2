import type { LoginResponse } from '@shopsito/shared'

const CLAVE = 'shopsito.sesion'

export function getSesion(): LoginResponse | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as LoginResponse) : null
  } catch {
    return null
  }
}

export const getToken = () => getSesion()?.token ?? null

export function guardarSesion(sesion: LoginResponse | null) {
  if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion))
  else localStorage.removeItem(CLAVE)
}
