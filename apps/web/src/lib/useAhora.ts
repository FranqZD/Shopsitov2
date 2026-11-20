import { useEffect, useState } from 'react'

/** Fecha actual que se refresca cada `intervaloMs` (para contadores en vivo). */
export function useAhora(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return ahora
}
