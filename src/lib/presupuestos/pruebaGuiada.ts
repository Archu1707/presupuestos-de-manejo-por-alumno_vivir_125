// Prueba guiada del descuento. Trabaja SIEMPRE sobre una copia aislada en
// memoria de los datos: nunca escribe en el localStorage real.
// La usan la pantalla "Prueba guiada" y la prueba automatizada (vitest).

import { formatoPesos } from "./calc";
import { recargoPorClase, type ExtraId, type Localidad } from "./catalog";
import {
  APP_KEY,
  Repositorio,
  crearAlmacenEnMemoria,
  type Almacen,
  type AppData,
  type PresupuestoInput,
} from "./store";

export interface PasoPrueba {
  titulo: string;
  detalle: string;
  ok: boolean;
}

const LOCALIDAD_PRUEBA: Localidad = "Neptunia";
const EXTRAS_PRUEBA: ExtraId[] = ["gestion", "simuladorTeorico"];

export function ejecutarPruebaGuiada(datosReales: AppData, hoy: string): PasoPrueba[] {
  const pasos: PasoPrueba[] = [];
  const fotoAntes = JSON.stringify(datosReales);

  // 1) Copia aislada
  const copia = crearAlmacenEnMemoria({ [APP_KEY]: JSON.stringify(datosReales) });
  const repo = new Repositorio(copia, hoy);
  const cliente = repo.crearCliente(
    {
      nombre: "Cliente de Prueba",
      correo: `prueba.${Date.now()}@example.com`,
      localidad: LOCALIDAD_PRUEBA,
      edad: 25,
      comoNosConocio: "Otro",
    },
    hoy,
  );
  pasos.push({
    titulo: "Copia aislada de datos",
    detalle: `Se copiaron ${datosReales.clientes.length} clientes y ${datosReales.presupuestos.length} presupuestos a memoria y se creó un cliente de prueba.`,
    ok: cliente.ok,
  });
  if (!cliente.ok) return pasos;

  const recargo = recargoPorClase(LOCALIDAD_PRUEBA);
  const base = (clases: number): PresupuestoInput => ({
    clienteId: cliente.valor.id,
    categoria: "A",
    lineas: [{ tipo: "practica60", cantidad: clases }],
    extras: EXTRAS_PRUEBA,
    localidad: LOCALIDAD_PRUEBA,
  });

  // 2) 9 clases + 2 extras: NO aplica descuento
  const r9 = repo.guardarPresupuesto(base(9), hoy);
  if (r9.ok) {
    const p = r9.valor;
    const ok =
      p.descuento === 0 &&
      p.baseClases === 9 * 900 &&
      p.totalExtras === 2100 &&
      p.recargoTraslado === 9 * recargo &&
      p.total === p.baseClases + p.totalExtras + p.recargoTraslado;
    pasos.push({
      titulo: "9 clases + 2 extras → sin descuento",
      detalle: `Base ${formatoPesos(p.baseClases)}, descuento ${formatoPesos(p.descuento)}, extras ${formatoPesos(p.totalExtras)}, traslado ${formatoPesos(p.recargoTraslado)}, total ${formatoPesos(p.total)}. Los 2 extras no cuentan para llegar a 10.`,
      ok,
    });
  } else {
    pasos.push({ titulo: "9 clases + 2 extras → sin descuento", detalle: r9.error, ok: false });
  }

  // 3) 10 clases: SÍ aplica 10% solo sobre la base de clases
  const r10 = repo.guardarPresupuesto(base(10), hoy);
  if (r10.ok) {
    const p = r10.valor;
    const ok =
      p.baseClases === 10 * 900 &&
      p.descuento === Math.round(p.baseClases * 0.1) &&
      p.totalExtras === 2100 &&
      p.recargoTraslado === 10 * recargo &&
      p.total === p.baseClases - p.descuento + p.totalExtras + p.recargoTraslado;
    pasos.push({
      titulo: "10 clases → 10% solo sobre clases",
      detalle: `Base ${formatoPesos(p.baseClases)}, descuento ${formatoPesos(p.descuento)}, extras completos ${formatoPesos(p.totalExtras)}, traslado completo ${formatoPesos(p.recargoTraslado)}, total ${formatoPesos(p.total)}.`,
      ok,
    });
  } else {
    pasos.push({ titulo: "10 clases → 10% solo sobre clases", detalle: r10.error, ok: false });
  }

  // 4) Fallo de guardado: no cambia correlativo ni agrega presupuesto
  const fallo: Almacen = {
    getItem: (k) => copia.getItem(k),
    setItem: () => {
      throw new Error("QuotaExceededError simulado");
    },
  };
  const repoFallo = new Repositorio(fallo, hoy);
  const antes = repoFallo.data;
  const rf = repoFallo.guardarPresupuesto(base(10), hoy);
  const okFallo =
    !rf.ok &&
    repoFallo.data.correlativo === antes.correlativo &&
    repoFallo.data.presupuestos.length === antes.presupuestos.length;
  pasos.push({
    titulo: "Fallo de guardado simulado",
    detalle: okFallo
      ? `No se mostró éxito y el correlativo siguió en ${antes.correlativo}.`
      : "El guardado fallido modificó datos o correlativos.",
    ok: okFallo,
  });

  // 5) Datos reales intactos
  const intactos = JSON.stringify(datosReales) === fotoAntes;
  pasos.push({
    titulo: "Datos reales sin modificar",
    detalle: intactos
      ? "La prueba no tocó tus clientes ni presupuestos."
      : "Los datos reales cambiaron.",
    ok: intactos,
  });

  return pasos;
}
