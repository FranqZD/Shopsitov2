import type { ReactNode } from 'react'

/** Marcador para páginas que aún no se implementan. */
export function Pendiente({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold">{titulo}</h1>
      <p className="text-gray-500">Página pendiente de implementar.</p>
      {children}
    </section>
  )
}
