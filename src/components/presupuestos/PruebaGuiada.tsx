import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ejecutarPruebaGuiada, type PasoPrueba } from "@/lib/presupuestos/pruebaGuiada";

import { useAppDatos } from "./AppDatos";
import { Aviso, Seccion } from "./ui";

export function PruebaGuiada() {
  const { data, hoy } = useAppDatos();
  const [pasos, setPasos] = useState<PasoPrueba[] | null>(null);
  const todoOk = pasos?.every((p) => p.ok);

  return (
    <Seccion titulo="Prueba guiada del descuento">
      <div className="space-y-4 text-sm">
        <p className="text-foreground">
          Comprueba la regla del 10%: con <strong>9 clases + 2 extras</strong> no hay descuento
          (los extras no cuentan para el umbral) y con <strong>10 clases</strong> sí, aplicado solo
          sobre la base de clases, con extras y traslado completos. También simula un fallo de
          guardado.
        </p>
        <Aviso>
          Trabaja sobre una <strong>copia aislada en memoria</strong> de tus datos: no crea ni
          modifica clientes o presupuestos reales. La misma prueba corre de forma automatizada con{" "}
          <code className="rounded bg-muted px-1">npm test</code>.
        </Aviso>
        <Button onClick={() => setPasos(ejecutarPruebaGuiada(data, hoy))}>Ejecutar prueba</Button>

        {pasos && (
          <>
            <ol className="space-y-2">
              {pasos.map((p, i) => (
                <li
                  key={i}
                  className={`rounded-md border px-3 py-2 ${
                    p.ok ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"
                  }`}
                >
                  <div className="font-semibold text-foreground">
                    {p.ok ? "✓" : "✗"} Paso {i + 1}: {p.titulo}
                  </div>
                  <div className="text-muted-foreground">{p.detalle}</div>
                </li>
              ))}
            </ol>
            <Aviso tono={todoOk ? "info" : "error"}>
              {todoOk ? "Todos los pasos pasaron." : "Hay pasos que fallaron."}
            </Aviso>
          </>
        )}
      </div>
    </Seccion>
  );
}
