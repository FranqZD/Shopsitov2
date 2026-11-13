import { ChevronLeft, RefreshCw } from 'lucide-react'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'

type Props = {
  estado: { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'no-encontrado' }
  recargar: () => void
}

/** Estados intermedios de las pantallas que dependen del catálogo del día. */
export function EstadoCarga({ estado, recargar }: Props) {
  return (
    <main className="flex flex-col gap-5 px-5 pt-3.5">
      <BotonRedondo to="/" label="Regresar a lo de hoy">
        <ChevronLeft size={22} strokeWidth={2.2} />
      </BotonRedondo>
      {estado.tipo === 'cargando' && (
        <div aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Cargando</span>
          <div className="h-[340px] skeleton rounded-hoja" />
          <div className="h-7 w-3/4 skeleton rounded-full" />
          <div className="h-24 skeleton rounded-[22px]" />
        </div>
      )}
      {estado.tipo === 'error' && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-hoja bg-tarjeta px-6 py-7 text-center shadow-tarjeta"
        >
          <h1 className="font-display text-[23px] font-bold">No se pudo cargar</h1>
          <p className="text-[15px] text-tinta-2">{estado.mensaje}</p>
          <Boton variante="suave" tamano="md" onClick={recargar}>
            <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
            Reintentar
          </Boton>
        </div>
      )}
      {estado.tipo === 'no-encontrado' && (
        <div className="flex flex-col items-center gap-3 rounded-hoja bg-tarjeta px-6 py-7 text-center shadow-tarjeta">
          <h1 className="font-display text-[23px] font-bold text-azul">Ya no está disponible</h1>
          <p className="text-[15px] leading-normal text-tinta-2">
            Se acabó o ya pasó su hora límite. Hay más cosas en lo de hoy.
          </p>
          <Boton to="/" tamano="md">
            Ver qué más hay hoy
          </Boton>
        </div>
      )}
    </main>
  )
}
