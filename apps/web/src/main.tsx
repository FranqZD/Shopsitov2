// Primero: Sentry debe iniciar antes de crear el router para medir la carga inicial.
import { erroresReact, identificar } from './lib/monitoreo'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { getSesion } from './lib/sesion'
import { router } from './router'
import './index.css'

identificar(getSesion()?.usuario ?? null)

createRoot(document.getElementById('root')!, erroresReact).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
