import { describe, expect, it } from 'vitest'
import { destinoSeguro, rutaLogin, tokenVigente } from './sesion'

const tokenCon = (payload: object) => `x.${btoa(JSON.stringify(payload))}.y`
const ahora = 1_800_000_000_000

describe('tokenVigente', () => {
  it('acepta un token que vence después de ahora', () => {
    expect(tokenVigente(tokenCon({ exp: ahora / 1000 + 60 }), ahora)).toBe(true)
  })

  it('rechaza tokens vencidos, sin exp o mal formados', () => {
    expect(tokenVigente(tokenCon({ exp: ahora / 1000 - 1 }), ahora)).toBe(false)
    expect(tokenVigente(tokenCon({ sub: 'u' }), ahora)).toBe(false)
    expect(tokenVigente('basura', ahora)).toBe(false)
  })
})

describe('regreso después de entrar', () => {
  it('arma /login con la ruta de regreso', () => {
    expect(rutaLogin('/')).toBe('/login')
    expect(rutaLogin('/producto/1?x=1')).toBe('/login?volver=%2Fproducto%2F1%3Fx%3D1')
  })

  it('solo acepta destinos internos', () => {
    expect(destinoSeguro('/pedidos')).toBe('/pedidos')
    expect(destinoSeguro('//evil.com')).toBeNull()
    expect(destinoSeguro('https://evil.com')).toBeNull()
    expect(destinoSeguro(null)).toBeNull()
  })
})
