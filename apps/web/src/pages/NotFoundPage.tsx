import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold">Página no encontrada</h1>
      <Link to="/" className="text-emerald-700">
        Volver al inicio
      </Link>
    </section>
  )
}
