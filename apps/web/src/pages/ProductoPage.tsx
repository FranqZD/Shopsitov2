import { useParams } from 'react-router'
import { Pendiente } from '../components/Pendiente'

export function ProductoPage() {
  const { id } = useParams()
  return <Pendiente titulo={`Producto ${id}`} />
}
