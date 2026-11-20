import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { notFound } from '../../lib/errors'

// Fotos públicas de productos guardadas en R2 (GET /api/fotos/productos/<id>/<uuid>).
export const fotosRoutes = new Hono<AppEnv>().get('/productos/:id/:archivo', async (c) => {
  const { id, archivo } = c.req.param()
  const objeto = await c.env.FOTOS.get(`productos/${id}/${archivo}`)
  if (!objeto) throw notFound('Foto')
  return new Response(objeto.body, {
    headers: {
      'content-type': objeto.httpMetadata?.contentType ?? 'application/octet-stream',
      // Cada subida usa una key nueva, así que el contenido de una URL nunca cambia.
      'cache-control': 'public, max-age=31536000, immutable',
      etag: objeto.httpEtag,
    },
  })
})
