import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronDown, LogOut, User } from 'lucide-react'
import type { LoginResponse } from '@shopsito/shared'
import { guardarSesion } from '../lib/sesion'
import { Avatar } from './Avatar'

const ITEM =
  'flex h-12 w-full items-center gap-3 rounded-full px-3.5 text-left text-[15px] font-semibold text-tinta hover:bg-azul-50 focus-visible:bg-azul-50 focus-visible:outline-none'

/** Avatar de la barra superior: abre un menú con Perfil y Salir. */
export function MenuCuenta({ usuario }: { usuario: LoginResponse['usuario'] }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!abierto) return
    const alTocarFuera = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbierto(false)
    }
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('pointerdown', alTocarFuera)
    document.addEventListener('keydown', alEscape)
    return () => {
      document.removeEventListener('pointerdown', alTocarFuera)
      document.removeEventListener('keydown', alEscape)
    }
  }, [abierto])

  return (
    <div ref={ref} className="relative flex-none">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Tu cuenta"
        onClick={() => setAbierto(!abierto)}
        className={`flex items-center gap-2 rounded-full py-1 pr-3 pl-1 hover:bg-azul-50 ${abierto ? 'bg-azul-50' : ''}`}
      >
        <Avatar id={usuario.id} nombre={usuario.nombre} size={40} />
        <span className="hidden text-[15px] font-semibold lg:inline">
          {usuario.nombre.split(' ')[0]}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2.2}
          className={`text-tinta-2 transition ${abierto ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {abierto && (
        <div
          role="menu"
          className="absolute top-[calc(100%+10px)] right-0 flex w-56 flex-col gap-0.5 rounded-tarjeta bg-tarjeta p-1.5 shadow-flotante"
        >
          <Link
            role="menuitem"
            to={`/perfil/${usuario.id}`}
            onClick={() => setAbierto(false)}
            className={ITEM}
          >
            <User size={20} strokeWidth={2} className="text-azul" aria-hidden="true" />
            Perfil
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              guardarSesion(null)
              navigate('/login', { replace: true })
            }}
            className={ITEM}
          >
            <LogOut size={20} strokeWidth={2} className="text-tinta-2" aria-hidden="true" />
            Salir
          </button>
        </div>
      )}
    </div>
  )
}
