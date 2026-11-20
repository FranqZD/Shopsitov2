import { useEffect, useMemo } from 'react'

/** URL temporal para mostrar un archivo elegido antes de subirlo; se libera al cambiarlo. */
export function useVistaPrevia(archivo: Blob | null) {
  const url = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo])
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url])
  return url
}
