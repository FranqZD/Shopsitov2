import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { ProductoHoy } from '@shopsito/shared'
import { api } from '../lib/api'
import { formatoPrecio } from '../lib/formato'

export function HomePage() {
  const [productos, setProductos] = useState<ProductoHoy[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.productos
      .hoy()
      .then(setProductos)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Disponible hoy</h1>
      {error && <p className="text-red-600">Error: {error}</p>}
      {!productos && !error && <p className="text-gray-500">Cargando…</p>}
      {productos?.length === 0 && <p className="text-gray-500">No hay productos por ahora.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {productos?.map((p) => (
          <li key={p.id} className="rounded-lg border bg-white p-4">
            <Link to={`/producto/${p.id}`} className="font-semibold hover:underline">
              {p.nombre}
            </Link>
            <p className="text-sm text-gray-600">
              {formatoPrecio(p.precio)} · {p.cantidad} disponibles · hasta las {p.horaLimite}
            </p>
            <Link
              to={`/perfil/${p.vendedor.id}`}
              className="text-sm text-emerald-700 hover:underline"
            >
              {p.vendedor.nombre}
              {p.vendedor.insigniaComunidad && ' 🎓'}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
