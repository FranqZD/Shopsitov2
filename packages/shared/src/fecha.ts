export const ZONA_HORARIA = 'America/Mexico_City'

/**
 * Fecha (YYYY-MM-DD) y hora (HH:MM) actuales en la zona horaria del campus.
 * El catálogo del día se filtra con `fecha = hoy` y `horaLimite > hora`, así que
 * los productos "se cierran solos" sin necesidad de un cron.
 */
export function ahoraCampus(fecha: Date = new Date()): { fecha: string; hora: string } {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA_HORARIA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(fecha)
      .map((p) => [p.type, p.value]),
  )
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    hora: `${partes.hour}:${partes.minute}`,
  }
}

/**
 * Segundos que faltan (en hora del campus) para llegar a `hora` (HH:MM) hoy.
 * Negativo si ya pasó. Lo usa el frontend para los contadores de "Faltan 17:42".
 */
export function segundosHastaHora(hora: string, ahora: Date = new Date()): number {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA_HORARIA,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(ahora)
      .map((p) => [p.type, Number(p.value)]),
  )
  const [h = 0, m = 0] = hora.split(':').map(Number)
  return (
    h * 3600 +
    m * 60 -
    ((partes.hour ?? 0) * 3600 + (partes.minute ?? 0) * 60 + (partes.second ?? 0))
  )
}
