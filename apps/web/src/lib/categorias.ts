import { Cookie, CupSoda, Package, Pencil, Utensils, type LucideIcon } from 'lucide-react'
import type { CategoriaProducto } from '@shopsito/shared'

/** Nombre e icono de cada categoría, en el orden en que se muestran. */
export const CATEGORIAS: { id: CategoriaProducto; nombre: string; Icono: LucideIcon }[] = [
  { id: 'comida', nombre: 'Comida', Icono: Utensils },
  { id: 'bebidas', nombre: 'Bebidas', Icono: CupSoda },
  { id: 'snacks', nombre: 'Snacks', Icono: Cookie },
  { id: 'articulos', nombre: 'Artículos', Icono: Package },
  { id: 'utiles', nombre: 'Útiles', Icono: Pencil },
]

export const nombreCategoria = (id: CategoriaProducto) =>
  CATEGORIAS.find((c) => c.id === id)?.nombre ?? id
