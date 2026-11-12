import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../lib/api'
import { guardarSesion } from '../lib/sesion'

export function LoginPage() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Entrar</h1>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          api.auth.login({ correo, password }).then(
            (sesion) => {
              guardarSesion(sesion)
              navigate(sesion.usuario.rol === 'admin' ? '/admin' : '/')
            },
            (err: Error) => setError(err.message),
          )
        }}
      >
        <input
          className="w-full rounded border px-2 py-1"
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <input
          className="w-full rounded border px-2 py-1"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-emerald-600 py-1 text-white">Entrar</button>
      </form>
      <p className="mt-4 text-sm">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="text-emerald-700">
          Regístrate
        </Link>
      </p>
    </section>
  )
}
