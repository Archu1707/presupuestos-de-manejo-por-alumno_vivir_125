// Datos sintéticos de ejemplo. Se cargan SOLO la primera vez, cuando la clave de
// la app no existe en localStorage. Todas las personas son ficticias y los correos
// usan el dominio reservado example.com. Las fechas se calculan a partir del día
// de la primera carga para que siempre haya casos de cada estado.

import type { Categoria, ExtraId, Localidad, TipoClase, ComoNosConocio } from "./catalog";
import { DIAS_VALIDEZ } from "./catalog";
import { sumarDias } from "./fechas";
import { armarPresupuesto, type AppData, type Cliente, type Estado, type Presupuesto } from "./modelo";

interface ClienteSemilla {
  nombre: string;
  usuario: string;
  localidad: Localidad;
  edad: number;
  como: ComoNosConocio;
  altaHaceDias: number;
}

const CLIENTES: ClienteSemilla[] = [
  { nombre: "Lucía Fernández", usuario: "lucia.fernandez", localidad: "Solymar", edad: 19, como: "Redes", altaHaceDias: 40 },
  { nombre: "Martín Rodríguez", usuario: "martin.rodriguez", localidad: "Atlántida", edad: 34, como: "Recomendación", altaHaceDias: 35 },
  { nombre: "Valentina Pérez", usuario: "valentina.perez", localidad: "Neptunia", edad: 22, como: "Cartel", altaHaceDias: 28 },
  { nombre: "Santiago Gómez", usuario: "santiago.gomez", localidad: "Parque del Plata", edad: 45, como: "Redes", altaHaceDias: 25 },
  { nombre: "Camila Silva", usuario: "camila.silva", localidad: "Costa", edad: 18, como: "Recomendación", altaHaceDias: 20 },
  { nombre: "Diego Martínez", usuario: "diego.martinez", localidad: "Salinas", edad: 27, como: "Otro", altaHaceDias: 12 },
  { nombre: "Florencia Sosa", usuario: "florencia.sosa", localidad: "Las Toscas", edad: 31, como: "Redes", altaHaceDias: 8 },
  { nombre: "Joaquín Núñez", usuario: "joaquin.nunez", localidad: "Marindia", edad: 52, como: "Cartel", altaHaceDias: 3 },
];

interface PresupuestoSemilla {
  cliente: number;
  categoria: Categoria;
  lineas: { tipo: TipoClase; cantidad: number }[];
  extras: ExtraId[];
  estado: Estado;
  /** Días antes de hoy en que se creó. */
  creadoHaceDias: number;
  /** Días antes de hoy en que se envió (si corresponde). */
  enviadoHaceDias?: number;
}

const PRESUPUESTOS: PresupuestoSemilla[] = [
  { cliente: 0, categoria: "A", lineas: [{ tipo: "practica60", cantidad: 10 }], extras: ["gestion"], estado: "Aceptado", creadoHaceDias: 38, enviadoHaceDias: 37 },
  { cliente: 1, categoria: "G1", lineas: [{ tipo: "practica120", cantidad: 4 }, { tipo: "teorica", cantidad: 2 }], extras: ["autoExamen"], estado: "Enviado", creadoHaceDias: 21, enviadoHaceDias: 20 },
  { cliente: 2, categoria: "Automático", lineas: [{ tipo: "practica60", cantidad: 8 }], extras: ["gestion", "simuladorTeorico"], estado: "Enviado", creadoHaceDias: 13, enviadoHaceDias: 12 },
  { cliente: 3, categoria: "G3", lineas: [{ tipo: "practica60", cantidad: 12 }, { tipo: "simulador", cantidad: 2 }], extras: [], estado: "Rechazado", creadoHaceDias: 24, enviadoHaceDias: 23 },
  { cliente: 4, categoria: "G1", lineas: [{ tipo: "practica60", cantidad: 6 }], extras: ["simuladorTeorico"], estado: "Enviado", creadoHaceDias: 4, enviadoHaceDias: 3 },
  { cliente: 5, categoria: "A", lineas: [{ tipo: "practica60", cantidad: 9 }], extras: ["gestion", "autoExamen"], estado: "Borrador", creadoHaceDias: 2 },
  { cliente: 6, categoria: "G2", lineas: [{ tipo: "practica120", cantidad: 5 }], extras: ["gestion"], estado: "Enviado", creadoHaceDias: 15, enviadoHaceDias: 14 },
  { cliente: 7, categoria: "Automático", lineas: [{ tipo: "practica60", cantidad: 15 }], extras: ["gestion", "simuladorTeorico", "autoExamen"], estado: "Borrador", creadoHaceDias: 1 },
  { cliente: 1, categoria: "G1", lineas: [{ tipo: "practica60", cantidad: 3 }], extras: [], estado: "Vencido", creadoHaceDias: 34, enviadoHaceDias: 33 },
];

export function crearSemilla(hoy: string): AppData {
  const clientes: Cliente[] = CLIENTES.map((c, i) => ({
    id: `cli_demo_${i + 1}`,
    nombre: c.nombre,
    correo: `${c.usuario}@example.com`,
    localidad: c.localidad,
    edad: c.edad,
    comoNosConocio: c.como,
    fechaAlta: sumarDias(hoy, -c.altaHaceDias),
  }));

  // Correlativos en orden de creación.
  const ordenados = [...PRESUPUESTOS].sort((a, b) => b.creadoHaceDias - a.creadoHaceDias);
  const presupuestos: Presupuesto[] = ordenados.map((s, i) => {
    const cliente = clientes[s.cliente];
    const p = armarPresupuesto(
      {
        clienteId: cliente.id,
        categoria: s.categoria,
        lineas: s.lineas,
        extras: s.extras,
        localidad: cliente.localidad,
      },
      cliente,
      { id: `pre_demo_${i + 1}`, numero: i + 1, fechaCreacion: sumarDias(hoy, -s.creadoHaceDias) },
    );
    p.estado = s.estado;
    if (s.enviadoHaceDias !== undefined) {
      p.fechaEnvio = sumarDias(hoy, -s.enviadoHaceDias);
      p.vencimiento = sumarDias(p.fechaEnvio, DIAS_VALIDEZ);
    }
    return p;
  });

  return { version: 1, correlativo: presupuestos.length, clientes, presupuestos };
}
