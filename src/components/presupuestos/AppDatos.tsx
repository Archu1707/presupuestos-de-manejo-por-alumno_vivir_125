import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { hoyISO } from "@/lib/presupuestos/fechas";
import {
  APP_KEY,
  Repositorio,
  crearAlmacenEnMemoria,
  type Almacen,
  type AppData,
} from "@/lib/presupuestos/store";

interface Ctx {
  repo: Repositorio;
  data: AppData;
  hoy: string;
  /** Ejecuta una operación del repositorio y refresca la vista. */
  run: <T>(fn: (repo: Repositorio) => T) => T;
}

const AppDatosContext = createContext<Ctx | null>(null);

export function AppDatosProvider({ children }: { children: ReactNode }) {
  const [hoy] = useState(() => hoyISO());
  // Solo se crea en el navegador (este componente se monta después de hidratar).
  const [repo] = useState(() => {
    let almacen: Almacen;
    try {
      almacen = window.localStorage;
      almacen.getItem(APP_KEY);
    } catch {
      // Navegador sin localStorage (p. ej. modo privado estricto): se trabaja en memoria.
      almacen = crearAlmacenEnMemoria();
    }
    return new Repositorio(almacen, hoy);
  });
  const [, setVersion] = useState(0);

  const run = useCallback(
    <T,>(fn: (r: Repositorio) => T): T => {
      const res = fn(repo);
      setVersion((v) => v + 1);
      return res;
    },
    [repo],
  );

  const value = useMemo<Ctx>(
    () => ({ repo, data: repo.data, hoy, run }),
    // repo.data cambia de referencia en cada guardado confirmado
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repo, repo.data, hoy, run],
  );

  return <AppDatosContext.Provider value={value}>{children}</AppDatosContext.Provider>;
}

export function useAppDatos(): Ctx {
  const ctx = useContext(AppDatosContext);
  if (!ctx) throw new Error("useAppDatos fuera de AppDatosProvider");
  return ctx;
}
