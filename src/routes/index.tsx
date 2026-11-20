import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Presupuestos-de-manejo-por-alumno_Vivir_125" },
      { name: "description", content: "Presupuestos de manejo por alumno – Vivir 125" },
      { property: "og:title", content: "Presupuestos-de-manejo-por-alumno_Vivir_125" },
      { property: "og:description", content: "Presupuestos de manejo por alumno – Vivir 125" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <h1 className="text-center text-2xl font-semibold text-foreground">
        Presupuestos-de-manejo-por-alumno_Vivir_125
      </h1>
    </main>
  );
}
