const pesos = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

/** El dinero viaja en centavos; solo se convierte al mostrarlo. */
export const formatoPrecio = (centavos: number) => pesos.format(centavos / 100)
