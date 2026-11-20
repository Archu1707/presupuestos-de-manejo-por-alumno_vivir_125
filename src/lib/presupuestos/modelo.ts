import {
  EXTRAS,
  TIPOS_CLASE,
  nombreExtra,
  precioClase,
  precioExtra,
  recargoPorClase,
  type Categoria,
  type ComoNosConocio,
  type ExtraId,
  type Localidad,
  type TipoClase,
} from "./catalog";
import { calcularTotales, type LineaClase, type LineaExtra } from "./calc";

export const ESTADOS = ["Borrador", "Enviado", "Aceptado", "Rechazado", "Vencido"] as const;
export type Estado = (typeof ESTADOS)[number];
export const ESTADOS_FINALES: readonly Estado[] = ["Aceptado", "Rechazado", "Vencido"];
export const ESTADOS_ABIERTOS: readonly Estado[] = ["Borrador", "Enviado"];

export interface Cliente {
  id: string;
  nombre: string;
  correo: string;
  localidad: Localidad;
  edad: number;
  comoNosConocio: ComoNosConocio;
  fechaAlta: string;
}

export interface Presupuesto {
  id: string;
  /** Correlativo visible (P-0001). Solo avanza cuando un guardado se confirma. */
  numero: number;
  clienteId: string;
  /** Copia del nombre para conservar el historial legible. */
  clienteNombre: string;
  categoria: Categoria;
  clases: LineaClase[];
  extras: LineaExtra[];
  localidad: Localidad;
  /** Precio por clase práctica congelado al guardar. */
  recargoPorClase: number;
  recargoTraslado: number;
  baseClases: number;
  descuento: number;
  totalExtras: number;
  total: number;
  fechaCreacion: string;
  fechaEnvio: string | null;
  vencimiento: string | null;
  estado: Estado;
  /** Si es un duplicado, id del presupuesto original. */
  origenId?: string;
}

export interface AppData {
  version: 1;
  correlativo: number;
  clientes: Cliente[];
  presupuestos: Presupuesto[];
}

/** Subconjunto de la Web Storage API (localStorage o una copia en memoria). */
export interface Almacen {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type Resultado<T = void> = { ok: true; valor: T } | { ok: false; error: string };

export interface ClienteInput {
  nombre: string;
  correo: string;
  localidad: string;
  edad: number | string;
  comoNosConocio: string;
}

export interface PresupuestoInput {
  clienteId: string;
  categoria: Categoria;
  lineas: { tipo: TipoClase; cantidad: number }[];
  extras: ExtraId[];
  localidad: Localidad;
}

export function numeroPresupuesto(n: number): string {
  return `P-${String(n).padStart(4, "0")}`;
}

export function normalizarCorreo(correo: string): string {
  return correo.replace(/\s+/g, "").toLowerCase();
}

let contadorId = 0;
export function nuevoId(prefijo: string): string {
  contadorId += 1;
  const azar =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefijo}_${Date.now().toString(36)}${contadorId}${azar}`;
}

export function crearAlmacenEnMemoria(inicial?: Record<string, string>): Almacen {
  const mapa = new Map<string, string>(Object.entries(inicial ?? {}));
  return {
    getItem: (k) => (mapa.has(k) ? (mapa.get(k) as string) : null),
    setItem: (k, v) => {
      mapa.set(k, v);
    },
  };
}

/** Arma un presupuesto con los precios VIGENTES del catálogo (se congelan al guardar). */
export function armarPresupuesto(
  input: PresupuestoInput,
  cliente: Pick<Cliente, "id" | "nombre">,
  base: { id: string; numero: number; fechaCreacion: string },
): Presupuesto {
  const clases: LineaClase[] = input.lineas
    .filter((l) => TIPOS_CLASE.includes(l.tipo) && l.cantidad > 0)
    .map((l) => ({
      tipo: l.tipo,
      cantidad: Math.floor(l.cantidad),
      precioUnitario: precioClase(input.categoria, l.tipo),
    }));
  const extras: LineaExtra[] = input.extras
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => ({ id, nombre: nombreExtra(id), precio: precioExtra(id) }));
  const recargo = recargoPorClase(input.localidad);
  const t = calcularTotales(clases, extras, recargo);
  return {
    id: base.id,
    numero: base.numero,
    clienteId: cliente.id,
    clienteNombre: cliente.nombre,
    categoria: input.categoria,
    clases,
    extras,
    localidad: input.localidad,
    recargoPorClase: recargo,
    recargoTraslado: t.recargoTraslado,
    baseClases: t.baseClases,
    descuento: t.descuento,
    totalExtras: t.extras,
    total: t.total,
    fechaCreacion: base.fechaCreacion,
    fechaEnvio: null,
    vencimiento: null,
    estado: "Borrador",
  };
}

/** Recupera la entrada editable de un presupuesto guardado. */
export function aInput(p: Presupuesto): PresupuestoInput {
  return {
    clienteId: p.clienteId,
    categoria: p.categoria,
    lineas: p.clases.map((c) => ({ tipo: c.tipo, cantidad: c.cantidad })),
    extras: p.extras
      .map((e) => e.id)
      .filter((id): id is ExtraId => EXTRAS.some((x) => x.id === id)),
    localidad: p.localidad,
  };
}
