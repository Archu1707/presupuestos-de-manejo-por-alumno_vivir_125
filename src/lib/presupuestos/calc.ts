import {
  PORCENTAJE_DESCUENTO,
  TIPOS_CON_TRASLADO,
  UMBRAL_DESCUENTO,
  type TipoClase,
} from "./catalog";

/** Línea de clases con su precio unitario congelado. */
export interface LineaClase {
  tipo: TipoClase;
  cantidad: number;
  precioUnitario: number;
}

/** Extra con su precio congelado. */
export interface LineaExtra {
  id: string;
  nombre: string;
  precio: number;
}

export interface Totales {
  cantidadClases: number;
  clasesConTraslado: number;
  baseClases: number;
  descuento: number;
  extras: number;
  recargoTraslado: number;
  total: number;
}

function entero(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * Cálculo único del presupuesto. Lo usan el formulario (en vivo), el guardado,
 * el panel y la vista imprimible, para que las cifras sean siempre idénticas.
 *
 * Reglas:
 * - El descuento (10%) se aplica con 10 clases o más y SOLO sobre la base de clases.
 *   Los extras no cuentan para el umbral y nunca se descuentan.
 * - El traslado se cobra por clase práctica según la localidad, sin descuento.
 */
export function calcularTotales(
  clases: LineaClase[],
  extras: LineaExtra[],
  recargoPorClase: number,
): Totales {
  let cantidadClases = 0;
  let clasesConTraslado = 0;
  let baseClases = 0;
  for (const l of clases) {
    const cant = entero(l.cantidad);
    cantidadClases += cant;
    baseClases += cant * l.precioUnitario;
    if (TIPOS_CON_TRASLADO.includes(l.tipo)) clasesConTraslado += cant;
  }
  const descuento =
    cantidadClases >= UMBRAL_DESCUENTO ? Math.round(baseClases * PORCENTAJE_DESCUENTO) : 0;
  const totalExtras = extras.reduce((s, e) => s + e.precio, 0);
  const recargoTraslado = clasesConTraslado * Math.max(0, recargoPorClase);
  const total = baseClases - descuento + totalExtras + recargoTraslado;
  return {
    cantidadClases,
    clasesConTraslado,
    baseClases,
    descuento,
    extras: totalExtras,
    recargoTraslado,
    total,
  };
}

/** Formato de moneda uruguaya: $U 1.500 */
export function formatoPesos(n: number): string {
  const signo = n < 0 ? "-" : "";
  const abs = Math.round(Math.abs(n)).toString();
  const conPuntos = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${signo}$U ${conPuntos}`;
}
