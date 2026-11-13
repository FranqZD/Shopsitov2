import type {
  ActualizarPuntoEntregaInput,
  ApiError,
  CrearPedidoInput,
  CrearProductoInput,
  CrearPuntoEntregaInput,
  LoginInput,
  Pedido,
  Producto,
  RegistroInput,
  VerificarCodigoInput,
  LoginResponse,
  ProductoHoy,
  PuntoEntrega,
} from '@shopsito/shared'
import { getToken } from './sesion'

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
    // La API responde 501 por ahora; la UI muestra el error tal cual.
    registro: (datos: RegistroInput) =>
      request<void>('/auth/registro', { method: 'POST', body: json(datos) }),
    verificar: (datos: VerificarCodigoInput) =>
      request<void>('/auth/verificar', { method: 'POST', body: json(datos) }),
  },
  productos: {
    hoy: () => request<ProductoHoy[]>('/productos/hoy'),
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
