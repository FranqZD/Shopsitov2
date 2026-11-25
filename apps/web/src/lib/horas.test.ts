import { describe, expect, it } from 'vitest'
import { opcionesHora } from './horas'

const valores = (hora: string) => opcionesHora(hora).map((o) => o.valor)

describe('opcionesHora', () => {
  it('ofrece una hora más tarde, las fijas que faltan y el fin del día', () => {
    expect(valores('09:05')).toEqual(['10:05', '12:00', '14:00', '16:00', '18:00'])
    expect(valores('14:30')).toEqual(['15:30', '16:00', '18:00'])
  })

  it('no ofrece horas que ya pasaron ni repetidas', () => {
    expect(valores('11:00')).toEqual(['12:00', '14:00', '16:00', '18:00'])
    expect(valores('18:00')).toEqual(['19:00'])
    expect(valores('20:15')).toEqual(['21:15'])
  })

  it('después de las 23:00 no queda ningún atajo', () => {
    expect(valores('22:59')).toEqual(['23:59'])
    expect(valores('23:10')).toEqual([])
  })
})
