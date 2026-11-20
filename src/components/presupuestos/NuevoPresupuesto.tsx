import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatoPesos } from "@/lib/presupuestos/calc";
import {
  CATEGORIAS,
  EXTRAS,
  LOCALIDADES,
  TIPOS_CLASE,
  TIPO_CLASE_LABEL,
  UMBRAL_DESCUENTO,
  type Categoria,
  type ExtraId,
  type Localidad,
  type TipoClase,
} from "@/lib/presupuestos/catalog";
import { enlaceWhatsApp, textoPresupuesto } from "@/lib/presupuestos/compartir";
import {
  aInput,
  armarPresupuesto,
  numeroPresupuesto,
  type Presupuesto,
  type PresupuestoInput,
} from "@/lib/presupuestos/store";

import { useAppDatos } from "./AppDatos";
import { copiarTexto } from "./copiar";
import { Aviso, Campo, EstadoBadge, Seccion, SelectNativo } from "./ui";

interface Linea {
  tipo: TipoClase;
  cantidad: string;
}

export function NuevoPresupuesto({
  clienteIdInicial,
  presupuestoId,
  onIrAlPanel,
  onNuevo,
}: {
  clienteIdInicial?: string;
  /** Si viene, se edita ese presupuesto (solo si está en Borrador). */
  presupuestoId?: string;
  onIrAlPanel: () => void;
  onNuevo: () => void;
}) {
  const { data, hoy, run } = useAppDatos();

  const [idGuardado, setIdGuardado] = useState<string | undefined>(presupuestoId);
  const guardado = data.presupuestos.find((p) => p.id === idGuardado);
  const inicial = useMemo(() => {
    const p = data.presupuestos.find((x) => x.id === presupuestoId);
    return p ? aInput(p) : null;
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [clienteId, setClienteId] = useState(inicial?.clienteId ?? clienteIdInicial ?? "");
  const [categoria, setCategoria] = useState<Categoria>(inicial?.categoria ?? "A");
  const [lineas, setLineas] = useState<Linea[]>(
    inicial?.lineas.map((l) => ({ tipo: l.tipo, cantidad: String(l.cantidad) })) ?? [
      { tipo: "practica60", cantidad: "1" },
    ],
  );
  const [extras, setExtras] = useState<ExtraId[]>(inicial?.extras ?? []);
  const clienteSel = data.clientes.find((c) => c.id === clienteId);
  const [localidad, setLocalidad] = useState<Localidad>(
    inicial?.localidad ?? clienteSel?.localidad ?? "Costa",
  );
  const [error, setError] = useState("");

  // Al elegir otro cliente, se propone su localidad (se puede cambiar).
  useEffect(() => {
    if (!inicial && clienteSel) setLocalidad(clienteSel.localidad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const bloqueado = !!guardado && guardado.estado !== "Borrador";

  const input: PresupuestoInput = {
    clienteId,
    categoria,
    lineas: lineas.map((l) => ({ tipo: l.tipo, cantidad: Math.max(0, Math.floor(Number(l.cantidad) || 0)) })),
    extras,
    localidad,
  };

  // Vista previa en vivo con los precios vigentes: misma función que usa el guardado.
  const vista: Presupuesto = bloqueado && guardado
    ? guardado
    : armarPresupuesto(
        input,
        { id: clienteId, nombre: clienteSel?.nombre ?? "—" },
        { id: guardado?.id ?? "vista", numero: guardado?.numero ?? 0, fechaCreacion: hoy },
      );
  const cantidadClases = vista.clases.reduce((s, c) => s + c.cantidad, 0);
  const clasesTraslado = vista.clases
    .filter((c) => c.tipo === "practica60" || c.tipo === "practica120")
    .reduce((s, c) => s + c.cantidad, 0);

  function guardar(enviar: boolean) {
    const r = run((repo) => repo.guardarPresupuesto(input, hoy, { id: idGuardado, enviar }));
    if (!r.ok) {
      // Falla: se conserva todo lo cargado; no hay mensaje de éxito ni cambia el correlativo.
      setError(r.error);
      return;
    }
    setError("");
    setIdGuardado(r.valor.id);
    toast.success(
      enviar
        ? `${numeroPresupuesto(r.valor.numero)} marcado como Enviado. Vence el ${r.valor.vencimiento?.split("-").reverse().join("/")}.`
        : `Borrador ${numeroPresupuesto(r.valor.numero)} guardado.`,
    );
  }

  async function copiar() {
    const ok = await copiarTexto(textoPresupuesto(vista));
    if (ok) toast.success("Texto copiado. Pegalo donde quieras enviarlo.");
    else toast.error("No se pudo copiar automáticamente. Seleccioná el texto y copialo a mano.");
  }

  function whatsapp() {
    window.open(enlaceWhatsApp(textoPresupuesto(vista)), "_blank", "noopener,noreferrer");
  }

  const setLinea = (i: number, cambio: Partial<Linea>) =>
    setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...cambio } : l)));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Seccion
        titulo={guardado ? `Presupuesto ${numeroPresupuesto(guardado.numero)}` : "Nuevo presupuesto"}
        acciones={guardado && <EstadoBadge estado={guardado.estado} />}
      >
        <div className="space-y-4">
          <Aviso tono="demo">
            <strong>DEMO:</strong> guardar no contacta al negocio. Los datos quedan solo en este
            navegador.
          </Aviso>
          {bloqueado && (
            <Aviso>
              Este presupuesto está <strong>{guardado.estado}</strong> y ya no se puede editar.
              Para cambiarlo, duplicalo desde el panel de seguimiento.
            </Aviso>
          )}

          <fieldset disabled={bloqueado} className="space-y-4 disabled:opacity-70">
            <Campo label="Cliente" htmlFor="p-cliente">
              <SelectNativo id="p-cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Seleccionar cliente…</option>
                {[...data.clientes]
                  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.localidad})
                    </option>
                  ))}
              </SelectNativo>
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Categoría de libreta" htmlFor="p-categoria">
                <SelectNativo
                  id="p-categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as Categoria)}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectNativo>
              </Campo>
              <Campo label="Localidad (traslado)" htmlFor="p-localidad" ayuda="Recargo automático por clase práctica.">
                <SelectNativo
                  id="p-localidad"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value as Localidad)}
                >
                  {LOCALIDADES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </SelectNativo>
              </Campo>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Clases</span>
              {lineas.map((l, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-end gap-2">
                  <Campo label={i === 0 ? "Tipo de clase" : ""} htmlFor={`p-tipo-${i}`}>
                    <SelectNativo
                      id={`p-tipo-${i}`}
                      aria-label="Tipo de clase"
                      value={l.tipo}
                      onChange={(e) => setLinea(i, { tipo: e.target.value as TipoClase })}
                    >
                      {TIPOS_CLASE.map((t) => (
                        <option key={t} value={t}>
                          {TIPO_CLASE_LABEL[t]}
                        </option>
                      ))}
                    </SelectNativo>
                  </Campo>
                  <Campo label={i === 0 ? "Cantidad" : ""} htmlFor={`p-cant-${i}`}>
                    <Input
                      id={`p-cant-${i}`}
                      aria-label="Cantidad de clases"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={l.cantidad}
                      onChange={(e) => setLinea(i, { cantidad: e.target.value })}
                    />
                  </Campo>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10"
                    aria-label="Quitar línea"
                    disabled={lineas.length === 1}
                    onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLineas((ls) => [...ls, { tipo: "teorica", cantidad: "1" }])}
              >
                + Agregar otro tipo de clase
              </Button>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Extras</span>
              <div className="grid gap-2">
                {EXTRAS.map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--primary)]"
                        checked={extras.includes(e.id)}
                        onChange={(ev) =>
                          setExtras((xs) =>
                            ev.target.checked ? [...xs, e.id] : xs.filter((x) => x !== e.id),
                          )
                        }
                      />
                      {e.nombre}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{formatoPesos(e.precio)}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          {error && <Aviso tono="error">{error}</Aviso>}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="outline" disabled={bloqueado} onClick={() => guardar(false)}>
              Guardar borrador
            </Button>
            <Button disabled={bloqueado} onClick={() => guardar(true)}>
              Marcar Enviado
            </Button>
            <Button variant="secondary" onClick={whatsapp} disabled={!clienteSel && !bloqueado}>
              Compartir por WhatsApp
            </Button>
            <Button variant="secondary" onClick={copiar} disabled={!clienteSel && !bloqueado}>
              Copiar texto
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Compartir y copiar solo preparan el texto: el envío lo hacés vos a mano. La app no envía
            mensajes automáticamente.
          </p>
          {guardado && (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button variant="ghost" size="sm" onClick={onIrAlPanel}>
                Ir al panel de seguimiento
              </Button>
              <Button variant="ghost" size="sm" onClick={onNuevo}>
                Crear otro presupuesto
              </Button>
            </div>
          )}
        </div>
      </Seccion>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <Seccion titulo="Total en vivo">
          <Desglose p={vista} cantidadClases={cantidadClases} clasesTraslado={clasesTraslado} />
        </Seccion>
      </div>
    </div>
  );
}

export function Desglose({
  p,
  cantidadClases,
  clasesTraslado,
}: {
  p: Presupuesto;
  cantidadClases: number;
  clasesTraslado: number;
}) {
  const faltan = UMBRAL_DESCUENTO - cantidadClases;
  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-1">
        {p.clases.map((c, i) => (
          <li key={i} className="flex justify-between gap-2 text-muted-foreground">
            <span>
              {c.cantidad} × {TIPO_CLASE_LABEL[c.tipo]} ({formatoPesos(c.precioUnitario)})
            </span>
            <span className="tabular-nums">{formatoPesos(c.cantidad * c.precioUnitario)}</span>
          </li>
        ))}
      </ul>
      <Fila k={`Base clases (${cantidadClases} clases)`} v={formatoPesos(p.baseClases)} />
      <Fila
        k="Descuento 10%"
        v={p.descuento > 0 ? `-${formatoPesos(p.descuento)}` : formatoPesos(0)}
        nota={
          p.descuento > 0
            ? "Aplicado solo sobre la base de clases."
            : faltan > 0
              ? `Faltan ${faltan} clase(s) para el 10%. Los extras no cuentan.`
              : undefined
        }
        tono={p.descuento > 0 ? "verde" : undefined}
      />
      <Fila k="Extras" v={formatoPesos(p.totalExtras)} />
      <Fila
        k={`Traslado (${p.localidad})`}
        v={formatoPesos(p.recargoTraslado)}
        nota={`${clasesTraslado} clase(s) práctica(s) × ${formatoPesos(p.recargoPorClase)}`}
      />
      <div className="flex items-baseline justify-between border-t pt-3">
        <span className="text-base font-semibold text-foreground">Total</span>
        <span className="text-2xl font-bold tabular-nums text-primary" data-testid="total">
          {formatoPesos(p.total)}
        </span>
      </div>
    </div>
  );
}

function Fila({
  k,
  v,
  nota,
  tono,
}: {
  k: string;
  v: string;
  nota?: string;
  tono?: "verde";
}) {
  return (
    <div>
      <div className="flex justify-between gap-2">
        <span className="text-foreground">{k}</span>
        <span className={`tabular-nums font-medium ${tono === "verde" ? "text-success" : "text-foreground"}`}>
          {v}
        </span>
      </div>
      {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
    </div>
  );
}
