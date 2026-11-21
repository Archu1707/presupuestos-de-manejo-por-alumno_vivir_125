import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatoPesos } from "@/lib/presupuestos/calc";
import { COMO_NOS_CONOCIO, LOCALIDADES } from "@/lib/presupuestos/catalog";
import { formatoFecha } from "@/lib/presupuestos/fechas";
import { ESTADOS_ABIERTOS, numeroPresupuesto, type Cliente } from "@/lib/presupuestos/store";

import { useAppDatos } from "./AppDatos";
import { Aviso, Campo, EstadoBadge, Seccion, SelectNativo } from "./ui";

const VACIO = {
  nombre: "",
  correo: "",
  localidad: "",
  edad: "",
  comoNosConocio: "",
};

export function Clientes({
  onNuevoPresupuesto,
  onImprimir,
}: {
  onNuevoPresupuesto: (clienteId: string) => void;
  onImprimir: (presupuestoId: string) => void;
}) {
  const { data, hoy, run } = useAppDatos();
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [errorFicha, setErrorFicha] = useState("");

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return [...data.clientes]
      .filter(
        (c) =>
          !q ||
          c.nombre.toLowerCase().includes(q) ||
          c.correo.includes(q) ||
          c.localidad.toLowerCase().includes(q),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [data.clientes, busqueda]);

  const cliente = data.clientes.find((c) => c.id === seleccionado) ?? null;

  function guardar(e: FormEvent) {
    e.preventDefault();
    const r = run((repo) => repo.crearCliente(form, hoy));
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError("");
    setForm(VACIO);
    setSeleccionado(r.valor.id);
    toast.success(`Cliente ${r.valor.nombre} guardado.`);
  }

  function eliminar(c: Cliente) {
    const puede = run((repo) => repo.puedeEliminarCliente(c.id));
    if (!puede.ok) {
      setErrorFicha(puede.error);
      return;
    }
    if (!window.confirm(`¿Eliminar a ${c.nombre}? Esta acción no se puede deshacer.`)) return;
    const r = run((repo) => repo.eliminarCliente(c.id));
    if (!r.ok) {
      setErrorFicha(r.error);
      return;
    }
    setErrorFicha("");
    setSeleccionado(null);
    toast.success(`Cliente ${c.nombre} eliminado.`);
  }

  const set = (campo: keyof typeof VACIO) => (v: string) => setForm((f) => ({ ...f, [campo]: v }));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <Seccion titulo="Alta de cliente">
          <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2" noValidate>
            <div className="sm:col-span-2">
              <Campo label="Nombre" htmlFor="c-nombre">
                <Input id="c-nombre" value={form.nombre} onChange={(e) => set("nombre")(e.target.value)} />
              </Campo>
            </div>
            <div className="sm:col-span-2">
              <Campo label="Correo" htmlFor="c-correo" ayuda="Datos sintéticos: usar el dominio example.com.">
                <Input
                  id="c-correo"
                  type="email"
                  inputMode="email"
                  placeholder="nombre.apellido@example.com"
                  value={form.correo}
                  onChange={(e) => set("correo")(e.target.value)}
                />
              </Campo>
            </div>
            <Campo label="Localidad" htmlFor="c-localidad">
              <SelectNativo id="c-localidad" value={form.localidad} onChange={(e) => set("localidad")(e.target.value)}>
                <option value="">Elegir…</option>
                {LOCALIDADES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </SelectNativo>
            </Campo>
            <Campo label="Edad" htmlFor="c-edad">
              <Input
                id="c-edad"
                type="number"
                inputMode="numeric"
                min={16}
                max={99}
                value={form.edad}
                onChange={(e) => set("edad")(e.target.value)}
              />
            </Campo>
            <div className="sm:col-span-2">
              <Campo label="¿Cómo nos conoció?" htmlFor="c-como">
                <SelectNativo id="c-como" value={form.comoNosConocio} onChange={(e) => set("comoNosConocio")(e.target.value)}>
                  <option value="">Elegir…</option>
                  {COMO_NOS_CONOCIO.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectNativo>
              </Campo>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Fecha de alta: {formatoFecha(hoy)} (automática)
            </p>
            {error && (
              <div className="sm:col-span-2">
                <Aviso tono="error">{error}</Aviso>
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto">
                Guardar cliente
              </Button>
            </div>
          </form>
        </Seccion>

        <Seccion titulo={`Clientes (${lista.length})`}>
          <Input
            placeholder="Buscar por nombre, correo o localidad"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="mb-3"
            aria-label="Buscar clientes"
          />
          <ul className="divide-y rounded-md border">
            {lista.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSeleccionado(c.id);
                    setErrorFicha("");
                  }}
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-muted ${
                    c.id === seleccionado ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="font-medium text-foreground">{c.nombre}</span>
                  <span className="break-all text-xs text-muted-foreground">
                    {c.correo} · {c.localidad}
                  </span>
                </button>
              </li>
            ))}
            {lista.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">Sin clientes.</li>
            )}
          </ul>
        </Seccion>
      </div>

      <Seccion titulo="Ficha del cliente">
        {!cliente ? (
          <p className="text-sm text-muted-foreground">Elegí un cliente de la lista para ver su ficha.</p>
        ) : (
          <FichaCliente
            cliente={cliente}
            error={errorFicha}
            onEliminar={() => eliminar(cliente)}
            onNuevoPresupuesto={() => onNuevoPresupuesto(cliente.id)}
            onImprimir={onImprimir}
          />
        )}
      </Seccion>
    </div>
  );
}

function FichaCliente({
  cliente,
  error,
  onEliminar,
  onNuevoPresupuesto,
  onImprimir,
}: {
  cliente: Cliente;
  error: string;
  onEliminar: () => void;
  onNuevoPresupuesto: () => void;
  onImprimir: (id: string) => void;
}) {
  const { data } = useAppDatos();
  const historial = data.presupuestos
    .filter((p) => p.clienteId === cliente.id)
    .sort((a, b) => b.numero - a.numero);
  const abiertos = historial.filter((p) => ESTADOS_ABIERTOS.includes(p.estado));
  const bloqueado = abiertos.length > 0;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <Dato k="Nombre" v={cliente.nombre} />
        <Dato k="Correo" v={cliente.correo} />
        <Dato k="Localidad" v={cliente.localidad} />
        <Dato k="Edad" v={`${cliente.edad} años`} />
        <Dato k="¿Cómo nos conoció?" v={cliente.comoNosConocio} />
        <Dato k="Fecha de alta" v={formatoFecha(cliente.fechaAlta)} />
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onNuevoPresupuesto}>Nuevo presupuesto</Button>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={onEliminar}
          disabled={bloqueado}
          aria-describedby={bloqueado ? "motivo-no-eliminar" : undefined}
        >
          Eliminar cliente
        </Button>
      </div>
      {bloqueado && (
        <div id="motivo-no-eliminar">
          <Aviso tono="demo">
            <strong>No se puede eliminar este cliente:</strong> tiene {abiertos.length} presupuesto(s)
            en Borrador o Enviado ({abiertos.map((p) => `${numeroPresupuesto(p.numero)} ${p.estado}`).join(", ")}).
            Para poder eliminarlo, los borradores deben eliminarse y los enviados cerrarse como
            Aceptado o Rechazado (o vencer).
          </Aviso>
        </div>
      )}
      {error && <Aviso tono="error">{error}</Aviso>}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Historial de presupuestos ({historial.length})
        </h3>
        {historial.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tiene presupuestos.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {historial.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">
                    {numeroPresupuesto(p.numero)} · Cat. {p.categoria}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Creado {formatoFecha(p.fechaCreacion)}
                    {p.fechaEnvio && ` · Enviado ${formatoFecha(p.fechaEnvio)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EstadoBadge estado={p.estado} />
                  <span className="font-semibold tabular-nums">{formatoPesos(p.total)}</span>
                  <Button size="sm" variant="ghost" onClick={() => onImprimir(p.id)}>
                    Ver
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="break-words font-medium text-foreground">{v}</dd>
    </div>
  );
}
