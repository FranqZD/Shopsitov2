import type {
  ActualizarProductoInput,
  ActualizarPuntoEntregaInput,
  ApiError,
  CrearPedidoInput,
  CrearProductoInput,
  CrearPuntoEntregaInput,
  LoginInput,
  MiPublicacion,
  Pedido,
  PerfilUsuario,
  Producto,
  RegistroInput,
  LoginResponse,
  ProductoHoy,
  PuntoEntrega,
  Resena,
  UsuarioPrivado,
} from '@shopsito/shared'
import { getToken, guardarSesion, rutaLogin } from './sesion'

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

/** Mensajes en el tono de la app para los casos comunes. */
function mensajeAmigable(status: number, mensaje: string) {
  if (status === 401) return 'Entra a tu cuenta para continuar.'
  if (status === 501) return 'Esto todavía no está listo en el servidor. Pronto.'
  return mensaje
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !(init.body instanceof FormData))
    headers.set('content-type', 'application/json')
  const token = getToken()
  if (token) headers.set('authorization', `Bearer ${token}`)

  const res = await fetch(`/api${path}`, { ...init, headers })
  if (res.status === 204) return undefined as T
  const data: unknown = await res.json().catch(() => null)
  if (res.status === 401 && token) {
    // El token ya no sirve (venció, cambió el secreto o se desactivó la cuenta): a entrar de nuevo.
    guardarSesion(null)
    location.assign(rutaLogin(location.pathname + location.search))
  }
  if (!res.ok) {
    const err = (data as ApiError | null)?.error
    throw new ApiRequestError(
      res.status,
      err?.code ?? 'HTTP_ERROR',
      mensajeAmigable(res.status, err?.message ?? res.statusText),
    )
  }
  return data as T
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  auth: {
    login: (datos: LoginInput) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: json(datos) }),
    registro: (datos: RegistroInput) =>
      request<LoginResponse>('/auth/registro', { method: 'POST', body: json(datos) }),
  },
  usuarios: {
    yo: () => request<UsuarioPrivado>('/usuarios/me'),
    perfil: (id: string) => request<PerfilUsuario>(`/usuarios/${id}`),
  },
  calificaciones: {
    deVendedor: (id: string) => request<Resena[]>(`/calificaciones/vendedor/${id}`),
  },
  productos: {
    hoy: () => request<ProductoHoy[]>('/productos/hoy'),
    obtener: (id: string) => request<ProductoHoy>(`/productos/${id}`),
    mios: () => request<MiPublicacion[]>('/productos/mios'),
    actualizar: (id: string, datos: ActualizarProductoInput) =>
      request<Producto>(`/productos/${id}`, { method: 'PATCH', body: json(datos) }),
    eliminar: (id: string) => request<void>(`/productos/${id}`, { method: 'DELETE' }),
    subirFoto: (id: string, foto: Blob) => {
      const datos = new FormData()
      datos.append('foto', foto, 'foto.jpg')
      return request<Producto>(`/productos/${id}/foto`, { method: 'POST', body: datos })
    },
    crear: (datos: CrearProductoInput) =>
      request<Producto>('/productos', { method: 'POST', body: json(datos) }),
  },
  pedidos: {
    crear: (datos: CrearPedidoInput) =>
      request<Pedido>('/pedidos', { method: 'POST', body: json(datos) }),
  },
  puntosEntrega: {
    listar: () => request<PuntoEntrega[]>('/puntos-entrega'),
    crear: (datos: CrearPuntoEntregaInput) =>
      request<PuntoEntrega>('/puntos-entrega', { method: 'POST', body: json(datos) }),
    actualizar: (id: string, datos: ActualizarPuntoEntregaInput) =>
      request<PuntoEntrega>(`/puntos-entrega/${id}`, { method: 'PATCH', body: json(datos) }),
    eliminar: (id: string) => request<void>(`/puntos-entrega/${id}`, { method: 'DELETE' }),
  },
}
