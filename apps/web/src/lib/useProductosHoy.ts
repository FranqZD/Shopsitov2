import { useCallback, useEffect, useState } from 'react'
import type { ProductoHoy } from '@shopsito/shared'
import { api } from './api'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string; intento: Date }
  | { tipo: 'listo'; productos: ProductoHoy[] }

// Último resultado en memoria para no mostrar skeletons al regresar del detalle.
let cache: ProductoHoy[] | null = null

/** Olvida el catálogo en memoria (p. ej. al publicar) para que se vuelva a pedir. */
export function invalidarProductosHoy() {
  cache = null
}

/** Producto del último catálogo cargado, para pintar el detalle sin esperar a la API. */
export const productoEnCache = (id: string) => cache?.find((p) => p.id === id)

/**
 * Catálogo del día desde GET /api/productos/hoy.
 * Si hay caché la muestra al instante y la actualiza en segundo plano; también vuelve a pedir
 * al regresar a la pestaña, porque mientras tanto otros publican o se acaban cosas.
 */
export function useProductosHoy() {
  const [estado, setEstado] = useState<Estado>(
    cache ? { tipo: 'listo', productos: cache } : { tipo: 'cargando' },
  )

  const pedir = useCallback(() => {
    api.productos.hoy().then(
      (productos) => {
        cache = productos
        setEstado({ tipo: 'listo', productos })
      },
      (e: Error) => {
        // Con datos en pantalla, un fallo en segundo plano no los tapa.
        if (!cache) setEstado({ tipo: 'error', mensaje: e.message, intento: new Date() })
      },
    )
  }, [])

  useEffect(() => {
    pedir()
    const alVolver = () => {
      if (document.visibilityState === 'visible') pedir()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [pedir])

  const recargar = () => {
    cache = null
    setEstado({ tipo: 'cargando' })
    pedir()
  }
  return { estado, recargar }
}
