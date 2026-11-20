/**
 * URL de la foto de un producto.
 * - `ejemplo/<archivo>`: ilustraciones de ejemplo (seed y desarrollo), servidas desde /public/productos.
 * - `productos/<id>/<uuid>`: fotos subidas a R2, servidas por GET /api/fotos/….
 */
export function urlFoto(fotoKey: string | null): string | null {
  if (!fotoKey) return null
  if (fotoKey.startsWith('ejemplo/')) return `/productos/${fotoKey.slice('ejemplo/'.length)}`
  if (fotoKey.startsWith('productos/')) return `/api/fotos/${fotoKey}`
  return null
}

const LADO_MAXIMO = 1600

/**
 * Reduce la foto a JPEG de máximo 1600 px por lado antes de subirla: las de la cámara del
 * celular pesan varios MB y el servidor acepta hasta 5 MB. Si el navegador no puede
 * decodificarla, se sube tal cual y el servidor decide.
 */
export async function prepararFoto(archivo: File): Promise<Blob> {
  try {
    const imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(imagen.width * escala)
    lienzo.height = Math.round(imagen.height * escala)
    lienzo.getContext('2d')?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
    imagen.close()
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', 0.85))
    return blob ?? archivo
  } catch {
    return archivo
  }
}
