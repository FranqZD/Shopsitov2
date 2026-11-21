import { createBrowserRouter } from 'react-router'
import { LayoutAdmin } from './components/LayoutAdmin'
import { LayoutAcceso, LayoutConNav, LayoutMovil } from './components/Layouts'
import { RequiereSesion, SoloSinSesion } from './components/RequiereSesion'
import { AdminProductosPage } from './pages/AdminProductosPage'
import { AdminPuntosPage } from './pages/AdminPuntosPage'
import { AdminReportesPage } from './pages/AdminReportesPage'
import { CalificarPage } from './pages/CalificarPage'
import { CatalogoPage } from './pages/CatalogoPage'
import { ConfirmarPage } from './pages/ConfirmarPage'
import { DetallePage } from './pages/DetallePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { NotificacionesPage } from './pages/NotificacionesPage'
import { PedidoDetallePage } from './pages/PedidoDetallePage'
import { PedidosPage } from './pages/PedidosPage'
import { PerfilPage } from './pages/PerfilPage'
import { RegistroPage } from './pages/RegistroPage'
import { VenderPage } from './pages/VenderPage'
import { VentasPage } from './pages/VentasPage'

export const router = createBrowserRouter([
  {
    // Todo lo de la app exige sesión; sin ella se va a /login.
    element: <RequiereSesion />,
    children: [
      {
        // Pantallas principales: llevan la navegación inferior.
        element: <LayoutConNav />,
        children: [
          { path: '/', element: <CatalogoPage /> },
          { path: '/vender', element: <VenderPage /> },
          { path: '/ventas', element: <VentasPage /> },
          { path: '/pedidos', element: <PedidosPage /> },
        ],
      },
      {
        // Pantallas de detalle o con barra de acción propia.
        element: <LayoutMovil />,
        children: [
          { path: '/producto/:id', element: <DetallePage /> },
          { path: '/producto/:id/confirmar', element: <ConfirmarPage /> },
          { path: '/pedidos/:id', element: <PedidoDetallePage /> },
          { path: '/calificar/:pedidoId', element: <CalificarPage /> },
          { path: '/perfil/:id', element: <PerfilPage /> },
          { path: '/notificaciones', element: <NotificacionesPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: '/admin',
        element: <LayoutAdmin />,
        children: [
          { index: true, element: <AdminProductosPage /> },
          { path: 'puntos', element: <AdminPuntosPage /> },
          { path: 'reportes', element: <AdminReportesPage /> },
        ],
      },
    ],
  },
  {
    // Acceso: sin navegación; en computadora lleva panel de marca.
    element: <LayoutAcceso />,
    children: [
      {
        element: <SoloSinSesion />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/registro', element: <RegistroPage /> },
        ],
      },
    ],
  },
])
