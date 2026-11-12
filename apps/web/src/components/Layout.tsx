import { NavLink, Outlet, useNavigate } from 'react-router'
import { getSesion, guardarSesion } from '../lib/sesion'

const enlaces = [
  { to: '/', label: 'Hoy' },
  { to: '/vender', label: 'Vender' },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/admin', label: 'Admin' },
]

export function Layout() {
  const sesion = getSesion()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="text-lg font-bold text-emerald-600">
            Shopsito
          </NavLink>
          {enlaces.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end
              className={({ isActive }) =>
                isActive ? 'font-semibold' : 'text-gray-600 hover:text-gray-900'
              }
            >
              {e.label}
            </NavLink>
          ))}
          <div className="ml-auto text-sm">
            {sesion ? (
              <button
                className="text-gray-600 hover:text-gray-900"
                onClick={() => {
                  guardarSesion(null)
                  navigate('/login')
                }}
              >
                Salir ({sesion.usuario.nombre})
              </button>
            ) : (
              <NavLink to="/login">Entrar</NavLink>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
