// Catálogo de precios vigente (en pesos uruguayos, $U).
// Los presupuestos guardan una copia "congelada" de estos precios al crearse,
// así que cambiar este archivo no altera presupuestos ya guardados.

export const CATEGORIAS = ["A", "G1", "G2", "G3", "Automático"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const TIPOS_CLASE = ["practica60", "practica120", "teorica", "simulador"] as const;
export type TipoClase = (typeof TIPOS_CLASE)[number];

export const TIPO_CLASE_LABEL: Record<TipoClase, string> = {
  practica60: "Práctica 60 min",
  practica120: "Práctica 120 min",
  teorica: "Teórica",
  simulador: "Simulador",
};

/** Clases prácticas: son las que generan recargo por traslado. */
export const TIPOS_CON_TRASLADO: readonly TipoClase[] = ["practica60", "practica120"];

/** Precio de la clase práctica de 60 min según categoría. */
export const PRECIO_60: Record<Categoria, number> = {
  A: 900,
  Automático: 900,
  G1: 700,
  G2: 700,
  G3: 700,
};

/** 120 min = doble de 60 min con 5% de descuento. */
export const FACTOR_120 = 2 * 0.95;

/**
 * SUPUESTO A CONFIRMAR CON LA ACADEMIA: el brief no fija precio para la clase
 * teórica ni para la clase de simulador. Se usan estos valores provisorios.
 */
export const PRECIO_TEORICA = 500;
export const PRECIO_SIMULADOR = 600;

export const EXTRAS = [
  { id: "gestion", nombre: "Gestión del trámite", precio: 1500 },
  { id: "simuladorTeorico", nombre: "Simulador teórico", precio: 600 },
  { id: "autoExamen", nombre: "Auto de la academia para el examen", precio: 2000 },
] as const;
export type ExtraId = (typeof EXTRAS)[number]["id"];

/** Recargo por traslado, por clase práctica, según localidad. */
export const RECARGO_LOCALIDAD = {
  Costa: 0,
  Solymar: 0,
  Neptunia: 100,
  Pinamar: 100,
  Salinas: 100,
  Marindia: 150,
  "El Fortín": 150,
  Atlántida: 150,
  "Las Toscas": 200,
  "Parque del Plata": 200,
} as const;
export type Localidad = keyof typeof RECARGO_LOCALIDAD;
export const LOCALIDADES = Object.keys(RECARGO_LOCALIDAD) as Localidad[];

export const COMO_NOS_CONOCIO = ["Redes", "Recomendación", "Cartel", "Otro"] as const;
export type ComoNosConocio = (typeof COMO_NOS_CONOCIO)[number];

/** Descuento por volumen: 10% sobre la base de clases con 10 clases o más. */
export const UMBRAL_DESCUENTO = 10;
export const PORCENTAJE_DESCUENTO = 0.1;

/** Días corridos de validez de un presupuesto enviado. */
export const DIAS_VALIDEZ = 15;

export function precioClase(categoria: Categoria, tipo: TipoClase): number {
  switch (tipo) {
    case "practica60":
      return PRECIO_60[categoria];
    case "practica120":
      return Math.round(PRECIO_60[categoria] * FACTOR_120);
    case "teorica":
      return PRECIO_TEORICA;
    case "simulador":
      return PRECIO_SIMULADOR;
  }
}

export function precioExtra(id: ExtraId): number {
  const e = EXTRAS.find((x) => x.id === id);
  if (!e) throw new Error(`Extra desconocido: ${id}`);
  return e.precio;
}

export function nombreExtra(id: string): string {
  return EXTRAS.find((x) => x.id === id)?.nombre ?? id;
}

export function recargoPorClase(localidad: Localidad): number {
  return RECARGO_LOCALIDAD[localidad] ?? 0;
}
