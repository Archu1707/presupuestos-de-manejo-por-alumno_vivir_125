import type { ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import type { Estado } from "@/lib/presupuestos/store";

export function Campo({
  label,
  htmlFor,
  children,
  ayuda,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  ayuda?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

/** Select nativo: funciona mejor en móviles que un desplegable a medida. */
export function SelectNativo({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className,
      )}
    />
  );
}

const ESTILO_ESTADO: Record<Estado, string> = {
  Borrador: "bg-muted text-muted-foreground border-border",
  Enviado: "bg-primary/10 text-primary border-primary/30",
  Aceptado: "bg-success/15 text-success border-success/40",
  Rechazado: "bg-destructive/10 text-destructive border-destructive/30",
  Vencido: "bg-warning/20 text-warning-foreground border-warning/50",
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        ESTILO_ESTADO[estado],
      )}
    >
      {estado}
    </span>
  );
}

export function Aviso({
  tono = "info",
  children,
}: {
  tono?: "info" | "demo" | "error";
  children: ReactNode;
}) {
  return (
    <div
      role={tono === "error" ? "alert" : "note"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        tono === "info" && "border-primary/30 bg-primary/5 text-foreground",
        tono === "demo" && "border-warning/60 bg-warning/15 text-foreground",
        tono === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      {children}
    </div>
  );
}

export function Seccion({
  titulo,
  acciones,
  children,
}: {
  titulo: string;
  acciones?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <span className="h-5 w-1.5 rounded-full bg-warning" aria-hidden />
          {titulo}
        </h2>
        {acciones}
      </div>
      {children}
    </section>
  );
}
