import { Flag, MapPin } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { REPORTES } from '../lib/ejemplos'
import { getSesion } from '../lib/sesion'
import { Avatar } from './Avatar'
import { Boton } from './Boton'

// TODO: contar con GET /api/reportes cuando esté implementado.
const ABIERTOS = REPORTES.filter((r) => r.estado === 'abierto').length

/** Admin de escritorio: menú lateral + contenido. */
export function LayoutAdmin() {
  const sesion = getSesion()

  if (sesion?.usuario.rol !== 'admin') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-display text-[26px] font-bold text-azul">
          Solo para el equipo de Shopsito
        </h1>
        <p className="text-[15px] text-tinta-2">
          Entra con una cuenta de administrador para gestionar puntos de entrega y reportes.
        </p>
        <Boton to="/login" tamano="md">
          Entrar
        </Boton>
      </main>
    )
  }

  const item = ({ isActive }: { isActive: boolean }) =>
    `flex h-[52px] items-center gap-3 rounded-full px-4 text-base font-bold whitespace-nowrap ${isActive ? 'bg-azul-50 text-azul' : 'text-tinta-2'}`

  return (
    <div className="flex min-h-dvh flex-col gap-6 bg-papel p-4 lg:flex-row lg:p-6">
      <aside className="flex h-fit flex-none flex-col gap-6 rounded-[28px] bg-tarjeta p-4 shadow-flotante lg:w-[236px] lg:pt-6">
        <div className="flex items-center gap-2.5 px-1">
          <svg width="26" height="26" viewBox="0 0 1024 1024" aria-hidden="true">
            <rect width="1024" height="1024" rx="232" className="fill-azul" />
            <path
              d="M392 392 V318 Q392 196 512 196 Q632 196 632 318 V392"
              fill="none"
              stroke="#FAFAF7"
              strokeWidth="72"
              strokeLinecap="round"
            />
            <path
              d="M282 400 Q282 352 330 352 H694 Q742 352 744 400 L770 772 Q774 836 710 836 H314 Q250 836 254 772 Z"
              fill="#FAFAF7"
            />
            <circle cx="512" cy="610" r="118" fill="#FFB547" />
          </svg>
          <span className="font-display text-xl font-bold text-azul">Shopsito</span>
          <span className="rounded-full bg-azul-50 px-2 py-0.5 text-xs font-bold text-azul">
            Admin
          </span>
        </div>
        <nav aria-label="Administración" className="flex gap-1 lg:flex-col">
          <NavLink to="/admin" end className={item}>
            <MapPin size={20} strokeWidth={2} aria-hidden="true" />
            Puntos de entrega
          </NavLink>
          <NavLink to="/admin/reportes" className={item}>
            <Flag size={20} strokeWidth={2} aria-hidden="true" />
            <span className="flex-1">Reportes</span>
            {ABIERTOS > 0 && (
              <span className="flex size-[22px] items-center justify-center rounded-full bg-mango text-xs font-extrabold text-sobre-mango">
                {ABIERTOS}
              </span>
            )}
          </NavLink>
        </nav>
        <NavLinkPerfil id={sesion.usuario.id} nombre={sesion.usuario.nombre} />
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

function NavLinkPerfil({ id, nombre }: { id: string; nombre: string }) {
  return (
    <NavLink
      to={`/perfil/${id}`}
      className="flex items-center gap-2.5 rounded-tarjeta bg-papel p-3 lg:mt-6"
    >
      <Avatar id={id} nombre={nombre} size={36} />
      <span className="flex flex-col">
        <span className="text-[14.5px] font-bold">{nombre}</span>
        <span className="text-[13px] text-tinta-2">Administrador</span>
      </span>
    </NavLink>
  )
}
