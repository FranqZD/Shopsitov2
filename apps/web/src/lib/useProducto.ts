import { useCallback, useEffect, useState } from 'react'
import { ahoraCampus, segundosHastaHora, type ProductoHoy } from '@shopsito/shared'
import { api, ApiRequestError } from './api'
import { productoEnCache } from './useProductosHoy'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'no-encontrado' }
  | { tipo: 'listo'; producto: ProductoHoy }

/** Un producto desde GET /api/productos/:id; si viene del catálogo se pinta con la caché mientras llega. */
export function useProducto(id: string) {
  const [estado, setEstado] = useState<Estado>(() => {
    const p = productoEnCache(id)
    return p ? { tipo: 'listo', producto: p } : { tipo: 'cargando' }
  })

  const pedir = useCallback(() => {
    api.productos.obtener(id).then(
      (producto) => setEstado({ tipo: 'listo', producto }),
      (e: Error) =>
        setEstado(
          e instanceof ApiRequestError && (e.status === 404 || e.status === 400)
            ? { tipo: 'no-encontrado' }
            : { tipo: 'error', mensaje: e.message },
        ),
    )
  }, [id])

  useEffect(pedir, [pedir])

  const recargar = () => {
    setEstado({ tipo: 'cargando' })
    pedir()
  }
  return { estado, recargar }
}

/** Sigue a la venta hoy: mismo criterio que el catálogo del día, evaluado en el cliente. */
export function abiertoHoy(p: ProductoHoy, ahora: Date) {
  return p.fecha === ahoraCampus(ahora).fecha && segundosHastaHora(p.horaLimite, ahora) > 0
}
