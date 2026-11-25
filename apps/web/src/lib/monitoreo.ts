import * as Sentry from '@sentry/react'
import { reactRouterBrowserTracingIntegration } from '@sentry/react/react-router'

// El DSN y el ambiente se fijan al hacer build (infra/desplegar.sh). Sin DSN, Sentry no hace nada.
const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_AMBIENTE || 'local',
    // Mide cargas y navegaciones con el nombre de la ruta (`/producto/:id`) y agrega
    // `sentry-trace` a los fetch de /api: así la traza sigue dentro del Worker.
    integrations: [reactRouterBrowserTracingIntegration()],
    tracesSampleRate: 1,
    // Los formularios llevan contraseñas: nunca se mandan cuerpos de petición, cookies ni IP.
    dataCollection: { httpBodies: [], cookies: false, userInfo: false },
  })
}

/** Liga los eventos de Sentry al usuario en sesión (solo id y rol, sin nombre ni correo). */
export function identificar(usuario: { id: string; rol: string } | null) {
  Sentry.setUser(usuario && { id: usuario.id })
  Sentry.setTag('rol', usuario?.rol ?? 'sin-sesion')
}

/** Mensaje en Sentry para algo que conviene ver aunque no sea un error. */
export function avisar(mensaje: string, nivel: 'info' | 'warning' = 'info') {
  Sentry.captureMessage(mensaje, nivel)
}

/** Para `createRoot`: manda a Sentry los errores de render (los atrape o no un boundary). */
export const erroresReact = {
  onCaughtError: Sentry.reactErrorHandler(),
  onUncaughtError: Sentry.reactErrorHandler(),
}
