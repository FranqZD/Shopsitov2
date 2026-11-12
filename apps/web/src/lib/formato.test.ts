import { describe, expect, it } from 'vitest'
import { formatoPrecio } from './formato'

describe('formatoPrecio', () => {
  it('convierte centavos a pesos', () => {
    expect(formatoPrecio(2500)).toContain('25.00')
  })
})
