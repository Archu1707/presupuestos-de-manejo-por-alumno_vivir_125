import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { NOMBRE_ACADEMIA } from "@/lib/presupuestos/compartir";
import { SESION_KEY } from "@/lib/presupuestos/config";

import { Acceso } from "./Acceso";
import { AppDatosProvider } from "./AppDatos";
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
  const [vista, setVista] = useState<Vista>({ tipo: "seguimiento" });
  const [imprimir, setImprimir] = useState<string | null>(null);

  const irNuevo = (extra: { clienteId?: string; presupuestoId?: string } = {}) =>
    setVista({ tipo: "nuevo", clave: Date.now(), ...extra });

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold sm:text-lg">{NOMBRE_ACADEMIA}</div>
            <div className="text-xs opacity-80">Presupuestos por alumno</div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 bg-white/15 text-primary-foreground hover:bg-white/25"
            onClick={onSalir}
          >
            Salir
          </Button>
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
                    className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
                      activa
                        ? "bg-background text-primary"
                        : "text-primary-foreground/85 hover:bg-white/10"
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

      <main className="no-print mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
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
