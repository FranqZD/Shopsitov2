import { useEffect } from 'react'

/**
 * Llama a `cargar` al montar, cada `cadaMs` mientras la pestaña está a la vista y al regresar a
 * ella. Es el "tiempo real" de la app: el Worker no puede mantener conexiones abiertas.
 */
export function useSondeo(cargar: () => void, cadaMs: number) {
  useEffect(() => {
    cargar()
    const siVisible = () => {
      if (document.visibilityState === 'visible') cargar()
    }
    const id = setInterval(siVisible, cadaMs)
    document.addEventListener('visibilitychange', siVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', siVisible)
    }
  }, [cargar, cadaMs])
}
