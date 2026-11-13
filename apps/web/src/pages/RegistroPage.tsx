import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { InsigniaMini } from '../components/Insignia'
import { api } from '../lib/api'

const CAMPO =
  'h-[54px] w-full rounded-[18px] bg-tarjeta px-[18px] text-base text-tinta shadow-tarjeta outline-none focus:ring-2 focus:ring-azul'

/** 0–3 según largo y variedad. */
function fuerza(pass: string) {
  if (pass.length < 8) return pass ? 1 : 0
  const variedad = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pass)).length
  return variedad >= 3 && pass.length >= 10 ? 3 : 2
}
const MEDIDOR = [
  { texto: '', color: '' },
  { texto: 'Muy corta', color: 'text-mango-tinta', barra: 'bg-mango' },
  { texto: 'Va bien', color: 'text-verde', barra: 'bg-verde' },
  { texto: 'Muy segura', color: 'text-verde', barra: 'bg-verde' },
]

export function RegistroPage() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nivel = fuerza(password)

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-3.5 pb-[26px]">
      <div className="-ml-2">
        <BotonRedondo to="/login" label="Regresar">
          <ChevronLeft size={22} strokeWidth={2.2} />
        </BotonRedondo>
      </div>
      <h1 className="mt-[22px] font-display text-[30px] font-bold tracking-[-0.02em] text-azul">
        Crea tu cuenta
      </h1>
      <p className="mt-1.5 text-[15px] text-tinta-2">Toma menos de un minuto.</p>

      <form
        className="mt-6 flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          api.auth.registro({ nombre, correo, password }).then(
            () => navigate(`/verificar?correo=${encodeURIComponent(correo)}`),
            (err: Error) => setError(err.message),
          )
        }}
      >
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="nombre" className="text-sm font-bold">
            ¿Cómo te llamas?
          </label>
          <input
            id="nombre"
            autoComplete="name"
            required
            minLength={2}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={CAMPO}
          />
        </div>
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="correo2" className="text-sm font-bold">
            Correo
          </label>
          <input
            id="correo2"
            type="email"
            autoComplete="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className={CAMPO}
          />
          <div className="flex items-start gap-2.5 rounded-chico bg-mango-50 px-3.5 py-3">
            <span className="mt-px">
              <InsigniaMini size={20} />
            </span>
            <span className="text-[13.5px] leading-[1.45] text-mango-tinta">
              <span className="font-bold">
                Con tu correo de la uni te damos la insignia de comunidad.
              </span>{' '}
              Así la gente confía más en lo que vendes.
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="pass2" className="text-sm font-bold">
            Contraseña
          </label>
          <input
            id="pass2"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={CAMPO}
          />
          {nivel > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="grid flex-1 grid-cols-3 gap-1">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full ${i <= nivel ? MEDIDOR[nivel]!.barra : 'bg-gris-50'}`}
                  />
                ))}
              </div>
              <span className={`text-[13px] font-bold ${MEDIDOR[nivel]!.color}`}>
                {MEDIDOR[nivel]!.texto}
              </span>
            </div>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <Boton type="submit" className="mt-2 w-full">
          Crear cuenta
        </Boton>
        {/* TODO: enlazar las reglas de Shopsito cuando exista la página. */}
        <span className="text-center text-[13px] leading-normal text-tinta-2">
          Al crear tu cuenta aceptas las{' '}
          <span className="font-semibold text-azul underline">reglas de Shopsito</span>.
        </span>
      </form>
    </main>
  )
}
