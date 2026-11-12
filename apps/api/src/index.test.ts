import { describe, expect, it } from 'vitest'
import app from './index'
import type { Bindings } from './env'

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
})
