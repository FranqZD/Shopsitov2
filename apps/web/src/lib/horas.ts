const FIN_DEL_DIA = '18:00'

/**
 * Atajos de hora límite al publicar: "En 1 h", horas fijas y "Fin del día". Solo los que aún
 * no pasan, porque la API rechaza una hora límite anterior a la actual. Puede quedar vacío.
 */
export function opcionesHora(horaActual: string) {
  const [h = 0] = horaActual.split(':').map(Number)
  const enUnaHora = `${String(h + 1).padStart(2, '0')}:${horaActual.slice(3)}`
  return [
    // Después de las 23:00 caería en mañana, y todo lo que se publica es de hoy.
    ...(h < 23 ? [{ texto: 'En 1 h', valor: enUnaHora }] : []),
    ...['12:00', '14:00', '16:00'].map((x) => ({ texto: x, valor: x })),
    { texto: 'Fin del día', valor: FIN_DEL_DIA },
  ].filter((o, i, arr) => o.valor > horaActual && arr.findIndex((x) => x.valor === o.valor) === i)
}
