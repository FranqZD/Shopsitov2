import { useCallback, useEffect, useState } from 'react'
import type { PuntoEntrega } from '@shopsito/shared'
import { api } from '../lib/api'
import { getSesion } from '../lib/sesion'

// TODO: sección de reportes cuando exista GET /api/reportes.
export function AdminPage() {
  const esAdmin = getSesion()?.usuario.rol === 'admin'
  const [puntos, setPuntos] = useState<PuntoEntrega[]>([])
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [ubicacion, setUbicacion] = useState('')

  const cargar = useCallback(() => {
    api.puntosEntrega
      .listar()
      .then(setPuntos)
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(cargar, [cargar])

  const ejecutar = (accion: Promise<unknown>) =>
    accion.then(
      () => {
        setError(null)
        cargar()
      },
      (e: Error) => setError(e.message),
    )

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Puntos de entrega</h1>
      {!esAdmin && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
          Inicia sesión como admin (admin@shopsito.test) para crear o editar.
        </p>
      )}
      {error && <p className="mb-4 text-red-600">Error: {error}</p>}

      {esAdmin && (
        <form
          className="mb-6 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            ejecutar(api.puntosEntrega.crear({ nombre, ubicacion })).then(() => {
              setNombre('')
              setUbicacion('')
            })
          }}
        >
          <input
            className="rounded border px-2 py-1"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="rounded border px-2 py-1"
            placeholder="Ubicación"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
          <button className="rounded bg-emerald-600 px-3 py-1 text-white">Agregar</button>
        </form>
      )}

      <table className="w-full bg-white text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Nombre</th>
            <th className="p-2">Ubicación</th>
            <th className="p-2">Activo</th>
            {esAdmin && <th className="p-2" />}
          </tr>
        </thead>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.nombre}</td>
              <td className="p-2">{p.ubicacion}</td>
              <td className="p-2">{p.activo ? 'Sí' : 'No'}</td>
              {esAdmin && (
                <td className="space-x-2 p-2 text-right">
                  <button
                    className="text-emerald-700"
                    onClick={() =>
                      ejecutar(api.puntosEntrega.actualizar(p.id, { activo: !p.activo }))
                    }
                  >
                    {p.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    className="text-red-600"
                    onClick={() => ejecutar(api.puntosEntrega.eliminar(p.id))}
                  >
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
