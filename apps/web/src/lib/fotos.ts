/**
 * URL de la foto de un producto.
 * - `ejemplo/<archivo>`: ilustraciones de referencias/assets (seed y desarrollo), servidas desde /public/productos.
 * TODO: servir las fotos reales de R2 (p. ej. GET /api/fotos/:key) cuando exista POST /productos/:id/foto.
 */
export function urlFoto(fotoKey: string | null): string | null {
  if (!fotoKey) return null
  if (fotoKey.startsWith('ejemplo/')) return `/productos/${fotoKey.slice('ejemplo/'.length)}`
  return null
}
