import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NOMBRE_ACADEMIA } from "@/lib/presupuestos/compartir";
import { SESION_KEY } from "@/lib/presupuestos/config";

import { Acceso } from "./Acceso";
import { AppDatosProvider, useAppDatos } from "./AppDatos";
import { Clientes } from "./Clientes";
import { NuevoPresupuesto } from "./NuevoPresupuesto";
import { PruebaGuiada } from "./PruebaGuiada";
import { Seguimiento } from "./Seguimiento";
import { VistaImprimible } from "./VistaImprimible";

type Vista =
  | { tipo: "seguimiento" }
  | { tipo: "clientes" }
  | { tipo: "nuevo"; clienteId?: string; presupuestoId?: string; clave: number }
  | { tipo: "prueba" };

const PESTANAS: { tipo: Vista["tipo"]; label: string }[] = [
  { tipo: "seguimiento", label: "Seguimiento" },
  { tipo: "nuevo", label: "Nuevo presupuesto" },
  { tipo: "clientes", label: "Clientes" },
  { tipo: "prueba", label: "Prueba guiada" },
];

function leerSesion(): boolean {
  try {
    return window.sessionStorage.getItem(SESION_KEY) === "1";
  } catch {
    return false;
  }
}

/** App completa. Se monta solo en el navegador (usa localStorage). */
export function PanelApp() {
  const [listo, setListo] = useState(false);
  const [dentro, setDentro] = useState(false);

  useEffect(() => {
    setDentro(leerSesion());
    setListo(true);
  }, []);

  if (!listo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando…
      </main>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      {dentro ? (
        <AppDatosProvider>
          <Panel
            onSalir={() => {
              try {
                window.sessionStorage.removeItem(SESION_KEY);
              } catch {
                /* sin sessionStorage */
              }
              setDentro(false);
            }}
          />
        </AppDatosProvider>
      ) : (
        <Acceso
          onEntrar={() => {
            try {
              window.sessionStorage.setItem(SESION_KEY, "1");
            } catch {
              /* sin sessionStorage: la sesión dura hasta recargar */
            }
            setDentro(true);
          }}
        />
      )}
    </>
  );
}

function Panel({ onSalir }: { onSalir: () => void }) {
  const { hoy, run } = useAppDatos();
  const [vista, setVista] = useState<Vista>({ tipo: "seguimiento" });
  const [imprimir, setImprimir] = useState<string | null>(null);
  // Cambia en cada reinicio para volver a montar las pantallas desde cero.
  const [reinicios, setReinicios] = useState(0);

  function reiniciar() {
    if (
      !window.confirm(
        "¿Reiniciar los datos de simulación? Se borran los clientes y presupuestos actuales y se cargan de nuevo los datos de ejemplo.",
      )
    )
      return;
    const r = run((repo) => repo.reiniciarDatos(hoy));
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setImprimir(null);
    setVista({ tipo: "seguimiento" });
    setReinicios((n) => n + 1);
    toast.success("Datos de simulación reiniciados.");
  }

  const irNuevo = (extra: { clienteId?: string; presupuestoId?: string } = {}) =>
    setVista({ tipo: "nuevo", clave: Date.now(), ...extra });

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-t-4 border-warning bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning font-bold text-primary"
              aria-hidden
            >
              V
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold sm:text-lg">{NOMBRE_ACADEMIA}</div>
              <div className="text-xs opacity-80">Presupuestos por alumno</div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button
              size="sm"
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={reiniciar}
              title="Borra los datos actuales y vuelve a cargar los datos de ejemplo"
            >
              Reiniciar datos
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/15 text-primary-foreground hover:bg-white/25"
              onClick={onSalir}
            >
              Salir
            </Button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-2" aria-label="Secciones">
          <ul className="flex min-w-max gap-1">
            {PESTANAS.map((t) => {
              const activa = vista.tipo === t.tipo;
              return (
                <li key={t.tipo}>
                  <button
                    type="button"
                    aria-current={activa ? "page" : undefined}
                    onClick={() => (t.tipo === "nuevo" ? irNuevo() : setVista({ tipo: t.tipo } as Vista))}
                    className={`border-b-4 px-3 py-2 text-sm font-medium transition-colors ${
                      activa
                        ? "border-warning font-semibold text-white"
                        : "border-transparent text-primary-foreground/80 hover:bg-white/10"
                    }`}
                  >
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main key={reinicios} className="no-print mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        {vista.tipo === "seguimiento" && (
          <Seguimiento onEditar={(id) => irNuevo({ presupuestoId: id })} onImprimir={setImprimir} />
        )}
        {vista.tipo === "clientes" && (
          <Clientes onNuevoPresupuesto={(id) => irNuevo({ clienteId: id })} onImprimir={setImprimir} />
        )}
        {vista.tipo === "nuevo" && (
          <NuevoPresupuesto
            key={vista.clave}
            clienteIdInicial={vista.clienteId}
            presupuestoId={vista.presupuestoId}
            onIrAlPanel={() => setVista({ tipo: "seguimiento" })}
            onNuevo={() => irNuevo()}
          />
        )}
        {vista.tipo === "prueba" && <PruebaGuiada />}
      </main>

      {imprimir && <VistaImprimible presupuestoId={imprimir} onCerrar={() => setImprimir(null)} />}
    </div>
  );
}
