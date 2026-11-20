import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { X } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { Estrella } from '../components/Estrellas'
import { Chip } from '../components/Chip'
import { PEDIDOS } from '../lib/ejemplos'
import { nombreCorto } from '../lib/formato'
import { NotFoundPage } from './NotFoundPage'

const TEXTOS = ['No me gustó', 'Más o menos', 'Estuvo bien', 'Muy bien', '¡Buenísimo!']
const ETIQUETAS = ['Llegó a tiempo', 'Buena porción', 'Bien empacado', 'Muy amable', 'Rico']
const MAX_COMENTARIO = 140

// TODO: enviar con POST /api/calificaciones cuando esté implementado (y guardar las etiquetas).
export function CalificarPage() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const [estrellas, setEstrellas] = useState(0)
  const [salto, setSalto] = useState(0)
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [comentario, setComentario] = useState('')
  const pedido = PEDIDOS.find((p) => p.id === pedidoId)
  if (!pedido) return <NotFoundPage />
  const corto = nombreCorto(pedido.vendedor.nombre)

  return (
    <div className="flex min-h-dvh flex-col md:mx-auto md:min-h-0 md:max-w-xl md:pt-4">
      <main className="flex flex-1 flex-col px-6 pt-3.5">
        <div className="-ml-2">
          <BotonRedondo to="/pedidos" label="Cerrar">
            <X size={20} strokeWidth={2.2} />
          </BotonRedondo>
        </div>

        <div className="mt-4 flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={pedido.foto}
              alt=""
              className="size-[84px] -rotate-6 rounded-[22px] object-cover shadow-tarjeta"
            />
            <span className="absolute -right-6 -bottom-3 rounded-full border-4 border-papel">
              <Avatar id={pedido.vendedor.id} nombre={pedido.vendedor.nombre} size={52} />
            </span>
          </div>
          <h1 className="mt-7 font-display text-[26px] leading-[1.15] font-bold tracking-[-0.015em] text-azul">
            ¿Qué tal {pedido.queTal} de {corto}?
          </h1>
          <p className="mt-2 text-[15px] text-tinta-2">
            {pedido.cuando.split(',')[0]} · {pedido.punto}
          </p>

          <div role="radiogroup" aria-label="Calificación" className="mt-6 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={n === estrellas}
                aria-label={n === 1 ? '1 estrella' : `${n} estrellas`}
                onClick={() => {
                  setEstrellas(n)
                  setSalto((s) => s + 1)
                }}
                className="flex size-[52px] items-center justify-center"
              >
                {/* La key reinicia la animación cada vez que se elige la misma estrella. */}
                <span
                  key={n === estrellas ? salto : 0}
                  className={n === estrellas && salto ? 'animate-estrella' : ''}
                >
                  <Estrella llena={n <= estrellas} size={46} />
                </span>
              </button>
            ))}
          </div>
          <span
            aria-live="polite"
            className="mt-2 h-7 font-display text-xl font-bold text-mango-tinta"
          >
            {estrellas ? TEXTOS[estrellas - 1] : ''}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <span className="text-[15px] font-bold">¿Qué estuvo bien?</span>
          <div className="flex flex-wrap gap-2">
            {ETIQUETAS.map((t) => (
              <Chip
                key={t}
                activo={etiquetas.includes(t)}
                onClick={() =>
                  setEtiquetas((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]))
                }
                className="h-10 text-[15px]"
              >
                {t}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label
            htmlFor="coment"
            className="flex items-baseline justify-between text-[15px] font-bold"
          >
            Cuéntale algo{' '}
            <span className="text-[14px] font-medium text-tinta-2">
              opcional · {MAX_COMENTARIO - comentario.length}
            </span>
          </label>
          <textarea
            id="coment"
            rows={3}
            maxLength={MAX_COMENTARIO}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej. El pico de gallo aparte fue buenísima idea."
            className="resize-none rounded-[18px] border-[1.5px] border-azul-100 bg-tarjeta px-4 py-[13px] text-[15px] leading-[1.4] outline-none focus:border-azul focus:ring-2 focus:ring-azul/30"
          />
        </div>
      </main>

      <div className="flex flex-col gap-1 px-6 pt-6 pb-7">
        <Boton className="w-full" disabled={!estrellas} onClick={() => navigate('/pedidos')}>
          Enviar calificación
        </Boton>
        <Boton
          variante="gris"
          tamano="sm"
          className="self-center bg-transparent text-tinta-2"
          to="/pedidos"
        >
          Ahora no
        </Boton>
      </div>
    </div>
  )
}
