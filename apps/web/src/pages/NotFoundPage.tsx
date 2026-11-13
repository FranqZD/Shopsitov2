import { Boton } from '../components/Boton'

export function NotFoundPage() {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-[26px] font-bold text-azul">Aquí no hay nada</h1>
      <p className="text-[15px] text-tinta-2">Esta página no existe o ya se quitó.</p>
      <Boton to="/" tamano="md">
        Ver lo de hoy
      </Boton>
    </main>
  )
}
