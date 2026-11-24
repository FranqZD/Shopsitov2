import { useCallback, useState } from 'react'
import type { PedidoCompra } from '@shopsito/shared'
import { api } from './api'
import { useSondeo } from './useSondeo'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; pedidos: PedidoCompra[] }

/** Los pedidos del comprador; se actualizan solos para ver cuándo el vendedor responde. */
export function useCompras() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })

  const recargar = useCallback(() => {
    api.pedidos.compras().then(
      (pedidos) => setEstado({ tipo: 'listo', pedidos }),
      // Con datos en pantalla, un fallo en segundo plano no los tapa.
      (e: Error) =>
        setEstado((a) => (a.tipo === 'listo' ? a : { tipo: 'error', mensaje: e.message })),
    )
  }, [])

  useSondeo(recargar, 15_000)
  return { estado, recargar }
}
