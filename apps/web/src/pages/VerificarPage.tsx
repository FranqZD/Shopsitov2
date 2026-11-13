import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ChevronLeft, Mail } from 'lucide-react'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { api } from '../lib/api'
import { formatoCuenta } from '../lib/formato'
import { useAhora } from '../lib/useAhora'

const ESPERA_REENVIO = 42

export function VerificarPage() {
  const [params] = useSearchParams()
  const correo = params.get('correo') ?? ''
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [enfocado, setEnfocado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviadoEn, setEnviadoEn] = useState(() => Date.now())
  const ahora = useAhora()
  const input = useRef<HTMLInputElement>(null)
  const restante = Math.max(0, ESPERA_REENVIO - Math.floor((ahora.getTime() - enviadoEn) / 1000))

  const verificar = () => {
    setError(null)
    api.auth.verificar({ correo, codigo }).then(
      () => navigate('/login'),
      (e: Error) => setError(e.message),
    )
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-3.5 pb-7 lg:min-h-0">
      <div className="-ml-2">
        <BotonRedondo to="/registro" label="Regresar">
          <ChevronLeft size={22} strokeWidth={2.2} />
        </BotonRedondo>
      </div>
      <span className="mt-[30px] flex size-[68px] items-center justify-center rounded-full bg-mango text-[#1B2333]">
        <Mail size={30} strokeWidth={2} aria-hidden="true" />
      </span>
      <h1 className="mt-[22px] font-display text-[30px] font-bold tracking-[-0.02em] text-azul">
        Revisa tu correo
      </h1>
      <p className="mt-2 text-[15.5px] leading-normal text-tinta-2">
        Te mandamos un código de 6 dígitos
        {correo && (
          <>
            {' '}
            a <span className="font-bold text-tinta">{correo}</span>
          </>
        )}
        .
      </p>

      <label
        className="relative mt-[30px] flex flex-col gap-2.5"
        onClick={() => input.current?.focus()}
      >
        <span className="sr-only">Código de verificación</span>
        <span className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => {
            const activa = enfocado && i === Math.min(codigo.length, 5)
            return (
              <span
                key={i}
                className={`flex h-[62px] items-center justify-center rounded-chico font-mono text-[26px] font-semibold ${
                  activa
                    ? 'bg-azul-50 shadow-[inset_0_0_0_2px_var(--color-azul)]'
                    : 'bg-tarjeta shadow-tarjeta'
                }`}
              >
                {codigo[i] ?? (activa && <span className="h-7 w-0.5 animate-pulse bg-azul" />)}
              </span>
            )
          })}
        </span>
        <input
          ref={input}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={codigo}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="absolute size-px opacity-0"
          autoFocus
        />
      </label>

      <div className="mt-[18px] flex items-center justify-between">
        <span className="text-[14.5px] text-tinta-2">¿No te llegó?</span>
        {restante > 0 ? (
          <span className="text-[14.5px] font-bold text-tinta-2 tabular-nums">
            Reenviar en {formatoCuenta(restante)}
          </span>
        ) : (
          // TODO: endpoint para reenviar el código.
          <Boton
            variante="suave"
            tamano="sm"
            className="h-10"
            onClick={() => setEnviadoEn(Date.now())}
          >
            Reenviar código
          </Boton>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-8">
        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <span className="text-center text-[13px] text-tinta-2">
          También revisa spam o la pestaña “Otros”.
        </span>
        <Boton className="w-full" disabled={codigo.length < 6} onClick={verificar}>
          Verificar
        </Boton>
        <Link
          to="/registro"
          className="flex h-10 items-center self-center text-[14.5px] font-semibold text-azul"
        >
          Cambiar correo
        </Link>
      </div>
    </main>
  )
}
