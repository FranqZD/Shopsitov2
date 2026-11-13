import { createBrowserRouter } from 'react-router'
import { LayoutAdmin } from './components/LayoutAdmin'
import { LayoutAcceso, LayoutConNav, LayoutMovil } from './components/Layouts'
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
import { VerificarPage } from './pages/VerificarPage'

export const router = createBrowserRouter([
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
    // Acceso: sin navegación; en computadora lleva panel de marca.
    element: <LayoutAcceso />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/registro', element: <RegistroPage /> },
      { path: '/verificar', element: <VerificarPage /> },
    ],
  },
  {
    path: '/admin',
    element: <LayoutAdmin />,
    children: [
      { index: true, element: <AdminPuntosPage /> },
      { path: 'reportes', element: <AdminReportesPage /> },
    ],
  },
])
