import { useOutletContext } from 'react-router'

export type ContextoAdmin = { recontarReportes: () => void }

/** Para que las pantallas del admin actualicen el contador del menú tras un cambio. */
export const useContextoAdmin = () => useOutletContext<ContextoAdmin>()
