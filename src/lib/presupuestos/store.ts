import {
  CATEGORIAS,
  COMO_NOS_CONOCIO,
  DIAS_VALIDEZ,
  LOCALIDADES,
  type ComoNosConocio,
  type Localidad,
} from "./catalog";
import { diasEntre, sumarDias } from "./fechas";
import { crearSemilla } from "./semilla";
import {
  ESTADOS_ABIERTOS,
  aInput,
  armarPresupuesto,
  normalizarCorreo,
  nuevoId,
  type Almacen,
  type AppData,
  type Cliente,
  type ClienteInput,
  type Presupuesto,
  type PresupuestoInput,
  type Resultado,
} from "./modelo";

export * from "./modelo";

/** Clave única de la app en localStorage. */
export const APP_KEY = "vivir125.presupuestos.v1";

export function validarCliente(
  input: ClienteInput,
  existentes: Cliente[],
): Resultado<Omit<Cliente, "id" | "fechaAlta">> {
  const nombre = input.nombre.trim().replace(/\s+/g, " ");
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };

  const correo = input.correo.trim();
  if (!correo) return { ok: false, error: "El correo es obligatorio." };
  if (/\s/.test(correo)) return { ok: false, error: "El correo no puede contener espacios." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo))
    return { ok: false, error: "El correo no tiene un formato válido." };
  if (!correo.toLowerCase().endsWith("@example.com"))
    return {
      ok: false,
      error: "En esta demo los correos deben usar el dominio example.com (datos sintéticos).",
    };
  const normal = normalizarCorreo(correo);
  if (existentes.some((c) => normalizarCorreo(c.correo) === normal))
    return { ok: false, error: "Ya existe un cliente con ese correo." };

  if (!LOCALIDADES.includes(input.localidad as Localidad))
    return { ok: false, error: "Elegí una localidad de la lista." };

  const edad = typeof input.edad === "number" ? input.edad : Number(String(input.edad).trim());
  if (!Number.isInteger(edad) || edad < 16 || edad > 99)
    return { ok: false, error: "La edad debe ser un número entero entre 16 y 99." };

  if (!COMO_NOS_CONOCIO.includes(input.comoNosConocio as ComoNosConocio))
    return { ok: false, error: "Indicá cómo nos conoció." };

  return {
    ok: true,
    valor: {
      nombre,
      correo: normal,
      localidad: input.localidad as Localidad,
      edad,
      comoNosConocio: input.comoNosConocio as ComoNosConocio,
    },
  };
}

function validarPresupuestoInput(input: PresupuestoInput, data: AppData): Resultado<Cliente> {
  const cliente = data.clientes.find((c) => c.id === input.clienteId);
  if (!cliente) return { ok: false, error: "Seleccioná un cliente." };
  if (!CATEGORIAS.includes(input.categoria)) return { ok: false, error: "Categoría inválida." };
  if (!LOCALIDADES.includes(input.localidad)) return { ok: false, error: "Localidad inválida." };
  const cant = input.lineas.reduce((s, l) => s + (l.cantidad > 0 ? Math.floor(l.cantidad) : 0), 0);
  if (cant < 1) return { ok: false, error: "Indicá al menos una clase." };
  return { ok: true, valor: cliente };
}

/**
 * Repositorio de datos. Cada operación arma el estado nuevo, intenta guardarlo y
 * solo si el guardado funciona lo adopta. Si falla, los datos en memoria (y el
 * correlativo) quedan como estaban.
 */
export class Repositorio {
  private datos: AppData;

  constructor(
    private almacen: Almacen,
    hoy: string,
    private clave: string = APP_KEY,
  ) {
    this.datos = this.cargar(hoy);
  }

  get data(): AppData {
    return this.datos;
  }

  private cargar(hoy: string): AppData {
    const crudo = this.almacen.getItem(this.clave);
    if (crudo === null) {
      // Semilla SOLO si la clave de la app no existe.
      const semilla = crearSemilla(hoy);
      try {
        this.almacen.setItem(this.clave, JSON.stringify(semilla));
      } catch {
        // Si no se puede escribir, se trabaja en memoria igual.
      }
      return semilla;
    }
    try {
      const parsed = JSON.parse(crudo) as AppData;
      if (!parsed || !Array.isArray(parsed.clientes) || !Array.isArray(parsed.presupuestos))
        throw new Error("formato");
      const maxNumero = parsed.presupuestos.reduce((m, p) => Math.max(m, p.numero ?? 0), 0);
      return {
        version: 1,
        correlativo: Math.max(parsed.correlativo ?? 0, maxNumero),
        clientes: parsed.clientes,
        presupuestos: parsed.presupuestos,
      };
    } catch {
      // Datos ilegibles: se arranca vacío en memoria.
      return { version: 1, correlativo: 0, clientes: [], presupuestos: [] };
    }
  }

  private confirmar(next: AppData): Resultado {
    try {
      this.almacen.setItem(this.clave, JSON.stringify(next));
    } catch {
      return {
        ok: false,
        error: "No se pudo guardar (almacenamiento lleno o bloqueado). No se guardó ningún cambio.",
      };
    }
    this.datos = next;
    return { ok: true, valor: undefined };
  }

  crearCliente(input: ClienteInput, hoy: string): Resultado<Cliente> {
    const v = validarCliente(input, this.datos.clientes);
    if (!v.ok) return v;
    const cliente: Cliente = { id: nuevoId("cli"), fechaAlta: hoy, ...v.valor };
    const r = this.confirmar({ ...this.datos, clientes: [...this.datos.clientes, cliente] });
    return r.ok ? { ok: true, valor: cliente } : r;
  }

  puedeEliminarCliente(id: string): Resultado {
    const abiertos = this.datos.presupuestos.filter(
      (p) => p.clienteId === id && ESTADOS_ABIERTOS.includes(p.estado),
    );
    if (abiertos.length > 0)
      return {
        ok: false,
        error: `No se puede eliminar: tiene ${abiertos.length} presupuesto(s) en Borrador o Enviado.`,
      };
    return { ok: true, valor: undefined };
  }

  eliminarCliente(id: string): Resultado {
    const p = this.puedeEliminarCliente(id);
    if (!p.ok) return p;
    return this.confirmar({
      ...this.datos,
      clientes: this.datos.clientes.filter((c) => c.id !== id),
    });
  }

  /**
   * Guarda un presupuesto. Sin `id` crea uno nuevo (toma el siguiente correlativo).
   * Con `id` solo actualiza si sigue en Borrador. `enviar` lo marca como Enviado.
   */
  guardarPresupuesto(
    input: PresupuestoInput,
    hoy: string,
    opciones: { id?: string; enviar?: boolean } = {},
  ): Resultado<Presupuesto> {
    const v = validarPresupuestoInput(input, this.datos);
    if (!v.ok) return v;
    const cliente = v.valor;

    let next: AppData;
    let presupuesto: Presupuesto;
    if (opciones.id) {
      const actual = this.datos.presupuestos.find((p) => p.id === opciones.id);
      if (!actual) return { ok: false, error: "Presupuesto no encontrado." };
      if (actual.estado !== "Borrador")
        return { ok: false, error: `Un presupuesto ${actual.estado} no se puede editar.` };
      presupuesto = armarPresupuesto(input, cliente, actual);
      if (actual.origenId) presupuesto.origenId = actual.origenId;
      if (opciones.enviar) Object.assign(presupuesto, datosEnvio(hoy));
      next = {
        ...this.datos,
        presupuestos: this.datos.presupuestos.map((p) => (p.id === actual.id ? presupuesto : p)),
      };
    } else {
      const numero = this.datos.correlativo + 1;
      presupuesto = armarPresupuesto(input, cliente, {
        id: nuevoId("pre"),
        numero,
        fechaCreacion: hoy,
      });
      if (opciones.enviar) Object.assign(presupuesto, datosEnvio(hoy));
      next = {
        ...this.datos,
        correlativo: numero,
        presupuestos: [...this.datos.presupuestos, presupuesto],
      };
    }
    const r = this.confirmar(next);
    return r.ok ? { ok: true, valor: presupuesto } : r;
  }

  cambiarEstado(id: string, estado: "Enviado" | "Aceptado" | "Rechazado", hoy: string): Resultado {
    const p = this.datos.presupuestos.find((x) => x.id === id);
    if (!p) return { ok: false, error: "Presupuesto no encontrado." };
    const permitido =
      (estado === "Enviado" && p.estado === "Borrador") ||
      ((estado === "Aceptado" || estado === "Rechazado") && p.estado === "Enviado");
    if (!permitido) return { ok: false, error: `No se puede pasar de ${p.estado} a ${estado}.` };
    const actualizado: Presupuesto =
      estado === "Enviado" ? { ...p, ...datosEnvio(hoy) } : { ...p, estado };
    return this.confirmar({
      ...this.datos,
      presupuestos: this.datos.presupuestos.map((x) => (x.id === id ? actualizado : x)),
    });
  }

  eliminarBorrador(id: string): Resultado {
    const p = this.datos.presupuestos.find((x) => x.id === id);
    if (!p) return { ok: false, error: "Presupuesto no encontrado." };
    if (p.estado !== "Borrador")
      return { ok: false, error: "Solo se pueden eliminar presupuestos en Borrador." };
    return this.confirmar({
      ...this.datos,
      presupuestos: this.datos.presupuestos.filter((x) => x.id !== id),
    });
  }

  /** Copia como nuevo Borrador con los precios vigentes (no copia los congelados). */
  duplicar(id: string, hoy: string): Resultado<Presupuesto> {
    const p = this.datos.presupuestos.find((x) => x.id === id);
    if (!p) return { ok: false, error: "Presupuesto no encontrado." };
    const cliente = this.datos.clientes.find((c) => c.id === p.clienteId) ?? {
      id: p.clienteId,
      nombre: p.clienteNombre,
    };
    const numero = this.datos.correlativo + 1;
    const copia = armarPresupuesto(aInput(p), cliente, {
      id: nuevoId("pre"),
      numero,
      fechaCreacion: hoy,
    });
    copia.origenId = p.id;
    const r = this.confirmar({
      ...this.datos,
      correlativo: numero,
      presupuestos: [...this.datos.presupuestos, copia],
    });
    return r.ok ? { ok: true, valor: copia } : r;
  }

  /** Enviado con más de 15 días corridos desde el envío pasa a Vencido. */
  vencerAutomaticos(hoy: string): number {
    const vencer = (p: Presupuesto) =>
      p.estado === "Enviado" && p.fechaEnvio !== null && diasEntre(p.fechaEnvio, hoy) > DIAS_VALIDEZ;
    const cantidad = this.datos.presupuestos.filter(vencer).length;
    if (cantidad === 0) return 0;
    const r = this.confirmar({
      ...this.datos,
      presupuestos: this.datos.presupuestos.map((p) =>
        vencer(p) ? { ...p, estado: "Vencido" as const } : p,
      ),
    });
    return r.ok ? cantidad : 0;
  }
}

function datosEnvio(hoy: string): Pick<Presupuesto, "estado" | "fechaEnvio" | "vencimiento"> {
  return { estado: "Enviado", fechaEnvio: hoy, vencimiento: sumarDias(hoy, DIAS_VALIDEZ) };
}
