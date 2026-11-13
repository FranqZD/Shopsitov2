import { describe, expect, it } from 'vitest'
import { colorAvatar, formatoCuenta, formatoPrecio, iniciales, tituloHoy } from './formato'

describe('formato', () => {
  it('muestra precios sin decimales cuando son pesos cerrados', () => {
    expect(formatoPrecio(3500)).toBe('$35')
    expect(formatoPrecio(125000)).toBe('$1,250')
    expect(formatoPrecio(3550)).toBe('$35.50')
  })

  it('formatea la cuenta regresiva', () => {
    expect(formatoCuenta(17 * 60 + 42)).toBe('17:42')
    expect(formatoCuenta(-5)).toBe('0:00')
  })

  it('saca iniciales y un color estable', () => {
    expect(iniciales('Mariana López')).toBe('ML')
    expect(iniciales('Luis Ángel Torres')).toBe('LT')
    expect(colorAvatar('abc')).toBe(colorAvatar('abc'))
  })

  it('arma el título del día', () => {
    expect(tituloHoy('2026-11-11')).toBe('Hoy, miércoles 11 de nov')
  })
})
