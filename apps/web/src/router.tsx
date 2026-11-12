import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PedidosPage } from './pages/PedidosPage'
import { PerfilPage } from './pages/PerfilPage'
import { ProductoPage } from './pages/ProductoPage'
import { RegistroPage } from './pages/RegistroPage'
import { VenderPage } from './pages/VenderPage'
import { VerificarPage } from './pages/VerificarPage'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/producto/:id', element: <ProductoPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/registro', element: <RegistroPage /> },
      { path: '/verificar', element: <VerificarPage /> },
      { path: '/vender', element: <VenderPage /> },
      { path: '/pedidos', element: <PedidosPage /> },
      { path: '/perfil/:id', element: <PerfilPage /> },
      { path: '/admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
