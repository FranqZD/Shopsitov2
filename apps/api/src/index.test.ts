import { describe, expect, it } from 'vitest'
import { sign } from 'hono/jwt'
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

  const post = (ruta: string, body: unknown) =>
    app.request(
      ruta,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      },
      env,
    )

  it('registro valida nombre, correo y contraseña', async () => {
    const res = await post('/api/auth/registro', {
      nombre: 'A',
      correo: 'no-es-correo',
      password: '123',
    })
    expect(res.status).toBe(400)
    const { error } = (await res.json()) as { error: { details: { fieldErrors: object } } }
    expect(Object.keys(error.details.fieldErrors).sort()).toEqual(['correo', 'nombre', 'password'])
  })

  it('el correo institucional exige token', async () => {
    const res = await post('/api/auth/institucional', {
      correoInstitucional: 'ana@universidad.edu.mx',
    })
    expect(res.status).toBe(401)
  })

  it('publicar, editar, quitar y ver mis publicaciones exigen token', async () => {
    expect((await app.request('/api/productos/mios', {}, env)).status).toBe(401)
    const res = await post('/api/productos', {
      nombre: 'Molletes',
      precio: 3500,
      cantidad: 6,
      horaLimite: '23:59',
    })
    expect(res.status).toBe(401)
    const id = crypto.randomUUID()
    expect((await app.request(`/api/productos/${id}`, { method: 'DELETE' }, env)).status).toBe(401)
    const editar = await app.request(
      `/api/productos/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ precio: 4000 }),
        headers: { 'content-type': 'application/json' },
      },
      env,
    )
    expect(editar.status).toBe(401)
  })

  it('no deja publicar con una hora límite que ya pasó', async () => {
    const token = await sign(
      { sub: crypto.randomUUID(), rol: 'usuario', exp: Math.floor(Date.now() / 1000) + 60 },
      env.JWT_SECRET,
    )
    const res = await app.request(
      '/api/productos',
      {
        method: 'POST',
        // '00:00' nunca es posterior a la hora actual, así que falla antes de tocar la base.
        body: JSON.stringify({
          nombre: 'Molletes',
          precio: 3500,
          cantidad: 6,
          horaLimite: '00:00',
        }),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      },
      env,
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: { code: 'HORA_LIMITE_PASADA' } })
  })
})
