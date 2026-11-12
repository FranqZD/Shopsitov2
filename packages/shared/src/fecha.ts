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
