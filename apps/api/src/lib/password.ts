// PBKDF2 con WebCrypto: funciona igual en Workers y en Node (lo usa el seed).
// Workers limita PBKDF2 a 100 000 iteraciones.
const ITERACIONES = 100_000

const aBase64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const deBase64 = (s: string) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0))

async function derivar(password: string, salt: Uint8Array, iteraciones: number) {
  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iteraciones },
    clave,
    256,
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivar(password, salt, ITERACIONES)
  return `pbkdf2$${ITERACIONES}$${aBase64(salt)}$${aBase64(hash)}`
}

export async function verificarPassword(password: string, guardado: string): Promise<boolean> {
  const [algo, iter, salt, hash] = guardado.split('$')
  if (algo !== 'pbkdf2' || !iter || !salt || !hash) return false
  const calculado = aBase64(await derivar(password, deBase64(salt), Number(iter)))
  return calculado === hash
}
