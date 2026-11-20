import { createFileRoute } from "@tanstack/react-router";

import { PanelApp } from "@/components/presupuestos/PanelApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Presupuestos por alumno – Academia de Choferes Vivir 125" },
      {
        name: "description",
        content:
          "Panel de la secretaría para armar, enviar y hacer seguimiento de presupuestos de cursos de manejo por alumno.",
      },
      { property: "og:title", content: "Presupuestos por alumno – Academia de Choferes Vivir 125" },
      {
        property: "og:description",
        content: "Presupuestos de cursos de manejo por categoría de libreta, clases y zona de traslado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <PanelApp />;
}
