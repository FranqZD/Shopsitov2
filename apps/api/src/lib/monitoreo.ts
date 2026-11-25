import * as Sentry from '@sentry/cloudflare'
import type { Bindings } from '../env'

/**
 * Opciones de Sentry para el Worker. Sin `SENTRY_DSN` el SDK queda apagado: así corren
 * local y las pruebas sin mandar nada.
 */
export const opcionesSentry = (env: Bindings): Sentry.CloudflareOptions => ({
  dsn: env.SENTRY_DSN,
  environment: env.AMBIENTE ?? 'local',
  // Proyecto escolar con poco tráfico: se traza cada petición. En algo grande se baja.
  tracesSampleRate: 1,
  // Los cuerpos llevan contraseñas (login/registro) y datos personales: nunca se mandan.
  // Tampoco IP ni cookies; el usuario se identifica solo con su id (ver requireAuth).
  dataCollection: { httpBodies: [], cookies: false, userInfo: false },
})

type Nivel = 'info' | 'warning' | 'error'

/**
 * Mensaje en Sentry para algo del negocio que vale la pena ver aunque no sea un error
 * (p. ej. un pedido que se quedó sin existencias). Los datos van como tags para filtrar.
 */
export function avisar(mensaje: string, nivel: Nivel, datos: Record<string, string> = {}) {
  Sentry.captureMessage(mensaje, { level: nivel, tags: datos })
}

/** Paso con nombre dentro de la traza de la petición (aparece como span en Sentry). */
export const paso = <T>(nombre: string, fn: () => Promise<T>) =>
  Sentry.startSpan({ name: nombre, op: 'shopsito.logica' }, fn)
