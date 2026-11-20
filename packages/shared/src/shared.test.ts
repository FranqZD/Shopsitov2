import { describe, expect, it } from 'vitest'
import { ahoraCampus, crearProductoSchema, esCorreoInstitucional, segundosHastaHora } from './index'

describe('ahoraCampus', () => {
  it('convierte a la hora de Ciudad de México (UTC-6)', () => {
    expect(ahoraCampus(new Date('2026-03-10T02:30:00Z'))).toEqual({
      fecha: '2026-03-09',
      hora: '20:30',
    })
  })
})

describe('segundosHastaHora', () => {
  it('cuenta los segundos que faltan en hora del campus', () => {
    // 2026-03-10T16:12:18Z = 10:12:18 en Ciudad de México
    expect(segundosHastaHora('10:30', new Date('2026-03-10T16:12:18Z'))).toBe(17 * 60 + 42)
  })

  it('es negativo si la hora ya pasó', () => {
    expect(segundosHastaHora('10:00', new Date('2026-03-10T16:12:18Z'))).toBeLessThan(0)
  })
})

describe('crearProductoSchema', () => {
  it('exige una categoría conocida', () => {
    const r = crearProductoSchema.safeParse({
      nombre: 'Tamal',
      precio: 2500,
      cantidad: 3,
      categoria: 'ropa',
      horaLimite: '14:00',
    })
    expect(r.success).toBe(false)
  })

  it('rechaza precios con decimales (se manejan en centavos)', () => {
    const r = crearProductoSchema.safeParse({
      nombre: 'Tamal',
      precio: 25.5,
      cantidad: 3,
      categoria: 'comida',
      horaLimite: '14:00',
    })
    expect(r.success).toBe(false)
  })

  it('acepta un producto válido', () => {
    const r = crearProductoSchema.safeParse({
      nombre: 'Tamal',
      precio: 2500,
      cantidad: 3,
      categoria: 'comida',
      horaLimite: '14:00',
    })
    expect(r.success).toBe(true)
  })
})

describe('esCorreoInstitucional', () => {
  it('acepta el dominio de la universidad y sus subdominios', () => {
    expect(esCorreoInstitucional('Ana@Universidad.edu.mx')).toBe(true)
    expect(esCorreoInstitucional('ana@alumnos.universidad.edu.mx')).toBe(true)
  })

  it('rechaza otros dominios aunque se parezcan', () => {
    expect(esCorreoInstitucional('ana@gmail.com')).toBe(false)
    expect(esCorreoInstitucional('ana@miuniversidad.edu.mx')).toBe(false)
    expect(esCorreoInstitucional('ana@universidad.edu.mx.falso.com')).toBe(false)
  })
})
