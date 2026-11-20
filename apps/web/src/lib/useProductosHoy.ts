import { useCallback, useEffect, useState } from 'react'
import type { ProductoHoy } from '@shopsito/shared'
import { api } from './api'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string; intento: Date }
  | { tipo: 'listo'; productos: ProductoHoy[] }

// Último resultado en memoria para no mostrar skeletons al regresar del detalle.
let cache: ProductoHoy[] | null = null

/** Catálogo del día desde GET /api/productos/hoy. */
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
      (e: Error) => setEstado({ tipo: 'error', mensaje: e.message, intento: new Date() }),
    )
  }, [])

  useEffect(pedir, [pedir])

  const recargar = () => {
    setEstado({ tipo: 'cargando' })
    pedir()
  }
  return { estado, recargar }
}
