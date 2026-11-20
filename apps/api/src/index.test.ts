import { describe, expect, it } from 'vitest'
import { sign } from 'hono/jwt'
import app from './index'
import type { Bindings } from './env'
import { JWT_ALG } from './middleware/auth'

// Sin D1/R2 reales: estas pruebas solo cubren rutas que no tocan la base.
const env = { JWT_SECRET: 'test' } as Bindings

describe('api', () => {
  it('GET /api/health responde ok', async () => {
    const res = await app.request('/api/health', {}, env)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true })
  })

  it('rutas inexistentes usan el formato de error común', async () => {
    const res = await app.request('/api/no-existe', {}, env)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'NOT_FOUND', message: expect.any(String) } })
  })

  it('las rutas protegidas exigen token', async () => {
    const res = await app.request('/api/usuarios/me', {}, env)
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } })
  })

  it('la validación Zod responde 400 con el formato común', async () => {
    const res = await app.request(
      '/api/auth/login',
      { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } },
      env,
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })

  it.each([
    '/api/productos/hoy',
    '/api/productos/00000000-0000-4000-8000-000000000201',
    '/api/puntos-entrega',
  ])('GET %s exige sesión', async (ruta) => {
    const res = await app.request(ruta, {}, env)
    expect(res.status).toBe(401)
  })

  it('GET /api/productos/:id valida que el id sea UUID', async () => {
    const token = await sign(
      { sub: 'u', rol: 'usuario', exp: Math.floor(Date.now() / 1000) + 60 },
      env.JWT_SECRET,
      JWT_ALG,
    )
    const res = await app.request(
      '/api/productos/no-es-uuid',
      { headers: { authorization: `Bearer ${token}` } },
      env,
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })
})
