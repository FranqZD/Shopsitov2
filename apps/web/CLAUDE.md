# Frontend (`apps/web`): cómo construir cosas

React 19 + Vite + React Router 8 (`createBrowserRouter` en `src/router.tsx`) + Tailwind v4 + `lucide-react`. El diseño actual de la app **es la referencia aprobada**: toda pantalla nueva debe verse como las existentes. Reglas de diseño resumidas en el README ("Diseño del frontend").

## Mapa

```
src/
├── router.tsx            # rutas agrupadas por layout
├── styles/shopsito.css   # tokens del tema (colores, radios, sombras, animaciones, modo oscuro)
├── components/           # componentes base: reutiliza antes de crear
│   ├── Layouts.tsx       # LayoutConNav (Hoy/Vender/Pedidos), LayoutMovil (detalles), LayoutAcceso (login…)
│   ├── LayoutAdmin.tsx   # admin de escritorio con menú lateral (exige rol admin)
│   ├── NavInferior.tsx / NavSuperior.tsx   # nav celular / tablet-computadora (items en lib/navegacion.ts)
│   ├── Boton, BotonRedondo, Chip, Campo (CLASE_INPUT, Etiqueta)
│   ├── Tarjeta (producto), ChipHora (ChipHasta, ChipFaltan, SEGUNDOS_URGENTE), FotoProducto
│   ├── PastillaEstado (pedido, reporte, cantidad), Insignia (Insignia, InsigniaMini, SinVerificar)
│   ├── Avatar, Estrellas, SelectorCantidad, BarraAccion, BarraExistencias, Skeleton, LogoShopsito
├── pages/                # una pantalla por archivo: <Nombre>Page.tsx
└── lib/
    ├── api.ts            # cliente tipado: api.<recurso>.<accion>(), lanza ApiRequestError
    ├── useProductosHoy.ts# catálogo del día con caché en memoria
    ├── ejemplos.ts       # datos de ejemplo de pantallas sin API (cada uso con TODO)
    ├── formato.ts        # formatoPrecio, formatoCuenta, formatoFaltan, iniciales, colorAvatar, tituloHoy…
    ├── sesion.ts, tema.ts, fotos.ts (urlFoto), useAhora.ts, navegacion.ts
```

## Crear una pantalla

1. Archivo `src/pages/<Nombre>Page.tsx` que exporta `function <Nombre>Page()`.
2. Regístrala en `src/router.tsx` dentro del layout adecuado:
   - `LayoutConNav`: secciones principales con navegación inferior en celular.
   - `LayoutMovil`: detalles o pantallas con `BarraAccion` propia (sin nav inferior).
   - `LayoutAcceso`: flujos de cuenta. `/admin/*` va en `LayoutAdmin`.
3. Estructura típica: encabezado con `BotonRedondo` (regresar) + título `font-display text-[25px]…text-azul`, tarjetas `rounded-grande bg-tarjeta shadow-tarjeta`, y la acción principal en `<BarraAccion>`.
4. Textos en español con el tono de la app (directo, cercano, sin marketing). Revisa pantallas parecidas y copia su redacción.

## Datos

- Siempre por `src/lib/api.ts`; agrega ahí la función nueva con los tipos de `@shopsito/shared` (nunca tipos duplicados en web).
- `/api` va por el proxy de Vite (mismo origen): no hay CORS ni URLs absolutas.
- Estados de carga/vacío/error como en `CatalogoPage` (skeletons con la forma real, error con "Reintentar"). Para pantallas que dependen del catálogo usa `EstadoCarga`.
- Errores: muestra `error.message` (ya viene en tono amigable; 401 → "Entra a tu cuenta…", 501 → "Esto todavía no está listo…").
- Si la API aún no da un dato, usa `lib/ejemplos.ts` con un `// TODO:` que diga qué endpoint lo reemplaza. **No cambies el backend para encajar un dato de diseño sin que se pida.**
- Fotos: `urlFoto(fotoKey)` + `<FotoProducto>`.
- Tiempo: `useAhora()` para contadores en vivo; `segundosHastaHora(horaLimite, ahora)` de shared. Urgente ≤ 30 min (`SEGUNDOS_URGENTE`) → `ChipFaltan` mango con mm:ss.

## Estilo (obligatorio)

- Solo clases del tema: `bg-papel`, `bg-tarjeta`, `text-tinta`, `text-tinta-2`, `bg-azul`/`text-sobre-azul`, `bg-azul-50`, `bg-mango`/`text-sobre-mango`, `bg-mango-50`/`text-mango-tinta`, `bg-verde(-50)`, `bg-error(-50)`, `bg-gris-50`, `rounded-foto|chico|tarjeta|grande|hoja`, `shadow-tarjeta|flotante|hoja`, `font-display`, `num`, `animate-pulso|rebote|salto|anillo|estrella`, `skeleton`. Sin hex sueltos salvo los fijos documentados (chips sobre foto, banner).
- Urgencia y poco stock en **mango**; rojo solo para errores reales.
- Botones y chips `rounded-full`; botón principal 56 px (`Boton tamano="lg"`); todo lo tocable ≥ 44 px.
- Iconos `lucide-react`, `strokeWidth` ~2, 17–22 px, con `aria-hidden` si son decorativos. Nunca emojis.
- Modo oscuro sale solo de los tokens (`data-theme="oscuro"`); no uses `text-white` sobre `bg-azul`.
- Accesibilidad: `aria-label` en botones de icono, `aria-pressed`/`aria-checked` en chips e interruptores, `role="alert"` en errores.

## Responsive

Diseña para celular (390 px) y luego agrega prefijos:

- `md:` (≥ 768) y `lg:` (≥ 1024): aparece `NavSuperior`, el contenido llega a 1152 px.
- Listas de productos: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`.
- Detalles/formularios: dos columnas con `md:grid md:grid-cols-[minmax(0,1fr)_400px]`; la columna derecha `md:sticky md:top-28` con el resumen y la `BarraAccion` (que en `md:` deja de ser fija). Ejemplos: `DetallePage`, `ConfirmarPage`, `PedidoDetallePage`.
- Pantallas de lectura: centradas con `md:mx-auto md:max-w-2xl`.
- Si la barra fija tapa contenido en celular, deja `pb-[130px] md:pb-0` en el `<main>`.

## Verificar

`pnpm format && pnpm lint && pnpm typecheck && pnpm test`. Para cambios visuales, revisa la pantalla en 390 px y en 1440 px (y modo oscuro) con la app corriendo.
