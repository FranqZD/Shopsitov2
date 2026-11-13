// Tema: data-theme="oscuro" en <html> (DESIGN.md §2). index.html lo aplica antes de pintar.
export type Tema = 'claro' | 'oscuro'
const CLAVE = 'shopsito.tema'

export const temaActual = (): Tema =>
  document.documentElement.dataset.theme === 'oscuro' ? 'oscuro' : 'claro'

export function cambiarTema(tema: Tema) {
  if (tema === 'oscuro') document.documentElement.dataset.theme = 'oscuro'
  else delete document.documentElement.dataset.theme
  try {
    localStorage.setItem(CLAVE, tema)
  } catch {
    // Sin almacenamiento (modo privado): el tema dura solo esta visita.
  }
}
