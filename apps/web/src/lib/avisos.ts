import { useSyncExternalStore } from 'react'
import { api } from './api'
import { ESTADOS_ACTIVOS } from './pedidos'
import { getSesion } from './sesion'

type Avisos = { pedidosActivos: number; sinLeer: number }

const CADA_MS = 30_000
const VACIO: Avisos = { pedidosActivos: 0, sinLeer: 0 }

// Un solo lugar guarda los contadores de las navegaciones y la campana, y un solo temporizador
// los refresca (mientras alguien los esté usando), sin importar cuántos componentes los lean.
let avisos = VACIO
const oyentes = new Set<() => void>()

function poner(nuevos: Avisos) {
  if (nuevos.pedidosActivos === avisos.pedidosActivos && nuevos.sinLeer === avisos.sinLeer) return
  avisos = nuevos
  oyentes.forEach((avisar) => avisar())
}

/** Vuelve a pedir los contadores (p. ej. después de hacer un pedido o leer avisos). */
export async function refrescarAvisos() {
  if (!getSesion()) return poner(VACIO)
  try {
    const [compras, notificaciones] = await Promise.all([
      api.pedidos.compras(),
      api.notificaciones.listar(),
    ])
    poner({
      pedidosActivos: compras.filter((p) => ESTADOS_ACTIVOS.includes(p.estado)).length,
      sinLeer: notificaciones.filter((n) => !n.leida).length,
    })
  } catch {
    // Un fallo de red no debe tapar los últimos números buenos.
  }
}

let temporizador: ReturnType<typeof setInterval> | undefined
const siVisible = () => {
  if (document.visibilityState === 'visible') void refrescarAvisos()
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar)
  if (oyentes.size === 1) {
    siVisible()
    temporizador = setInterval(siVisible, CADA_MS)
    document.addEventListener('visibilitychange', siVisible)
  }
  return () => {
    oyentes.delete(avisar)
    if (oyentes.size === 0) {
      clearInterval(temporizador)
      document.removeEventListener('visibilitychange', siVisible)
    }
  }
}

/** Pedidos activos y avisos sin leer, para las insignias de la navegación. */
export const useAvisos = () =>
  useSyncExternalStore(
    suscribir,
    () => avisos,
    () => VACIO,
  )
