import { Button } from "@/components/ui/button";
import { NOMBRE_ACADEMIA } from "@/lib/presupuestos/compartir";

import { Aviso } from "./ui";

/** Pantalla de entrada de la demo: sin clave, solo un botón para entrar. */
export function Acceso({ onEntrar }: { onEntrar: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-5 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary to-warning" aria-hidden />
        <div className="space-y-5 px-6 pb-6">
          <div className="space-y-1 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning text-lg font-bold text-primary">
              V
            </div>
            <h1 className="text-xl font-semibold text-foreground">{NOMBRE_ACADEMIA}</h1>
            <p className="text-sm text-muted-foreground">Panel de presupuestos de la secretaría</p>
          </div>

          <Button type="button" className="w-full" onClick={onEntrar} autoFocus>
            Entrar
          </Button>

          <Aviso tono="demo">
            <strong>Versión de demostración.</strong> No hay usuarios ni contraseñas. Los datos son
            de ejemplo y quedan solo en este navegador.
          </Aviso>
        </div>
      </div>
    </main>
  );
}
