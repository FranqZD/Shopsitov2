import { useState } from 'react'
import { Check, ChevronLeft, ClipboardCheck, Clock, MapPin, ShoppingBag } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Boton } from '../components/Boton'
import { BotonRedondo } from '../components/BotonRedondo'
import { InsigniaMini } from '../components/Insignia'
import { VENTAS } from '../lib/ejemplos'
import { formatoCuenta, formatoPrecio, nombreCorto } from '../lib/formato'
import { useAhora } from '../lib/useAhora'

type Entregado = { nombre: string; que: string; hora: string; total: number }

// TODO: reemplazar por GET /api/pedidos/ventas y POST /api/pedidos/:id/aceptar|rechazar|entregar.
// Mientras tanto la pantalla simula las acciones en memoria para poder probar el flujo.
export function VentasPage() {
  const ahora = useAhora()
  const [inicio] = useState(() => Date.now())
  const [nuevo, setNuevo] = useState<'pendiente' | 'aceptado' | 'rechazado'>('pendiente')
  const [dados, setDados] = useState<string[]>([])
  const n = VENTAS.nuevo
  const restante = Math.max(
    0,
    n.segundosParaResponder - Math.floor((ahora.getTime() - inicio) / 1000),
  )

  const porEntregar = [
    ...(nuevo === 'aceptado'
      ? [
          {
            id: 'nuevo',
            nombre: n.comprador,
            que: `${n.cantidad} × Molletes · sin cebolla`,
            punto: 'Biblioteca',
            hasta: '11:00',
            total: n.total,
          },
        ]
      : []),
    ...VENTAS.porEntregar,
  ]
  const pendientes = porEntregar.filter((o) => !dados.includes(o.id))
  const entregados: Entregado[] = [
    ...porEntregar
      .filter((o) => dados.includes(o.id))
      .map((o) => ({ nombre: o.nombre, que: o.que, hora: 'Ahora', total: o.total })),
    ...VENTAS.entregados,
  ]
  const ganado = entregados.reduce((a, o) => a + o.total, 0)

  return (
    <main className="flex flex-col gap-6 px-5 pt-3.5 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start md:gap-x-6">
      <div className="-ml-1 flex items-center gap-3 md:col-span-2">
        <BotonRedondo to="/vender" label="Regresar a vender">
          <ChevronLeft size={22} strokeWidth={2.2} />
        </BotonRedondo>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.015em] text-azul">
          Mis ventas
        </h1>
      </div>

      <div className="relative flex items-center overflow-hidden rounded-grande bg-banner px-6 py-5 text-white md:col-span-2 md:px-8 md:py-7">
        <span className="absolute -right-10 -bottom-16 size-[200px] rounded-full bg-white/18" />
        <div className="relative flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] text-[#D5E1F0]">Hoy llevas</span>
          <span className="num text-[44px] leading-none font-extrabold tracking-[-0.02em]">
            {formatoPrecio(ganado)}
          </span>
          <span className="text-[15px] text-[#D5E1F0]">
            {entregados.length} entregados · {pendientes.length} por entregar
          </span>
        </div>
        <span className="relative flex size-[70px] flex-none items-center justify-center rounded-full bg-mango text-sobre-mango">
          <ShoppingBag size={28} strokeWidth={2.1} aria-hidden="true" />
        </span>
      </div>

      {nuevo === 'pendiente' && (
        <section className="flex flex-col gap-3 md:col-start-1">
          <h2 className="flex items-center gap-2.5 font-display text-[21px] font-bold tracking-[-0.01em]">
            <span className="size-2.5 animate-pulso rounded-full bg-mango" />
            Pedido nuevo
          </h2>
          <div className="flex animate-anillo flex-col gap-3.5 rounded-grande bg-tarjeta p-4 outline-2 outline-mango">
            <div className="flex items-center gap-3">
              <Avatar id={n.comprador} nombre={n.comprador} size={50} />
              <span className="flex flex-1 flex-col">
                <span className="flex items-center gap-1.5 text-base font-bold">
                  {n.comprador} {n.insignia && <InsigniaMini />}
                </span>
                <span className="text-[13.5px] text-tinta-2">{n.hace}</span>
              </span>
              <span className="num text-[22px] font-bold">{formatoPrecio(n.total)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-chico bg-papel p-3">
              <img
                src={n.foto}
                alt=""
                className="size-[52px] flex-none rounded-[14px] object-cover"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">
                  {n.cantidad} × {n.producto}
                </span>
                <span className="text-[13.5px] text-tinta-2">{n.punto}</span>
              </div>
            </div>
            <p className="rounded-chico bg-azul-50 px-3.5 py-2.5 text-[15px]">“{n.nota}”</p>
            <span className="flex items-center gap-2 text-sm font-bold text-mango-tinta tabular-nums">
              <Clock size={16} strokeWidth={2.2} aria-hidden="true" />
              Tienes {formatoCuenta(restante)} para responder
            </span>
            <div className="grid grid-cols-[1fr_1.6fr] gap-2.5">
              <Boton variante="gris" tamano="md" onClick={() => setNuevo('rechazado')}>
                Rechazar
              </Boton>
              <Boton tamano="md" onClick={() => setNuevo('aceptado')}>
                <Check size={18} strokeWidth={2.6} aria-hidden="true" />
                Aceptar
              </Boton>
            </div>
          </div>
        </section>
      )}

      {nuevo === 'rechazado' && (
        <div
          role="status"
          className="rounded-chico bg-gris-50 px-4 py-3.5 text-[14.5px] leading-normal md:col-start-1"
        >
          Rechazaste el pedido de {nombreCorto(n.comprador)}. Ya le avisamos y no se le cobra nada.
        </div>
      )}

      <section className="flex flex-col gap-3 md:col-start-1">
        <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">
          Por entregar <span className="text-base text-tinta-2">{pendientes.length}</span>
        </h2>
        {pendientes.length === 0 && (
          <span className="text-sm text-tinta-2">Nada pendiente por ahora.</span>
        )}
        {pendientes.map((o) => (
          <div
            key={o.id}
            className="flex flex-col gap-3 rounded-grande bg-tarjeta p-4 shadow-tarjeta"
          >
            <div className="flex items-center gap-3">
              <Avatar id={o.nombre} nombre={o.nombre} size={50} />
              <span className="flex flex-1 flex-col">
                <span className="text-base font-bold">{o.nombre}</span>
                <span className="text-[13.5px] text-tinta-2">{o.que}</span>
              </span>
              <span className="inline-flex h-7 items-center rounded-full bg-verde-50 px-3 text-[13px] font-bold text-verde">
                Aceptado
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14.5px]">
              <MapPin size={16} strokeWidth={2} className="text-azul" aria-hidden="true" />
              {o.punto} · antes de {o.hasta}
            </div>
            <Boton variante="verde" tamano="md" onClick={() => setDados((d) => [...d, o.id])}>
              <ClipboardCheck size={18} strokeWidth={2.2} aria-hidden="true" />
              Ya se lo di · <span className="num">{formatoPrecio(o.total)}</span>
            </Boton>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2 md:col-start-2 md:row-span-3 md:row-start-3">
        <h2 className="font-display text-[21px] font-bold tracking-[-0.01em]">Entregados hoy</h2>
        {entregados.map((o, i) => (
          <div
            key={`${o.nombre}-${i}`}
            className="flex items-center gap-3 rounded-tarjeta bg-tarjeta px-4 py-3"
          >
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-verde-50 text-verde">
              <Check size={15} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-[15px] font-semibold">{o.nombre}</span>
              <span className="text-[13px] text-tinta-2">
                {o.que} · {o.hora}
              </span>
            </span>
            <span className="num text-[17px] font-bold">{formatoPrecio(o.total)}</span>
          </div>
        ))}
      </section>
    </main>
  )
}
