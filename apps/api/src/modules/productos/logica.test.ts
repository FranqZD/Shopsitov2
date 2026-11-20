import { describe, expect, it } from 'vitest'
import {
  ESTADOS_VENTA,
  MAX_FOTO_BYTES,
  esFotoR2,
  estadoSegunCantidad,
  horaLimiteValida,
  problemaFoto,
} from './logica'

describe('productos', () => {
  it('la hora límite debe ser posterior a la actual', () => {
    expect(horaLimiteValida('11:00', '10:59')).toBe(true)
    expect(horaLimiteValida('10:59', '10:59')).toBe(false)
    expect(horaLimiteValida('09:00', '10:30')).toBe(false)
  })

  it('los pedidos cancelados y rechazados no cuentan como venta', () => {
    expect(ESTADOS_VENTA).not.toContain('cancelado')
    expect(ESTADOS_VENTA).not.toContain('rechazado')
  })

  it('con existencias el producto vuelve a estar disponible', () => {
    expect(estadoSegunCantidad(3)).toBe('disponible')
    expect(estadoSegunCantidad(0)).toBe('agotado')
  })

  it('solo acepta fotos JPG, PNG o WebP de hasta 5 MB', () => {
    expect(problemaFoto('image/jpeg', 200_000)).toBeNull()
    expect(problemaFoto('image/webp', MAX_FOTO_BYTES)).toBeNull()
    expect(problemaFoto('image/gif', 200_000)).toMatch(/JPG/)
    expect(problemaFoto('image/png', 0)).toMatch(/vacía/)
    expect(problemaFoto('image/png', MAX_FOTO_BYTES + 1)).toMatch(/5 MB/)
  })

  it('las fotos de ejemplo del seed no se borran de R2', () => {
    expect(esFotoR2('productos/abc/def')).toBe(true)
    expect(esFotoR2('ejemplo/molletes.svg')).toBe(false)
    expect(esFotoR2(null)).toBe(false)
  })
})
