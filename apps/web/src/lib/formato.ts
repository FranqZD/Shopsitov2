const miles = new Intl.NumberFormat('es-MX')

/** El dinero viaja en centavos; solo se convierte al mostrarlo. "$35", "$1,250", "$35.50". */
export function formatoPrecio(centavos: number) {
  const pesos = centavos / 100
  return Number.isInteger(pesos)
    ? `$${miles.format(pesos)}`
    : `$${pesos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** "17:42" a partir de segundos. */
export function formatoCuenta(segundos: number) {
  const s = Math.max(0, Math.floor(segundos))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** "48 min" o "2 h 13 min" para tiempos largos (las cuentas mm:ss solo van en los últimos 30 min). */
export function formatoFaltan(segundos: number) {
  const min = Math.max(0, Math.round(segundos / 60))
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  return min % 60 ? `${h} h ${min % 60} min` : `${h} h`
}

/** Iniciales para avatares sin foto: "Mariana López" → "ML". */
export function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/)
  return (
    (partes[0]?.[0] ?? '') +
    (partes.length > 1 ? (partes.at(-1)?.[0] ?? '') : (partes[0]?.[1] ?? ''))
  ).toUpperCase()
}

/** Primer nombre: "Mariana López" → "Mariana". */
export const nombreCorto = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? nombre

// Fondos pastel de avatar (DESIGN.md §2); el texto siempre va en #1F3A68.
const PASTELES = ['#E4F3EA', '#FFE0B0', '#D5E1F0', '#F6DCE6']

/** Color estable por usuario para que su avatar no cambie entre pantallas. */
export function colorAvatar(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PASTELES[h % PASTELES.length]!
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "Hoy, miércoles 11 de nov" a partir de una fecha YYYY-MM-DD. */
export function tituloHoy(fecha: string) {
  const [a, m, d] = fecha.split('-').map(Number)
  const dia = new Date(Date.UTC(a!, m! - 1, d!)).getUTCDay()
  return `Hoy, ${DIAS[dia]} ${d} de ${MESES[m! - 1]}`
}

/** Saludo según la hora del campus (HH:MM). */
export function saludo(hora: string) {
  const h = Number(hora.slice(0, 2))
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

/** "1 cosa", "8 cosas". */
export const cosas = (n: number) => (n === 1 ? '1 cosa' : `${n} cosas`)
