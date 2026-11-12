import { describe, expect, it } from 'vitest'
import { ahoraCampus, crearProductoSchema } from './index'

describe('ahoraCampus', () => {
  it('convierte a la hora de Ciudad de México (UTC-6)', () => {
    expect(ahoraCampus(new Date('2026-03-10T02:30:00Z'))).toEqual({
      fecha: '2026-03-09',
      hora: '20:30',
    })
  })
})

describe('crearProductoSchema', () => {
  it('rechaza precios con decimales (se manejan en centavos)', () => {
    const r = crearProductoSchema.safeParse({
      nombre: 'Tamal',
      precio: 25.5,
      cantidad: 3,
      horaLimite: '14:00',
    })
    expect(r.success).toBe(false)
  })

  it('acepta un producto válido', () => {
    const r = crearProductoSchema.safeParse({
      nombre: 'Tamal',
      precio: 2500,
      cantidad: 3,
      horaLimite: '14:00',
    })
    expect(r.success).toBe(true)
  })
})
