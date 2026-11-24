# Wiki de Shopsito

1. [Descripción del proyecto](#1-descripción-del-proyecto)
2. [Componentes y métodos](#2-componentes-y-métodos)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Recursos que se van a crear](#4-recursos-que-se-van-a-crear)
5. [Diagrama de deployment](#5-diagrama-de-deployment)

Los diagramas están en [Mermaid](https://mermaid.js.org/): GitHub los dibuja solo.

---

## 1. Descripción del proyecto

**Shopsito** es un marketplace del día para la comunidad de una universidad. Cualquiera publica lo que trae **hoy** (comida, bebidas, snacks, artículos, útiles) con precio, cantidad y hora límite; otras personas lo piden y lo recogen en puntos de entrega dentro del campus.

### Problema que resuelve

Entre estudiantes ya se vende comida y artículos, pero por grupos de mensajes: no se sabe qué sigue disponible, hasta qué hora ni dónde se entrega. Shopsito junta esa oferta en un catálogo que solo muestra lo que todavía se puede pedir.

### Actores

| Actor         | Qué puede hacer                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| **Comprador** | Ver el catálogo, pedir, seguir el estado de su pedido, cancelarlo si sigue pendiente, calificar y reportar |
| **Vendedor**  | Publicar con foto, editar o quitar lo suyo, y aceptar, rechazar o entregar los pedidos que recibe          |
| **Admin**     | Gestionar puntos de entrega, ocultar o borrar publicaciones y revisar reportes                             |

Comprador y vendedor son la misma cuenta (rol `usuario`): cualquiera puede comprar y vender.

### Reglas de negocio

- **Todo es de hoy.** El catálogo muestra productos con `fecha = hoy`, `horaLimite > ahora` (hora `America/Mexico_City`), disponibles y de un vendedor activo. Se filtra al consultar, sin cron.
- **Un pedido es de un solo vendedor** y nadie puede pedir lo que él mismo vende.
- **Vencimiento.** Si el vendedor no acepta antes de la hora límite, el pedido se cancela solo la siguiente vez que se consulta.
- **Inventario.** Pedir aparta existencias; rechazar o cancelar las devuelve. Al llegar a 0, el producto queda `agotado`.
- **Calificaciones.** Solo quien compró un pedido `entregado`, una vez por pedido, de 1 a 5 estrellas.
- **Insignia Comunidad.** Se gana con un correo `@universidad.edu.mx`, al registrarse o ligándolo después. No se mandan correos ni códigos.
- **Dinero** en centavos (entero).

### Ciclo de vida de un pedido

```mermaid
stateDiagram-v2
    [*] --> pendiente: el comprador pide
    pendiente --> aceptado: el vendedor acepta
    pendiente --> rechazado: el vendedor rechaza
    pendiente --> cancelado: el comprador cancela o vence la hora límite
    aceptado --> entregado: el vendedor entrega
    entregado --> [*]
    rechazado --> [*]
    cancelado --> [*]
```

---

## 2. Componentes y métodos

### 2.1 Vista general

```mermaid
flowchart LR
    subgraph web["apps/web (React)"]
        paginas["Páginas"]
        comp["Componentes de UI"]
        hooks["Hooks y utilidades"]
        cliente["Cliente api.ts"]
        paginas --> comp
        paginas --> hooks
        paginas --> cliente
        hooks --> cliente
    end

    subgraph shared["packages/shared"]
        zod["Esquemas Zod, tipos, enums y fechas"]
    end

    subgraph api["apps/api (Worker con Hono)"]
        mw["Middleware: auth y validación"]
        mods["Módulos (rutas)"]
        logica["Lógica pura"]
        orm["Drizzle ORM"]
        mw --> mods
        mods --> logica
        mods --> orm
    end

    d1[("D1 (SQLite)")]
    r2[("R2 (fotos)")]

    cliente -->|"JSON sobre /api"| mw
    orm --> d1
    mods -->|"binding FOTOS"| r2
    web -.->|"importa"| shared
    api -.->|"importa"| shared
```

El código usa funciones y módulos de TypeScript, no clases. En los diagramas, **cada clase representa un módulo, una tabla o un objeto**, y sus métodos son las funciones o rutas que expone.

### 2.2 Modelo de dominio

Tablas de D1 (`apps/api/src/db/schema.ts`). Las fechas se guardan como texto ISO y los IDs como UUID en texto.

```mermaid
classDiagram
    direction TB

    class Usuario {
        +id: string
        +nombre: string
        +correo: string
        +passwordHash: string
        +telefono: string
        +rol: Rol
        +correoVerificado: boolean
        +correoInstitucional: string
        +insigniaComunidad: boolean
        +activo: boolean
        +creadoEn: string
    }
    class Producto {
        +id: string
        +vendedorId: string
        +nombre: string
        +descripcion: string
        +precio: int
        +cantidad: int
        +categoria: CategoriaProducto
        +fotoKey: string
        +fecha: string
        +horaLimite: string
        +estado: EstadoProducto
    }
    class Pedido {
        +id: string
        +compradorId: string
        +vendedorId: string
        +puntoEntregaId: string
        +estado: EstadoPedido
        +total: int
        +creadoEn: string
    }
    class DetallePedido {
        +id: string
        +pedidoId: string
        +productoId: string
        +cantidad: int
        +precioUnitario: int
    }
    class PuntoEntrega {
        +id: string
        +nombre: string
        +ubicacion: string
        +activo: boolean
    }
    class Calificacion {
        +id: string
        +pedidoId: string
        +estrellas: int
        +comentario: string
        +fecha: string
    }
    class Notificacion {
        +id: string
        +usuarioId: string
        +mensaje: string
        +leida: boolean
        +fecha: string
    }
    class Reporte {
        +id: string
        +reportanteId: string
        +objetivoId: string
        +tipoObjetivo: TipoObjetivoReporte
        +motivo: string
        +detalle: string
        +estado: EstadoReporte
        +nota: string
        +creadoEn: string
    }

    Usuario "1" --> "0..*" Producto : publica
    Usuario "1" --> "0..*" Pedido : compra
    Usuario "1" --> "0..*" Pedido : vende
    Usuario "1" --> "0..*" Notificacion : recibe
    Usuario "1" --> "0..*" Reporte : reporta
    Pedido "1" *-- "1..*" DetallePedido : contiene
    DetallePedido "0..*" --> "1" Producto : incluye
    Pedido "0..*" --> "1" PuntoEntrega : se entrega en
    Pedido "1" --> "0..1" Calificacion : recibe
```

`Reporte.objetivoId` apunta a un usuario o a un producto según `tipoObjetivo`, sin llave foránea. La tabla `codigos_verificacion` también existe, pero está sin uso.

| Enum                  | Valores                                                        |
| --------------------- | -------------------------------------------------------------- |
| `Rol`                 | `usuario`, `admin`                                             |
| `CategoriaProducto`   | `comida`, `bebidas`, `snacks`, `articulos`, `utiles`           |
| `EstadoProducto`      | `disponible`, `agotado`, `oculto`                              |
| `EstadoPedido`        | `pendiente`, `aceptado`, `rechazado`, `entregado`, `cancelado` |
| `EstadoReporte`       | `abierto`, `resuelto`, `descartado`                            |
| `TipoObjetivoReporte` | `usuario`, `producto`                                          |

### 2.3 Backend: módulos de la API

Cada módulo es un router de Hono en `apps/api/src/modules/<recurso>/routes.ts`, montado bajo `/api`. Las rutas son funciones anónimas: el nombre del método describe lo que hace la ruta. Los métodos **en cursiva** ya tienen ruta y validación, pero aún responden `501`.

```mermaid
classDiagram
    direction LR

    class App {
        <<Hono>>
        +health() Estado
        +onError(err) ApiError
        +onNotFound() ApiError
    }
    class AuthRoutes {
        +registro(RegistroInput) LoginResponse
        +login(LoginInput) LoginResponse
        +logout() void
        +institucional(VincularInstitucionalInput) void
        -crearSesion(usuario, secreto) LoginResponse
        -institucionalOcupado(db, correo, usuarioId) boolean
    }
    class UsuariosRoutes {
        +yo() UsuarioPrivado
        +perfil(id) PerfilUsuario
        +actualizarPerfil(ActualizarPerfilInput) UsuarioPrivado*
        +eliminarCuenta() void*
    }
    class ProductosRoutes {
        +hoy() ProductoHoy[]
        +mios() MiPublicacion[]
        +obtener(id) ProductoHoy
        +crear(CrearProductoInput) Producto
        +actualizar(id, ActualizarProductoInput) Producto
        +eliminar(id) void
        +subirFoto(id, foto) Producto
        +quitarProducto(c, producto, siTienePedidos) void
        +conVendedor(c) Consulta
        -productoPropio(c, id) Producto
        -exigirHoraFutura(horaLimite) void
    }
    class FotosRoutes {
        +obtener(id, archivo) Response
    }
    class PedidosRoutes {
        +crear(CrearPedidoInput) Pedido*
        +compras() PedidoCompra[]*
        +cancelar(id) Pedido*
        +ventas() PedidoVenta[]
        +aceptar(id) Pedido
        +rechazar(id) Pedido
        +entregar(id) Pedido
        -cargarPedidos(c, filtro) PedidoCargado[]
        -cambiarEstado(c, pedido, hacia, vendedor) Pedido
        -accionVendedor(c, id, accion) Pedido
        -nombreDe(c, id) string
    }
    class CalificacionesRoutes {
        +crear(CrearCalificacionInput) Calificacion*
        +deVendedor(id) Resena[]
    }
    class NotificacionesRoutes {
        +listar() Notificacion[]
        +marcarLeidas() void
        +marcarLeida(id) Notificacion
    }
    class ReportesRoutes {
        +crear(CrearReporteInput) void
        +listar(estado) Reporte[]
        +actualizar(id, ActualizarReporteInput) void
    }
    class PuntosEntregaRoutes {
        +listar(activo) PuntoEntrega[]
        +obtener(id) PuntoEntrega
        +crear(CrearPuntoEntregaInput) PuntoEntrega
        +actualizar(id, ActualizarPuntoEntregaInput) PuntoEntrega
        +eliminar(id) void
    }
    class AdminRoutes {
        +productos(fecha) AdminProducto[]
        +cambiarEstado(id, CambiarEstadoProductoInput) Producto
        +eliminar(id) void
        -buscarProducto(c, id) Producto
    }

    App *-- AuthRoutes
    App *-- UsuariosRoutes
    App *-- ProductosRoutes
    App *-- FotosRoutes
    App *-- PedidosRoutes
    App *-- CalificacionesRoutes
    App *-- NotificacionesRoutes
    App *-- ReportesRoutes
    App *-- PuntosEntregaRoutes
    App *-- AdminRoutes
    AdminRoutes ..> ProductosRoutes : quitarProducto, conVendedor
```

### 2.4 Backend: lógica y utilidades

```mermaid
classDiagram
    direction LR

    class PedidosLogica {
        <<funciones puras>>
        +TRANSICIONES_VENDEDOR
        +problemaTransicion(estado, accion) string
        +problemaCancelar(estado) string
        +pendienteVencido(pedido, ahora) boolean
        +problemaPedido(compradorId, productos, items, ahora) ProblemaPedido
        +agruparItems(items) ItemPedido[]
        +resumenItems(items) string
        +avisoComprador(hacia, datos) string
        +avisoVendedor(hacia, datos) string
        +avisoVendedorCancelado(hacia, datos) string
    }
    class ProductosLogica {
        <<funciones puras>>
        +ESTADOS_VENTA
        +TIPOS_FOTO
        +MAX_FOTO_BYTES
        +horaLimiteValida(horaLimite, horaActual) boolean
        +estadoSegunCantidad(cantidad) EstadoProducto
        +problemaFoto(tipo, bytes) string
        +esFotoR2(key) boolean
    }
    class AuthMiddleware {
        <<middleware>>
        +requireAuth(c, next)
        +requireAdmin(c, next)
    }
    class Validator {
        <<middleware>>
        +validar(target, schema)
    }
    class Password {
        +hashPassword(password) string
        +verificarPassword(password, guardado) boolean
    }
    class DbLib {
        +getDb(c) Db
        +nuevoId() string
        +ahoraIso() string
    }
    class AppError {
        +status: int
        +code: string
        +message: string
        +details: unknown
    }
    class Errors {
        +notFound(recurso) AppError
        +notImplemented(c) Response
        +onError(err, c) Response
        +onNotFound(c) Response
    }
    class Bindings {
        <<entorno del Worker>>
        +DB: D1Database
        +FOTOS: R2Bucket
        +JWT_SECRET: string
    }

    PedidosRoutes ..> PedidosLogica
    PedidosRoutes ..> Validator
    PedidosRoutes ..> AuthMiddleware
    ProductosRoutes ..> ProductosLogica
    AuthRoutes ..> Password
    PedidosRoutes ..> DbLib
    Errors ..> AppError : crea y formatea
    AuthMiddleware ..> Bindings : JWT_SECRET
    DbLib ..> Bindings : DB
    ProductosRoutes ..> Bindings : FOTOS
```

Para no saturar el diagrama solo se dibujan las dependencias propias de cada router. Los demás también usan `DbLib`, `Validator` y `AuthMiddleware` según lo que necesitan.

### 2.5 Paquete compartido

`packages/shared` define el contrato entre web y API: ambos importan los mismos esquemas y tipos.

```mermaid
classDiagram
    direction LR

    class Fecha {
        +ZONA_HORARIA
        +ahoraCampus(fecha) FechaHora
        +segundosHastaHora(hora, ahora) int
    }
    class Auth {
        +registroSchema
        +loginSchema
        +vincularInstitucionalSchema
        +DOMINIO_INSTITUCIONAL
        +normalizarCorreo(correo) string
        +esCorreoInstitucional(correo) boolean
    }
    class Usuarios {
        +actualizarPerfilSchema
        +resumirCalificaciones(estrellas) ResumenCalificaciones
    }
    class Productos {
        +crearProductoSchema
        +actualizarProductoSchema
    }
    class Pedidos {
        +crearPedidoSchema
    }
    class Calificaciones {
        +crearCalificacionSchema
    }
    class Reportes {
        +crearReporteSchema
        +actualizarReporteSchema
        +listarReportesQuerySchema
    }
    class PuntosEntrega {
        +crearPuntoEntregaSchema
        +actualizarPuntoEntregaSchema
    }
    class Admin {
        +adminProductosQuerySchema
        +cambiarEstadoProductoSchema
    }
    class Comun {
        +idSchema
        +idParamSchema
        +centavosSchema
        +fechaSchema
        +horaSchema
    }
    class Enums {
        +ROLES
        +CATEGORIAS_PRODUCTO
        +ESTADOS_PRODUCTO
        +ESTADOS_PEDIDO
        +ESTADOS_REPORTE
        +TIPOS_OBJETIVO_REPORTE
    }

    Productos ..> Comun
    Productos ..> Enums
    Pedidos ..> Comun
    Calificaciones ..> Comun
    Reportes ..> Comun
    Reportes ..> Enums
    Admin ..> Comun
```

### 2.6 Frontend: cliente de la API y utilidades

Todas las pantallas hablan con el backend por `apps/web/src/lib/api.ts`. Los métodos **en cursiva** faltan por agregar al cliente. De `Formato` solo se muestran las funciones principales.

```mermaid
classDiagram
    direction LR

    class Api {
        <<cliente HTTP>>
        +health() Estado
        -request(path, init) T
    }
    class ApiAuth {
        +login(LoginInput) LoginResponse
        +registro(RegistroInput) LoginResponse
        +institucional(VincularInstitucionalInput) void*
    }
    class ApiUsuarios {
        +yo() UsuarioPrivado
        +perfil(id) PerfilUsuario
        +actualizar(ActualizarPerfilInput) UsuarioPrivado*
        +eliminar() void*
    }
    class ApiProductos {
        +hoy() ProductoHoy[]
        +obtener(id) ProductoHoy
        +mios() MiPublicacion[]
        +crear(CrearProductoInput) Producto
        +actualizar(id, ActualizarProductoInput) Producto
        +eliminar(id) void
        +subirFoto(id, foto) Producto
    }
    class ApiPedidos {
        +crear(CrearPedidoInput) Pedido
        +ventas() PedidoVenta[]
        +aceptar(id) Pedido
        +rechazar(id) Pedido
        +entregar(id) Pedido
        +compras() PedidoCompra[]*
        +cancelar(id) Pedido*
    }
    class ApiCalificaciones {
        +deVendedor(id) Resena[]
        +crear(CrearCalificacionInput) Calificacion*
    }
    class ApiNotificaciones {
        +listar() Notificacion[]*
        +marcarLeidas() void*
        +marcarLeida(id) Notificacion*
    }
    class ApiReportes {
        +crear(CrearReporteInput) void
        +listar(estado) Reporte[]
        +actualizar(id, ActualizarReporteInput) void
    }
    class ApiPuntosEntrega {
        +listar() PuntoEntrega[]
        +crear(CrearPuntoEntregaInput) PuntoEntrega
        +actualizar(id, ActualizarPuntoEntregaInput) PuntoEntrega
        +eliminar(id) void
    }
    class ApiAdmin {
        +productos(fecha) AdminProducto[]
        +cambiarEstado(id, CambiarEstadoProductoInput) Producto
        +eliminar(id) void
    }
    class Sesion {
        +getSesion() LoginResponse
        +getToken() string
        +guardarSesion(sesion) void
        +tokenVigente(token, ahoraMs) boolean
        +rutaLogin(volver) string
        +destinoSeguro(volver) string
    }
    class Hooks {
        +useProductosHoy() EstadoCatalogo
        +useProducto(id) EstadoProducto
        +useAhora(intervaloMs) Date
        +useVistaPrevia(archivo) string
        +invalidarProductosHoy() void
        +abiertoHoy(producto, ahora) boolean
    }
    class Fotos {
        +urlFoto(fotoKey) string
        +prepararFoto(archivo) Blob
    }
    class Formato {
        +formatoPrecio(centavos) string
        +formatoCuenta(segundos) string
        +formatoFaltan(segundos) string
        +iniciales(nombre) string
        +haceCuanto(iso, ahora) string
    }
    class TemaLib {
        +temaActual() Tema
        +cambiarTema(tema) void
    }

    Api *-- ApiAuth
    Api *-- ApiUsuarios
    Api *-- ApiProductos
    Api *-- ApiPedidos
    Api *-- ApiCalificaciones
    Api *-- ApiNotificaciones
    Api *-- ApiReportes
    Api *-- ApiPuntosEntrega
    Api *-- ApiAdmin
    Api ..> Sesion : token y cierre en 401
    Hooks ..> ApiProductos
```

### 2.7 Frontend: páginas y componentes

```mermaid
flowchart TB
    router["router.tsx"]
    sesion["RequiereSesion"]
    sinSesion["SoloSinSesion"]
    router --> sesion
    router --> acceso["LayoutAcceso"]
    acceso --> sinSesion

    sesion --> conNav["LayoutConNav"]
    sesion --> movil["LayoutMovil"]
    sesion --> admin["LayoutAdmin"]

    conNav --> p1["Catálogo, Vender, Ventas, Pedidos"]
    movil --> p2["Detalle, Confirmar, Detalle de pedido, Calificar, Perfil, Notificaciones"]
    admin --> p3["Productos, Puntos de entrega, Reportes"]
    sinSesion --> p4["Login, Registro"]
```

| Ruta                      | Página                      | Datos                                             |
| ------------------------- | --------------------------- | ------------------------------------------------- |
| `/`                       | `CatalogoPage`              | API (el contador de notificaciones es de ejemplo) |
| `/vender`                 | `VenderPage`                | API                                               |
| `/ventas`                 | `VentasPage`                | API                                               |
| `/pedidos`                | `PedidosPage`               | De ejemplo                                        |
| `/producto/:id`           | `DetallePage`               | API                                               |
| `/producto/:id/confirmar` | `ConfirmarPage`             | API (crear el pedido aún responde `501`)          |
| `/pedidos/:id`            | `PedidoDetallePage`         | De ejemplo                                        |
| `/calificar/:pedidoId`    | `CalificarPage`             | De ejemplo                                        |
| `/perfil/:id`             | `PerfilPage`                | API                                               |
| `/notificaciones`         | `NotificacionesPage`        | De ejemplo                                        |
| `/admin`                  | `AdminProductosPage`        | API                                               |
| `/admin/puntos`           | `AdminPuntosPage`           | API                                               |
| `/admin/reportes`         | `AdminReportesPage`         | API                                               |
| `/login`, `/registro`     | `LoginPage`, `RegistroPage` | API                                               |

Componentes de UI reutilizables (`apps/web/src/components`):

| Grupo      | Componentes                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Layout     | `LayoutConNav`, `LayoutMovil`, `LayoutAcceso`, `LayoutAdmin`, `NavInferior`, `NavSuperior`, `MenuCuenta`, `BarraAccion` |
| Acceso     | `RequiereSesion`, `SoloSinSesion`                                                                                       |
| Producto   | `Tarjeta`, `FotoProducto`, `ChipHasta`, `ChipFaltan`, `BarraExistencias`, `SelectorCantidad`                            |
| Estado     | `PastillaEstado`, `PastillaReporte`, `PastillaCantidad`, `TarjetaSkeleton`, `ProntoSkeleton`                            |
| Persona    | `Avatar`, `Insignia`, `InsigniaMini`, `SinVerificar`, `Estrellas`                                                       |
| Formulario | `Boton`, `BotonRedondo`, `Chip`, `Etiqueta`                                                                             |
| Marca      | `LogoShopsito`                                                                                                          |

### 2.8 Endpoints de la API

Estado: ✅ implementado · ⏳ responde `501`. Acceso: **público**, **sesión** (JWT) o **admin**.

| Método   | Ruta                                | Acceso  | Estado | Qué hace                                           |
| -------- | ----------------------------------- | ------- | :----: | -------------------------------------------------- |
| `GET`    | `/api/health`                       | público |   ✅   | Comprueba que la API responde                      |
| `POST`   | `/api/auth/registro`                | público |   ✅   | Crea la cuenta y abre la sesión                    |
| `POST`   | `/api/auth/login`                   | público |   ✅   | Devuelve el token (7 días)                         |
| `POST`   | `/api/auth/logout`                  | sesión  |   ✅   | Responde 204; el cliente descarta el token         |
| `POST`   | `/api/auth/institucional`           | sesión  |   ✅   | Liga el correo de la uni y da la insignia          |
| `GET`    | `/api/usuarios/me`                  | sesión  |   ✅   | Datos privados de la cuenta                        |
| `PATCH`  | `/api/usuarios/me`                  | sesión  |   ⏳   | Edita nombre y teléfono                            |
| `DELETE` | `/api/usuarios/me`                  | sesión  |   ⏳   | Baja lógica de la cuenta                           |
| `GET`    | `/api/usuarios/:id`                 | sesión  |   ✅   | Perfil público con ventas y calificaciones         |
| `GET`    | `/api/productos/hoy`                | sesión  |   ✅   | Catálogo del día                                   |
| `GET`    | `/api/productos/mios`               | sesión  |   ✅   | Lo publicado hoy, con vendidos e ingresos          |
| `GET`    | `/api/productos/:id`                | sesión  |   ✅   | Detalle de un producto                             |
| `POST`   | `/api/productos`                    | sesión  |   ✅   | Publica para hoy                                   |
| `PATCH`  | `/api/productos/:id`                | dueño   |   ✅   | Edita la publicación                               |
| `DELETE` | `/api/productos/:id`                | dueño   |   ✅   | Quita la publicación (agotada si ya tiene pedidos) |
| `POST`   | `/api/productos/:id/foto`           | dueño   |   ✅   | Sube la foto a R2 (máximo 5 MB)                    |
| `GET`    | `/api/fotos/productos/:id/:archivo` | público |   ✅   | Sirve la foto desde R2                             |
| `POST`   | `/api/pedidos`                      | sesión  |   ⏳   | Crea el pedido y aparta inventario                 |
| `GET`    | `/api/pedidos/compras`              | sesión  |   ⏳   | Pedidos que hizo el usuario                        |
| `GET`    | `/api/pedidos/ventas`               | sesión  |   ✅   | Pedidos que le hicieron hoy                        |
| `POST`   | `/api/pedidos/:id/aceptar`          | dueño   |   ✅   | Acepta un pedido pendiente                         |
| `POST`   | `/api/pedidos/:id/rechazar`         | dueño   |   ✅   | Rechaza y devuelve el inventario                   |
| `POST`   | `/api/pedidos/:id/entregar`         | dueño   |   ✅   | Marca como entregado                               |
| `POST`   | `/api/pedidos/:id/cancelar`         | sesión  |   ⏳   | El comprador cancela un pendiente                  |
| `POST`   | `/api/calificaciones`               | sesión  |   ⏳   | Califica un pedido entregado                       |
| `GET`    | `/api/calificaciones/vendedor/:id`  | sesión  |   ✅   | Reseñas de un vendedor                             |
| `GET`    | `/api/notificaciones`               | sesión  |   ✅   | Últimas 100 notificaciones                         |
| `PATCH`  | `/api/notificaciones/leidas`        | sesión  |   ✅   | Marca todas como leídas                            |
| `PATCH`  | `/api/notificaciones/:id/leida`     | sesión  |   ✅   | Marca una como leída                               |
| `POST`   | `/api/reportes`                     | sesión  |   ✅   | Reporta a un usuario o una publicación             |
| `GET`    | `/api/reportes`                     | admin   |   ✅   | Lista reportes (filtro por estado)                 |
| `PATCH`  | `/api/reportes/:id`                 | admin   |   ✅   | Resuelve o descarta, con nota                      |
| `GET`    | `/api/puntos-entrega`               | sesión  |   ✅   | Lista puntos (filtro por activo)                   |
| `GET`    | `/api/puntos-entrega/:id`           | sesión  |   ✅   | Un punto de entrega                                |
| `POST`   | `/api/puntos-entrega`               | admin   |   ✅   | Crea un punto                                      |
| `PATCH`  | `/api/puntos-entrega/:id`           | admin   |   ✅   | Edita o desactiva un punto                         |
| `DELETE` | `/api/puntos-entrega/:id`           | admin   |   ✅   | Borra un punto sin pedidos                         |
| `GET`    | `/api/admin/productos`              | admin   |   ✅   | Todo lo publicado en un día                        |
| `PATCH`  | `/api/admin/productos/:id`          | admin   |   ✅   | Oculta o vuelve a mostrar                          |
| `DELETE` | `/api/admin/productos/:id`          | admin   |   ✅   | Borra la publicación (oculta si ya tiene pedidos)  |

**Dueño** significa con sesión y además ser quien vende ese producto o pedido. Los errores siempre tienen la forma `{ "error": { "code": "…", "message": "…" } }`.

---

## 3. Stack tecnológico

| Capa             | Tecnología                                                | Para qué                                        |
| ---------------- | --------------------------------------------------------- | ----------------------------------------------- |
| Lenguaje         | TypeScript ~6.0                                           | Todo el proyecto                                |
| Monorepo         | pnpm 10.34 workspaces, Node.js 24                         | `apps/web`, `apps/api`, `packages/shared`       |
| Frontend         | React 19, React Router 8, Vite 8                          | SPA responsive                                  |
| Estilos          | Tailwind CSS 4, lucide-react                              | Tokens del tema, modo oscuro e iconos           |
| Backend          | Hono 4 sobre Cloudflare Workers                           | API REST                                        |
| Validación       | Zod 4, `@hono/zod-validator`                              | Contrato compartido entre web y API             |
| Base de datos    | Cloudflare D1 (SQLite), Drizzle ORM 0.45, drizzle-kit     | Datos y migraciones                             |
| Archivos         | Cloudflare R2                                             | Fotos de productos                              |
| Autenticación    | JWT HS256 (7 días), PBKDF2-SHA256 con WebCrypto           | Sesión sin estado y contraseñas                 |
| Hosting web      | Cloudflare Pages y Pages Functions                        | Archivos estáticos y proxy de `/api`            |
| Infraestructura  | Terraform ≥ 1.6 (providers Cloudflare 5.29 y Random 3)    | Recursos de dev y prod                          |
| CI/CD            | GitHub Actions, Wrangler 4                                | Checks, despliegue y migraciones                |
| Pruebas          | Vitest 5                                                  | Pruebas unitarias                               |
| Calidad          | ESLint 10, typescript-eslint 8, Prettier 3                | Lint y formato                                  |
| Desarrollo local | Docker Compose, Dev Containers, Wrangler (simula D1 y R2) | Ambiente igual para el equipo, sin usar la nube |

---

## 4. Recursos que se van a crear

Todo vive en una cuenta de Cloudflare y lo crea Terraform (`infra/terraform/modules/shopsito`). Hay dos ambientes idénticos y separados: **dev** y **prod**.

### 4.1 Inventario

| Recurso                  | Recurso de Terraform                  | dev                  | prod                     |
| ------------------------ | ------------------------------------- | -------------------- | ------------------------ |
| Base de datos D1         | `cloudflare_d1_database`              | `shopsito-db-dev`    | `shopsito-db-prod`       |
| Bucket R2 de fotos       | `cloudflare_r2_bucket`                | `shopsito-fotos-dev` | `shopsito-fotos-prod`    |
| Worker de la API         | `cloudflare_workers_script`           | `shopsito-api-dev`   | `shopsito-api-prod`      |
| Subdominio `workers.dev` | `cloudflare_workers_script_subdomain` | activado             | desactivado              |
| Proyecto de Pages        | `cloudflare_pages_project`            | `shopsito-web-dev`   | `shopsito-web-prod`      |
| Secreto `JWT_SECRET`     | `random_password`                     | aleatorio (64)       | aleatorio (64), distinto |

Fuera del módulo:

| Recurso                                                  | Cómo se crea          | Para qué                               |
| -------------------------------------------------------- | --------------------- | -------------------------------------- |
| Bucket R2 privado `shopsito-tfstate`                     | Una vez, con Wrangler | Estado de Terraform de ambos ambientes |
| Environments `dev` y `prod` en GitHub                    | A mano, en Settings   | Aprobación manual antes de prod        |
| Secrets `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` | A mano, en Settings   | Credenciales del despliegue            |

D1 y R2 se crean con ubicación sugerida `wnam` (oeste de Norteamérica).

### 4.2 Diagrama de infraestructura

Un ambiente (`amb` es `dev` o `prod`):

```mermaid
flowchart LR
    usuario(["Navegador"])

    subgraph cf["Cuenta de Cloudflare"]
        subgraph amb["Ambiente amb = dev o prod"]
            subgraph pages["Pages: shopsito-web-amb"]
                estaticos["Archivos estáticos (SPA)"]
                funcion["Pages Function /api/*"]
            end
            worker["Worker:<br/>shopsito-api-amb"]
            secreto["Secreto JWT_SECRET"]
            d1[("D1:<br/>shopsito-db-amb")]
            r2[("R2:<br/>shopsito-fotos-amb")]
        end
        estado[("R2:<br/>shopsito-tfstate")]
    end

    terraform["Terraform"]

    usuario -->|"HTTPS /*"| estaticos
    usuario -->|"HTTPS /api/*"| funcion
    usuario -.->|"workers.dev, solo dev"| worker
    funcion -->|"service binding API"| worker
    worker -->|"binding DB"| d1
    worker -->|"binding FOTOS"| r2
    secreto -->|"binding secret_text"| worker
    terraform -->|"crea y actualiza"| amb
    terraform -->|"guarda el estado"| estado
```

La web llama a `/api` en su mismo origen, así que no hace falta CORS.

### 4.3 Dependencias entre recursos

Orden en que Terraform crea los recursos: primero aquello de lo que dependen los demás.

```mermaid
flowchart LR
    d1["cloudflare_d1_database.db"] --> w["cloudflare_workers_script.api"]
    r2["cloudflare_r2_bucket.fotos"] --> w
    jwt["random_password.jwt_secret"] --> w
    bundle["apps/api/dist/index.js"] --> w
    w --> sub["cloudflare_workers_script_subdomain.api"]
    w --> pages["cloudflare_pages_project.web"]
```

---

## 5. Diagrama de deployment

### 5.1 Nodos y artefactos

En la nube (igual para dev y prod):

```mermaid
flowchart LR
    subgraph cliente["«device» Celular o computadora: navegador"]
        spa["«artifact»<br/>SPA React"]
        ls["«artifact»<br/>localStorage:<br/>sesión y tema"]
    end

    subgraph cloud["«node» Red de Cloudflare"]
        subgraph nPages["«execution environment» Pages"]
            dist["«artifact»<br/>apps/web/dist"]
            fn["«artifact»<br/>Pages Function /api/*"]
        end
        subgraph nWorker["«execution environment» Workers"]
            bundle["«artifact»<br/>apps/api/dist/index.js"]
        end
        subgraph nD1["«database» D1"]
            mig["«artifact»<br/>migrations/*.sql"]
        end
        subgraph nR2["«storage» R2"]
            fotos["«artifact»<br/>productos/id/uuid"]
        end
    end

    spa --- ls
    spa -->|"HTTPS: descarga la SPA"| dist
    spa -->|"HTTPS: JSON y JWT en /api"| fn
    fn -->|"service binding"| bundle
    bundle -->|"SQL con Drizzle"| mig
    bundle -->|"leer y guardar fotos"| fotos
```

En la computadora de cada quien, sin usar la nube:

```mermaid
flowchart LR
    subgraph host["«device» Computadora de desarrollo"]
        navl["Navegador"]
        subgraph docker["«container» docker compose: dev (node:24-bookworm-slim)"]
            vite["Vite :5173"]
            wrangler["Wrangler :8787"]
            sim[("D1 y R2 simulados en apps/api/.wrangler")]
            vol["volumen node_modules"]
        end
    end

    navl -->|"localhost:5173"| vite
    vite -->|"proxy /api"| wrangler
    wrangler --> sim
```

### 5.2 Flujo de despliegue (CI/CD)

`.github/workflows/desplegar.yml` corre los checks en cada PR. En cada push a `main` corre los checks, despliega a dev y, con aprobación, a prod.

```mermaid
flowchart LR
    pr["Pull request"] --> checks
    push["Push a main"] --> checks

    subgraph gha["GitHub Actions"]
        checks["checks: lint, typecheck, test, build"]
        dev["deploy-dev"]
        aprob{"¿Aprobado por un revisor?"}
        prod["deploy-prod"]
        checks -->|"solo en push"| dev
        dev --> aprob
        aprob -->|"sí"| prod
    end

    dev --> urlDev["shopsito-web-dev.pages.dev"]
    prod --> urlProd["shopsito-web-prod.pages.dev"]
    aprob -->|"no"| fin["No se despliega a prod"]
```

### 5.3 Pasos de un despliegue

Cada despliegue corre `infra/desplegar.sh <amb>`:

```mermaid
sequenceDiagram
    autonumber
    participant S as desplegar.sh
    participant P as pnpm
    participant T as Terraform
    participant W as Wrangler
    participant C as Cloudflare
    S->>P: pnpm build
    P-->>S: apps/api/dist y apps/web/dist
    S->>T: init y apply
    T->>C: Lee y guarda el estado en R2
    T->>C: Crea o actualiza D1, R2, Worker y Pages
    T-->>S: d1_id, pages_proyecto, url_web
    S->>W: d1 migrations apply --remote
    W->>C: Aplica migraciones a D1
    S->>W: pages deploy dist
    W->>C: Sube la SPA y la Pages Function
    S-->>S: Imprime la URL del ambiente
```

Los detalles para configurarlo y operarlo están en [`infra/README.md`](../infra/README.md).
