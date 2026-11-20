/** Skeleton con la misma forma que la tarjeta de producto. */
export function TarjetaSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-tarjeta bg-tarjeta px-1.5 pt-1.5 pb-3 shadow-tarjeta">
      <div className="aspect-[4/5] skeleton rounded-[15px]" />
      <div className="mx-1.5 flex justify-between">
        <div className="h-[18px] w-12 rounded-full bg-gris-50" />
        <div className="h-[18px] w-[58px] rounded-full bg-gris-50" />
      </div>
      <div className="mx-1.5 h-3 w-[85%] rounded-full bg-gris-50" />
      <div className="mx-1.5 flex items-center gap-1.5">
        <div className="size-[22px] rounded-full bg-gris-50" />
        <div className="h-2.5 w-[60px] rounded-full bg-gris-50" />
      </div>
    </div>
  )
}

export function ProntoSkeleton() {
  return (
    <div className="flex w-[156px] flex-none flex-col gap-2.5 rounded-tarjeta bg-tarjeta px-1.5 pt-1.5 pb-3 shadow-tarjeta">
      <div className="h-36 skeleton rounded-[15px]" />
      <div className="mx-1.5 h-4 w-[50px] rounded-full bg-gris-50" />
      <div className="mx-1.5 h-3 w-[110px] rounded-full bg-gris-50" />
    </div>
  )
}
