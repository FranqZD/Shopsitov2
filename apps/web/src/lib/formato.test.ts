import { describe, expect, it } from 'vitest'
import {
  colorAvatar,
  desdeCuando,
  formatoCuenta,
  formatoFaltan,
  formatoPrecio,
  haceCuanto,
  iniciales,
  nombreConInicial,
  tituloHoy,
} from './formato'

describe('formato', () => {
  it('muestra precios sin decimales cuando son pesos cerrados', () => {
    expect(formatoPrecio(3500)).toBe('$35')
    expect(formatoPrecio(125000)).toBe('$1,250')
    expect(formatoPrecio(3550)).toBe('$35.50')
  })

  it('formatea la cuenta regresiva', () => {
    expect(formatoCuenta(17 * 60 + 42)).toBe('17:42')
    expect(formatoCuenta(-5)).toBe('0:00')
    expect(formatoFaltan(48 * 60)).toBe('48 min')
    expect(formatoFaltan(133 * 60)).toBe('2 h 13 min')
  })

  it('saca iniciales y un color estable', () => {
    expect(iniciales('Mariana López')).toBe('ML')
    expect(iniciales('Luis Ángel Torres')).toBe('LT')
    expect(colorAvatar('abc')).toBe(colorAvatar('abc'))
  })

  it('arma el título del día', () => {
    expect(tituloHoy('2026-11-11')).toBe('Hoy, miércoles 11 de nov')
  })

  it('abrevia el apellido en reseñas', () => {
    expect(nombreConInicial('Luis Ángel Torres')).toBe('Luis Ángel T.')
    expect(nombreConInicial('Ana')).toBe('Ana')
  })

  it('dice hace cuánto en días de calendario del campus', () => {
    // 2026-11-20T18:00Z = 12:00 del 20 de nov en el campus
    const ahora = new Date('2026-11-20T18:00:00Z')
    expect(haceCuanto('2026-11-20T15:00:00Z', ahora)).toBe('Hoy')
    // 03:00Z del 20 todavía es 19 en el campus
    expect(haceCuanto('2026-11-20T03:00:00Z', ahora)).toBe('Ayer')
    expect(haceCuanto('2026-11-17T18:00:00Z', ahora)).toBe('Hace 3 días')
    expect(haceCuanto('2026-11-10T18:00:00Z', ahora)).toBe('La semana pasada')
    expect(haceCuanto('2026-10-01T18:00:00Z', ahora)).toBe('1 de oct')
  })

  it('dice desde cuándo está en Shopsito', () => {
    const ahora = new Date('2026-11-20T18:00:00Z')
    expect(desdeCuando('2026-08-15T18:00:00Z', ahora)).toBe('En Shopsito desde agosto')
    expect(desdeCuando('2025-12-15T18:00:00Z', ahora)).toBe('En Shopsito desde diciembre de 2025')
  })
})
