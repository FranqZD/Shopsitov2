import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { Boton } from '../components/Boton'
import { LogoShopsito } from '../components/LogoShopsito'
import { api } from '../lib/api'
import { guardarSesion } from '../lib/sesion'

const CAMPO =
  'h-[54px] w-full rounded-[18px] bg-tarjeta px-[18px] text-base text-tinta shadow-tarjeta outline-none focus:ring-2 focus:ring-azul'

export function LoginPage() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-[72px] pb-7 lg:min-h-0 lg:pt-6">
      <LogoShopsito size={72} />
      <h1 className="mt-7 font-display text-[32px] leading-[1.1] font-bold tracking-[-0.02em] text-azul">
        Entra a Shopsito
      </h1>
      <p className="mt-2 text-[15.5px] leading-normal text-tinta-2">
        Lo que se vende hoy en el campus, a dos toques.
      </p>

      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          api.auth.login({ correo, password }).then(
            (sesion) => {
              guardarSesion(sesion)
              navigate(sesion.usuario.rol === 'admin' ? '/admin' : '/')
            },
            (err: Error) => setError(err.message),
          )
        }}
      >
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="correo" className="text-sm font-bold">
            Correo
          </label>
          <input
            id="correo"
            type="email"
            autoComplete="email"
            required
            placeholder="tu.correo@iteso.mx"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className={CAMPO}
          />
        </div>
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="pass" className="text-sm font-bold">
            Contraseña
          </label>
          <div className="flex h-[54px] items-center rounded-[18px] bg-tarjeta pr-1.5 pl-[18px] shadow-tarjeta focus-within:ring-2 focus-within:ring-azul">
            <input
              id="pass"
              type={ver ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-base text-tinta outline-none"
            />
            <button
              type="button"
              aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setVer(!ver)}
              className="flex size-11 items-center justify-center rounded-full text-tinta-2"
            >
              {ver ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
            </button>
          </div>
          {/* TODO: flujo de recuperar contraseña. */}
          <span className="flex h-9 items-center self-end text-sm font-semibold text-azul">
            ¿Olvidaste tu contraseña?
          </span>
        </div>
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <Boton type="submit" className="mt-1 w-full">
          Entrar
        </Boton>
      </form>

      <div className="mt-auto pt-8 text-center text-[15px] text-tinta-2">
        ¿Primera vez?{' '}
        <Link to="/registro" className="font-bold text-azul">
          Crea tu cuenta
        </Link>
      </div>
    </main>
  )
}
