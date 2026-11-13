/** Barra de 8–10 px: relleno azul, o mango si es urgente. */
export function BarraExistencias({
  quedan,
  total,
  urgente = false,
  alto = 10,
  color,
}: {
  quedan: number
  total: number
  urgente?: boolean
  alto?: number
  color?: string
}) {
  const pct = total > 0 ? Math.round((quedan / total) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-label="Disponibles"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={quedan}
      className="overflow-hidden rounded-full bg-azul-50"
      style={{ height: alto }}
    >
      <div
        className={`h-full rounded-full ${color ?? (urgente ? 'bg-mango' : 'bg-azul')}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
