const PUNTOS = '12 2.5 15 8.6 21.7 9.6 16.8 14.3 18 21 12 17.8 6 21 7.2 14.3 2.3 9.6 9 8.6'

export function Estrella({ llena, size = 15 }: { llena: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <polygon
        points={PUNTOS}
        strokeWidth="1.5"
        strokeLinejoin="round"
        className={llena ? 'fill-mango stroke-mango' : 'fill-estrella-off stroke-estrella-off'}
      />
    </svg>
  )
}

/** Fila de 5 estrellas para una calificación (acepta decimales: 4.8 → 5 llenas). */
export function Estrellas({ valor, size = 15 }: { valor: number; size?: number }) {
  return (
    <span className="flex gap-px" role="img" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Estrella key={i} llena={valor >= i - 0.25} size={size} />
      ))}
    </span>
  )
}
