import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NOMBRE_ACADEMIA } from "@/lib/presupuestos/compartir";
import { claveCorrecta } from "@/lib/presupuestos/config";

import { Aviso, Campo } from "./ui";

/** Pantalla de acceso: pide la contraseña del panel antes de entrar. */
export function Acceso({ onEntrar }: { onEntrar: () => void }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (claveCorrecta(clave)) {
      setError("");
      onEntrar();
    } else {
      setError("Contraseña incorrecta.");
      setClave("");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary to-warning" aria-hidden />
        <form onSubmit={enviar} className="space-y-5 px-6 py-6">
          <div className="space-y-1 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning text-lg font-bold text-primary">
              V
            </div>
            <h1 className="text-xl font-semibold text-foreground">{NOMBRE_ACADEMIA}</h1>
            <p className="text-sm text-muted-foreground">Panel de presupuestos de la secretaría</p>
          </div>

          <Campo label="Contraseña" htmlFor="clave">
            <Input
              id="clave"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              aria-invalid={!!error}
            />
          </Campo>
          {error && <Aviso tono="error">{error}</Aviso>}

          <Button type="submit" className="w-full">
            Entrar
          </Button>

          <Aviso tono="demo">
            <strong>Acceso de demostración.</strong> La contraseña está escrita en el código: no es
            autenticación real ni protege los datos. Los datos son de ejemplo y quedan solo en este
            navegador.
          </Aviso>
        </form>
      </div>
    </main>
  );
}
