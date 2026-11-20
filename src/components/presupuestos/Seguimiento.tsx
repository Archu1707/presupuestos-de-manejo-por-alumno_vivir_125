import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatoPesos } from "@/lib/presupuestos/calc";
import { CATEGORIAS, LOCALIDADES } from "@/lib/presupuestos/catalog";
import { enlaceWhatsApp, textoPresupuesto } from "@/lib/presupuestos/compartir";
import { formatoFecha, semanaDe } from "@/lib/presupuestos/fechas";
import {
  ESTADOS,
  ESTADOS_FINALES,
  numeroPresupuesto,
  type Presupuesto,
  type Resultado,
} from "@/lib/presupuestos/store";

import { useAppDatos } from "./AppDatos";
import { copiarTexto } from "./copiar";
import { Campo, EstadoBadge, Seccion, SelectNativo } from "./ui";

export function Seguimiento({
  onEditar,
  onImprimir,
}: {
  onEditar: (id: string) => void;
  onImprimir: (id: string) => void;
}) {
  const { data, hoy, run } = useAppDatos();
  const [estado, setEstado] = useState("");
  const [categoria, setCategoria] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [vencenSemana, setVencenSemana] = useState(false);

  // Al abrir el panel: Enviado con más de 15 días corridos pasa a Vencido.
  const yaRevisado = useRef(false);
  useEffect(() => {
    if (yaRevisado.current) return;
    yaRevisado.current = true;
    const n = run((repo) => repo.vencerAutomaticos(hoy));
    if (n > 0) toast.info(`${n} presupuesto(s) pasaron a Vencido (más de 15 días desde el envío).`);
  }, [run, hoy]);

  const semana = semanaDe(hoy);
  const filtrados = useMemo(
    () =>
      data.presupuestos
        .filter((p) => !estado || p.estado === estado)
        .filter((p) => !categoria || p.categoria === categoria)
        .filter((p) => !localidad || p.localidad === localidad)
        .filter(
          (p) =>
            !vencenSemana ||
            (p.estado === "Enviado" &&
              !!p.vencimiento &&
              p.vencimiento >= semana.inicio &&
              p.vencimiento <= semana.fin),
        )
        .sort((a, b) => b.numero - a.numero),
    [data.presupuestos, estado, categoria, localidad, vencenSemana, semana.inicio, semana.fin],
  );

  const hayFiltros = !!(estado || categoria || localidad || vencenSemana);

  function aplicar(r: Resultado<unknown>, exito: string) {
    if (r.ok) toast.success(exito);
    else toast.error(r.error);
  }

  const acciones = {
    enviar: (p: Presupuesto) =>
      aplicar(run((repo) => repo.cambiarEstado(p.id, "Enviado", hoy)), `${numeroPresupuesto(p.numero)} marcado como Enviado.`),
    aceptar: (p: Presupuesto) =>
      aplicar(run((repo) => repo.cambiarEstado(p.id, "Aceptado", hoy)), `${numeroPresupuesto(p.numero)} Aceptado.`),
    rechazar: (p: Presupuesto) =>
      aplicar(run((repo) => repo.cambiarEstado(p.id, "Rechazado", hoy)), `${numeroPresupuesto(p.numero)} Rechazado.`),
    duplicar: (p: Presupuesto) => {
      const r = run((repo) => repo.duplicar(p.id, hoy));
      if (!r.ok) return toast.error(r.error);
      toast.success(`Nuevo borrador ${numeroPresupuesto(r.valor.numero)} con precios vigentes.`);
      onEditar(r.valor.id);
    },
    eliminar: (p: Presupuesto) => {
      if (!window.confirm(`¿Eliminar el borrador ${numeroPresupuesto(p.numero)}?`)) return;
      aplicar(run((repo) => repo.eliminarBorrador(p.id)), "Borrador eliminado.");
    },
    whatsapp: (p: Presupuesto) =>
      window.open(enlaceWhatsApp(textoPresupuesto(p)), "_blank", "noopener,noreferrer"),
    copiar: async (p: Presupuesto) => {
      const ok = await copiarTexto(textoPresupuesto(p));
      if (ok) toast.success("Texto copiado.");
      else toast.error("No se pudo copiar automáticamente.");
    },
  };

  return (
    <Seccion titulo="Panel de seguimiento">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Campo label="Estado" htmlFor="f-estado">
          <SelectNativo id="f-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </SelectNativo>
        </Campo>
        <Campo label="Categoría" htmlFor="f-categoria">
          <SelectNativo id="f-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectNativo>
        </Campo>
        <Campo label="Localidad" htmlFor="f-localidad">
          <SelectNativo id="f-localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)}>
            <option value="">Todas</option>
            {LOCALIDADES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </SelectNativo>
        </Campo>
        <label className="flex h-10 cursor-pointer items-center gap-2 self-end rounded-md border bg-card px-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={vencenSemana}
            onChange={(e) => setVencenSemana(e.target.checked)}
          />
          Vencen esta semana
        </label>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground" aria-live="polite">
          <strong data-testid="contador">{filtrados.length}</strong>{" "}
          {filtrados.length === 1 ? "resultado" : "resultados"}
          {hayFiltros && ` de ${data.presupuestos.length}`}
          {vencenSemana && (
            <span className="text-muted-foreground">
              {" "}
              · semana {formatoFecha(semana.inicio)} – {formatoFecha(semana.fin)}
            </span>
          )}
        </p>
        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEstado("");
              setCategoria("");
              setLocalidad("");
              setVencenSemana(false);
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla en pantallas medianas y grandes */}
      <div className="hidden overflow-x-auto rounded-md border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">N.º</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Cat.</th>
              <th className="px-3 py-2">Localidad</th>
              <th className="px-3 py-2">Envío</th>
              <th className="px-3 py-2">Vence</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtrados.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-3 py-2 font-medium">{numeroPresupuesto(p.numero)}</td>
                <td className="px-3 py-2">{p.clienteNombre}</td>
                <td className="px-3 py-2">{p.categoria}</td>
                <td className="px-3 py-2">{p.localidad}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatoFecha(p.fechaEnvio)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatoFecha(p.vencimiento)}</td>
                <td className="px-3 py-2">
                  <EstadoBadge estado={p.estado} />
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatoPesos(p.total)}</td>
                <td className="px-3 py-2">
                  <Acciones p={p} acciones={acciones} onEditar={onEditar} onImprimir={onImprimir} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <Vacio />}
      </div>

      {/* Tarjetas en móvil */}
      <ul className="space-y-3 md:hidden">
        {filtrados.map((p) => (
          <li key={p.id} className="rounded-md border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-foreground">
                  {numeroPresupuesto(p.numero)} · {p.clienteNombre}
                </div>
                <div className="text-xs text-muted-foreground">
                  Cat. {p.categoria} · {p.localidad}
                </div>
                <div className="text-xs text-muted-foreground">
                  Envío {formatoFecha(p.fechaEnvio)} · Vence {formatoFecha(p.vencimiento)}
                </div>
              </div>
              <EstadoBadge estado={p.estado} />
            </div>
            <div className="mt-2 text-lg font-bold tabular-nums text-primary">{formatoPesos(p.total)}</div>
            <div className="mt-2">
              <Acciones p={p} acciones={acciones} onEditar={onEditar} onImprimir={onImprimir} />
            </div>
          </li>
        ))}
        {filtrados.length === 0 && (
          <li>
            <Vacio />
          </li>
        )}
      </ul>
    </Seccion>
  );
}

type AccionesMap = Record<
  "enviar" | "aceptar" | "rechazar" | "duplicar" | "eliminar" | "whatsapp" | "copiar",
  (p: Presupuesto) => void
>;

function Acciones({
  p,
  acciones,
  onEditar,
  onImprimir,
}: {
  p: Presupuesto;
  acciones: AccionesMap;
  onEditar: (id: string) => void;
  onImprimir: (id: string) => void;
}) {
  const b = "h-8 px-2.5 text-xs";
  return (
    <div className="flex flex-wrap gap-1.5">
      {p.estado === "Borrador" && (
        <>
          <Button size="sm" variant="outline" className={b} onClick={() => onEditar(p.id)}>
            Editar
          </Button>
          <Button size="sm" className={b} onClick={() => acciones.enviar(p)}>
            Marcar Enviado
          </Button>
          <Button size="sm" variant="ghost" className={`${b} text-destructive`} onClick={() => acciones.eliminar(p)}>
            Eliminar
          </Button>
        </>
      )}
      {p.estado === "Enviado" && (
        <>
          <Button size="sm" className={`${b} bg-success text-white hover:bg-success/90`} onClick={() => acciones.aceptar(p)}>
            Aceptado
          </Button>
          <Button size="sm" variant="outline" className={`${b} border-destructive/40 text-destructive`} onClick={() => acciones.rechazar(p)}>
            Rechazado
          </Button>
          <Button size="sm" variant="secondary" className={b} onClick={() => acciones.whatsapp(p)}>
            WhatsApp
          </Button>
          <Button size="sm" variant="secondary" className={b} onClick={() => acciones.copiar(p)}>
            Copiar
          </Button>
        </>
      )}
      {ESTADOS_FINALES.includes(p.estado) && (
        <Button size="sm" variant="outline" className={b} onClick={() => acciones.duplicar(p)}>
          Duplicar como borrador
        </Button>
      )}
      <Button size="sm" variant="ghost" className={b} onClick={() => onImprimir(p.id)}>
        Imprimir
      </Button>
    </div>
  );
}

function Vacio() {
  return <p className="px-3 py-8 text-center text-sm text-muted-foreground">No hay presupuestos con esos filtros.</p>;
}
