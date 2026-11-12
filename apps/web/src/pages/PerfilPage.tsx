import { useParams } from 'react-router'
import { Pendiente } from '../components/Pendiente'

export function PerfilPage() {
  const { id } = useParams()
  return <Pendiente titulo={`Perfil ${id}`} />
}
