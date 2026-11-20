// Fechas como texto "AAAA-MM-DD" (fecha local, sin hora) para evitar
// problemas de zona horaria y cambios de horario.

const MS_DIA = 86_400_000;

export function hoyISO(ahora: Date = new Date()): string {
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, "0");
  const d = String(ahora.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function aUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function sumarDias(iso: string, dias: number): string {
  const t = new Date(aUTC(iso) + dias * MS_DIA);
  return t.toISOString().slice(0, 10);
}

/** Días corridos desde `desde` hasta `hasta` (positivo si hasta es posterior). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / MS_DIA);
}

/** Lunes y domingo de la semana (lunes a domingo) que contiene `iso`. */
export function semanaDe(iso: string): { inicio: string; fin: string } {
  const diaSemana = new Date(aUTC(iso)).getUTCDay(); // 0 = domingo
  const desdeLunes = (diaSemana + 6) % 7;
  const inicio = sumarDias(iso, -desdeLunes);
  return { inicio, fin: sumarDias(inicio, 6) };
}

export function formatoFecha(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
