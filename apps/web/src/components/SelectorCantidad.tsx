import { Minus, Plus } from 'lucide-react'

/** Pastilla azul-50 con − / + ; el número salta al cambiar (animate-salto). */
export function SelectorCantidad({
  valor,
  min = 1,
  max,
  onChange,
  alto = 56,
}: {
  valor: number
  min?: number
  max: number
  onChange: (n: number) => void
  alto?: number
}) {
  const boton =
    'flex size-11 items-center justify-center rounded-full bg-tarjeta shadow-[0_1px_3px_rgb(27_35_51/0.08)] disabled:text-[#B8BFCA] text-azul'
  return (
    <div
      role="group"
      aria-label="Cantidad"
      className="flex items-center gap-1 rounded-full bg-azul-50 px-1.5"
      style={{ height: alto }}
    >
      <button
        type="button"
        aria-label="Quitar uno"
        className={boton}
        disabled={valor <= min}
        onClick={() => onChange(valor - 1)}
      >
        <Minus size={18} strokeWidth={2.4} />
      </button>
      <span
        key={valor}
        aria-live="polite"
        className="inline-block min-w-[26px] animate-salto text-center num text-[21px] font-bold text-azul"
      >
        {valor}
      </span>
      <button
        type="button"
        aria-label="Agregar uno"
        className={boton}
        disabled={valor >= max}
        onClick={() => onChange(valor + 1)}
      >
        <Plus size={18} strokeWidth={2.4} />
      </button>
    </div>
  )
}
