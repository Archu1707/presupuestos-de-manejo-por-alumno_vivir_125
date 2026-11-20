import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { formatoPesos } from "@/lib/presupuestos/calc";
import { TIPOS_CON_TRASLADO, TIPO_CLASE_LABEL } from "@/lib/presupuestos/catalog";
import { NOMBRE_ACADEMIA } from "@/lib/presupuestos/compartir";
import { formatoFecha } from "@/lib/presupuestos/fechas";
import { numeroPresupuesto } from "@/lib/presupuestos/store";

import { useAppDatos } from "./AppDatos";
import { Desglose } from "./NuevoPresupuesto";
import { EstadoBadge } from "./ui";

/**
 * Vista lista para imprimir o guardar como PDF. Muestra los valores GUARDADOS del
 * presupuesto (los mismos que el panel), sin recalcular con precios nuevos.
 */
export function VistaImprimible({ presupuestoId, onCerrar }: { presupuestoId: string; onCerrar: () => void }) {
  const { data } = useAppDatos();
  const p = data.presupuestos.find((x) => x.id === presupuestoId);
  const cliente = p && data.clientes.find((c) => c.id === p.clienteId);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCerrar]);

  if (!p) return null;
  const cantidadClases = p.clases.reduce((s, c) => s + c.cantidad, 0);
  const clasesTraslado = p.clases
    .filter((c) => TIPOS_CON_TRASLADO.includes(c.tipo))
    .reduce((s, c) => s + c.cantidad, 0);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-2 sm:p-6 print:static print:bg-white print:p-0"
      role="dialog"
      aria-modal="true"
      aria-label={`Vista imprimible ${numeroPresupuesto(p.numero)}`}
    >
      <div className="no-print mx-auto mb-3 flex max-w-2xl flex-wrap justify-end gap-2">
        <Button onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
        <Button variant="secondary" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>

      <article className="print-area mx-auto max-w-2xl rounded-lg bg-white p-5 text-[#1B1F24] shadow-lg sm:p-8 print:max-w-none print:rounded-none print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b-4 border-primary pb-4">
          <div>
            <h1 className="text-xl font-bold text-primary">{NOMBRE_ACADEMIA}</h1>
            <p className="text-sm">Presupuesto de curso de manejo</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-lg font-semibold">{numeroPresupuesto(p.numero)}</div>
            <div>Fecha: {formatoFecha(p.fechaEnvio ?? p.fechaCreacion)}</div>
            {p.vencimiento && <div>Válido hasta: {formatoFecha(p.vencimiento)}</div>}
            <div className="mt-1">
              <EstadoBadge estado={p.estado} />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-2 py-4 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs uppercase text-[#5B6573]">Alumno/a</span>
            <div className="font-semibold">{p.clienteNombre}</div>
            {cliente && <div className="break-all">{cliente.correo}</div>}
          </div>
          <div>
            <span className="text-xs uppercase text-[#5B6573]">Categoría · Localidad</span>
            <div className="font-semibold">
              {p.categoria} · {p.localidad}
            </div>
          </div>
        </section>

        <table className="mb-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-[#5B6573]">
              <th className="py-1.5">Concepto</th>
              <th className="py-1.5 text-right">Cant.</th>
              <th className="py-1.5 text-right">Unitario</th>
              <th className="py-1.5 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {p.clases.map((c, i) => (
              <tr key={i} className="border-b border-dashed">
                <td className="py-1.5">{TIPO_CLASE_LABEL[c.tipo]}</td>
                <td className="py-1.5 text-right tabular-nums">{c.cantidad}</td>
                <td className="py-1.5 text-right tabular-nums">{formatoPesos(c.precioUnitario)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatoPesos(c.cantidad * c.precioUnitario)}</td>
              </tr>
            ))}
            {p.extras.map((e) => (
              <tr key={e.id} className="border-b border-dashed">
                <td className="py-1.5">{e.nombre}</td>
                <td className="py-1.5 text-right">1</td>
                <td className="py-1.5 text-right tabular-nums">{formatoPesos(e.precio)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatoPesos(e.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-sm">
          <Desglose p={p} cantidadClases={cantidadClases} clasesTraslado={clasesTraslado} />
        </div>

        <footer className="mt-6 border-t pt-3 text-xs text-[#5B6573]">
          Precios en pesos uruguayos, congelados al momento de guardar el presupuesto. El descuento
          del 10% aplica con 10 clases o más y solo sobre la base de clases. Documento de demostración
          generado con datos sintéticos.
        </footer>
      </article>
    </div>
  );
}
