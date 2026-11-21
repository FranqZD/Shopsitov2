import { describe, expect, it } from 'vitest'
import { avisoComprador, pendienteVencido, problemaTransicion, resumenItems } from './logica'

describe('pedidos', () => {
  it('el vendedor solo acepta o rechaza pendientes y solo entrega aceptados', () => {
    expect(problemaTransicion('pendiente', 'aceptar')).toBeNull()
    expect(problemaTransicion('pendiente', 'rechazar')).toBeNull()
    expect(problemaTransicion('aceptado', 'entregar')).toBeNull()
    expect(problemaTransicion('pendiente', 'entregar')).toBe('Primero acepta el pedido.')
    expect(problemaTransicion('aceptado', 'aceptar')).not.toBeNull()
    expect(problemaTransicion('aceptado', 'rechazar')).not.toBeNull()
    expect(problemaTransicion('entregado', 'entregar')).not.toBeNull()
    expect(problemaTransicion('cancelado', 'aceptar')).toBe('Este pedido ya se canceló.')
  })

  it('un pendiente vence al llegar la hora límite o si es de otro día', () => {
    const ahora = { fecha: '2026-11-20', hora: '10:30' }
    expect(pendienteVencido({ fecha: '2026-11-20', horaLimite: '11:00' }, ahora)).toBe(false)
    expect(pendienteVencido({ fecha: '2026-11-20', horaLimite: '10:30' }, ahora)).toBe(true)
    expect(pendienteVencido({ fecha: '2026-11-19', horaLimite: '23:59' }, ahora)).toBe(true)
  })

  it('arma el aviso para el comprador', () => {
    const resumen = resumenItems([
      { cantidad: 2, nombre: 'Molletes' },
      { cantidad: 1, nombre: 'Café de olla' },
    ])
    expect(resumen).toBe('2 × Molletes, 1 × Café de olla')
    expect(
      avisoComprador('aceptado', { vendedor: 'Mariana López', resumen, punto: 'Biblioteca' }),
    ).toBe('Mariana aceptó tu pedido de 2 × Molletes, 1 × Café de olla. Te espera en Biblioteca.')
  })
})
