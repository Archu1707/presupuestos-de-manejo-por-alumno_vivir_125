import { describe, expect, it } from "vitest";

import { calcularTotales } from "./calc";
import { sumarDias } from "./fechas";
import { ejecutarPruebaGuiada } from "./pruebaGuiada";
import { crearSemilla } from "./semilla";
import {
  APP_KEY,
  Repositorio,
  crearAlmacenEnMemoria,
  type Almacen,
  type PresupuestoInput,
} from "./store";

const HOY = "2026-11-20";

/** Repositorio sobre una copia aislada en memoria (nunca toca localStorage). */
function repoAislado() {
  const almacen = crearAlmacenEnMemoria();
  const repo = new Repositorio(almacen, HOY);
  return { almacen, repo };
}

function input(repo: Repositorio, clases: number, extras: PresupuestoInput["extras"] = []) {
  const cliente = repo.data.clientes.find((c) => c.localidad === "Neptunia")!;
  return {
    clienteId: cliente.id,
    categoria: "A",
    lineas: [{ tipo: "practica60", cantidad: clases }],
    extras,
    localidad: "Neptunia",
  } satisfies PresupuestoInput;
}

describe("Descuento por volumen", () => {
  it("9 clases + 2 extras NO aplica el 10%", () => {
    const { repo } = repoAislado();
    const r = repo.guardarPresupuesto(input(repo, 9, ["gestion", "simuladorTeorico"]), HOY);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor.baseClases).toBe(8100);
    expect(r.valor.descuento).toBe(0);
    expect(r.valor.totalExtras).toBe(2100);
    expect(r.valor.recargoTraslado).toBe(900);
    expect(r.valor.total).toBe(8100 + 2100 + 900);
  });

  it("10 clases SÍ aplica 10% solo sobre clases; extras y traslado completos", () => {
    const { repo } = repoAislado();
    const r = repo.guardarPresupuesto(input(repo, 10, ["gestion", "simuladorTeorico"]), HOY);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor.baseClases).toBe(9000);
    expect(r.valor.descuento).toBe(900);
    expect(r.valor.totalExtras).toBe(2100);
    expect(r.valor.recargoTraslado).toBe(1000);
    expect(r.valor.total).toBe(9000 - 900 + 2100 + 1000);
  });

  it("los extras no cuentan para el umbral", () => {
    const t = calcularTotales(
      [{ tipo: "practica60", cantidad: 9, precioUnitario: 700 }],
      [
        { id: "a", nombre: "a", precio: 1 },
        { id: "b", nombre: "b", precio: 1 },
        { id: "c", nombre: "c", precio: 1 },
      ],
      0,
    );
    expect(t.descuento).toBe(0);
  });

  it("120 min = doble de 60 min con 5% menos", () => {
    const { repo } = repoAislado();
    const base = input(repo, 1);
    const r = repo.guardarPresupuesto(
      { ...base, categoria: "G1", lineas: [{ tipo: "practica120", cantidad: 1 }] },
      HOY,
    );
    expect(r.ok && r.valor.clases[0].precioUnitario).toBe(1330);
  });

  it("la prueba guiada pasa completa y no modifica los datos reales", () => {
    const reales = crearSemilla(HOY);
    const foto = JSON.stringify(reales);
    const pasos = ejecutarPruebaGuiada(reales, HOY);
    expect(pasos.every((p) => p.ok)).toBe(true);
    expect(JSON.stringify(reales)).toBe(foto);
  });
});

describe("Clientes", () => {
  it("no permite correo repetido ignorando mayúsculas y espacios", () => {
    const { repo } = repoAislado();
    const existente = repo.data.clientes[0].correo;
    const r = repo.crearCliente(
      {
        nombre: "Otra Persona",
        correo: `  ${existente.toUpperCase()} `,
        localidad: "Costa",
        edad: 30,
        comoNosConocio: "Redes",
      },
      HOY,
    );
    expect(r.ok).toBe(false);
  });

  it("exige dominio example.com y sin espacios internos", () => {
    const { repo } = repoAislado();
    const base = { nombre: "X", localidad: "Costa", edad: 30, comoNosConocio: "Redes" };
    expect(repo.crearCliente({ ...base, correo: "x@gmail.com" }, HOY).ok).toBe(false);
    expect(repo.crearCliente({ ...base, correo: "x y@example.com" }, HOY).ok).toBe(false);
    expect(repo.crearCliente({ ...base, correo: "nuevo@example.com" }, HOY).ok).toBe(true);
  });

  it("no borra un cliente con presupuestos en Borrador o Enviado", () => {
    const { repo } = repoAislado();
    const conBorrador = repo.data.presupuestos.find((p) => p.estado === "Borrador")!;
    expect(repo.eliminarCliente(conBorrador.clienteId).ok).toBe(false);
    const sinPresupuestos = repo.crearCliente(
      { nombre: "Libre", correo: "libre@example.com", localidad: "Costa", edad: 20, comoNosConocio: "Otro" },
      HOY,
    );
    expect(sinPresupuestos.ok).toBe(true);
    if (sinPresupuestos.ok) expect(repo.eliminarCliente(sinPresupuestos.valor.id).ok).toBe(true);
  });
});

describe("Estados y persistencia", () => {
  it("Enviado con más de 15 días corridos pasa a Vencido", () => {
    const { repo } = repoAislado();
    const r = repo.guardarPresupuesto(input(repo, 5), "2026-11-01", { enviar: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    repo.vencerAutomaticos(sumarDias("2026-11-01", 15));
    expect(repo.data.presupuestos.find((p) => p.id === r.valor.id)!.estado).toBe("Enviado");
    repo.vencerAutomaticos(sumarDias("2026-11-01", 16));
    expect(repo.data.presupuestos.find((p) => p.id === r.valor.id)!.estado).toBe("Vencido");
  });

  it("estados finales no se editan, solo se duplican como Borrador", () => {
    const { repo } = repoAislado();
    const aceptado = repo.data.presupuestos.find((p) => p.estado === "Aceptado")!;
    const edit = repo.guardarPresupuesto(input(repo, 3), HOY, { id: aceptado.id });
    expect(edit.ok).toBe(false);
    const dup = repo.duplicar(aceptado.id, HOY);
    expect(dup.ok).toBe(true);
    if (dup.ok) {
      expect(dup.valor.estado).toBe("Borrador");
      expect(dup.valor.numero).toBe(repo.data.correlativo);
    }
  });

  it("si falla el guardado no cambia datos ni correlativo", () => {
    const { almacen } = repoAislado();
    const fallo: Almacen = {
      getItem: (k) => almacen.getItem(k),
      setItem: () => {
        throw new Error("lleno");
      },
    };
    const repo = new Repositorio(fallo, HOY);
    const antes = JSON.stringify(repo.data);
    const r = repo.guardarPresupuesto(input(repo, 4), HOY);
    expect(r.ok).toBe(false);
    expect(JSON.stringify(repo.data)).toBe(antes);
  });

  it("la semilla solo se carga si la clave no existe", () => {
    const almacen = crearAlmacenEnMemoria({
      [APP_KEY]: JSON.stringify({ version: 1, correlativo: 0, clientes: [], presupuestos: [] }),
    });
    const repo = new Repositorio(almacen, HOY);
    expect(repo.data.clientes).toHaveLength(0);
  });

  it("reiniciar datos vuelve a la semilla y se guarda", () => {
    const { almacen, repo } = repoAislado();
    repo.crearCliente(
      { nombre: "Extra", correo: "extra@example.com", localidad: "Costa", edad: 20, comoNosConocio: "Otro" },
      HOY,
    );
    repo.guardarPresupuesto(input(repo, 2), HOY);
    expect(repo.reiniciarDatos(HOY).ok).toBe(true);
    expect(repo.data).toEqual(crearSemilla(HOY));
    expect(new Repositorio(almacen, HOY).data).toEqual(crearSemilla(HOY));
  });

  it("los datos persisten entre instancias (recarga)", () => {
    const { almacen, repo } = repoAislado();
    repo.guardarPresupuesto(input(repo, 2), HOY);
    const recargado = new Repositorio(almacen, HOY);
    expect(recargado.data).toEqual(repo.data);
  });
});
