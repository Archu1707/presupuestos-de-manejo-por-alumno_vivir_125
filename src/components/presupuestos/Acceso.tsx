import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLAVE_PANEL } from "@/lib/presupuestos/config";
import { NOMBRE_ACADEMIA } from "@/lib/presupuestos/compartir";

import { Aviso, Campo } from "./ui";

export function Acceso({ onEntrar }: { onEntrar: () => void }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (clave === CLAVE_PANEL) {
      setError("");
      onEntrar();
    } else {
      setError("Clave incorrecta.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <form
        onSubmit={enviar}
        className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            V
          </div>
          <h1 className="text-xl font-semibold text-foreground">{NOMBRE_ACADEMIA}</h1>
          <p className="text-sm text-muted-foreground">Panel de presupuestos de la secretaría</p>
        </div>

        <Campo label="Clave" htmlFor="clave">
          <Input
            id="clave"
            type="password"
            autoComplete="off"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            aria-invalid={!!error}
          />
        </Campo>
        {error && <Aviso tono="error">{error}</Aviso>}

        <Button type="submit" className="w-full">
          Entrar al panel
        </Button>

        <Aviso tono="demo">
          <strong>Acceso de demostración.</strong> La clave está escrita en el código: no es
          autenticación real ni protege los datos. Los datos quedan solo en este navegador.
        </Aviso>
      </form>
    </main>
  );
}
