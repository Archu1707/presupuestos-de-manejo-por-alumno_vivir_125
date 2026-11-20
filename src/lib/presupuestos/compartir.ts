import { TIPO_CLASE_LABEL } from "./catalog";
import { formatoPesos } from "./calc";
import { formatoFecha } from "./fechas";
import { numeroPresupuesto, type Presupuesto } from "./modelo";

export const NOMBRE_ACADEMIA = "Academia de Choferes Vivir 125";

/**
 * Texto listo para que la secretaría lo envíe A MANO (WhatsApp, correo, etc.).
 * La app no envía nada automáticamente ni usa APIs de mensajería.
 */
export function textoPresupuesto(p: Presupuesto): string {
  const lineas: string[] = [];
  lineas.push(`*${NOMBRE_ACADEMIA}*`);
  lineas.push(
    `Presupuesto ${p.numero > 0 ? numeroPresupuesto(p.numero) : "(sin guardar)"} – ${p.clienteNombre}`,
  );
  lineas.push(`Categoría de libreta: ${p.categoria}`);
  lineas.push("");
  for (const c of p.clases) {
    lineas.push(
      `• ${c.cantidad} × ${TIPO_CLASE_LABEL[c.tipo]} (${formatoPesos(c.precioUnitario)} c/u): ${formatoPesos(
        c.cantidad * c.precioUnitario,
      )}`,
    );
  }
  lineas.push(`Base de clases: ${formatoPesos(p.baseClases)}`);
  if (p.descuento > 0) lineas.push(`Descuento 10% (10+ clases): -${formatoPesos(p.descuento)}`);
  for (const e of p.extras) lineas.push(`• ${e.nombre}: ${formatoPesos(e.precio)}`);
  if (p.recargoTraslado > 0)
    lineas.push(`Traslado (${p.localidad}): ${formatoPesos(p.recargoTraslado)}`);
  lineas.push("");
  lineas.push(`*Total: ${formatoPesos(p.total)}*`);
  if (p.vencimiento) lineas.push(`Válido hasta: ${formatoFecha(p.vencimiento)}`);
  return lineas.join("\n");
}

/** Enlace de WhatsApp que solo abre la app con el texto; el envío lo hace la persona. */
export function enlaceWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
