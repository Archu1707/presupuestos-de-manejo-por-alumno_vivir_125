# Presupuestos por alumno – Academia de Choferes Vivir 125

App web para la secretaría de una academia de choferes: arma, envía y hace seguimiento de
presupuestos por alumno según categoría de libreta, tipo y cantidad de clases, extras y zona de
traslado.

> **Demo.** Los datos se guardan solo en el navegador (localStorage), son sintéticos y la app no
> contacta al negocio ni envía mensajes automáticamente.

Stack: **GitHub** (código) + **Lovable** (edición y vista previa) + **Vercel** (publicación).
TanStack Start + React + Tailwind CSS.

---

## Cómo correrlo

Requiere Node.js 20 o superior.

```sh
git clone https://github.com/Archu1707/presupuestos-de-manejo-por-alumno_vivir_125.git
cd presupuestos-de-manejo-por-alumno_vivir_125
npm install
npm run dev        # abre http://localhost:8080 (o el puerto que indique la consola)
```

Otros comandos:

| Comando           | Qué hace                                                    |
| ----------------- | ----------------------------------------------------------- |
| `npm test`        | Pruebas automatizadas (Vitest), incluida la del descuento   |
| `npm run build`   | Compila para producción                                     |
| `npm run preview` | Sirve la compilación localmente                             |

### Clave de acceso por defecto

`vivir125`

### Publicar en Vercel

1. En Vercel: **Add New → Project → Import** este repositorio de GitHub.
2. Vercel detecta **TanStack Start** solo (el proyecto usa
   `@lovable.dev/vite-tanstack-config` ≥ 2.6.2, que trae la detección automática). No hace falta
   cambiar comandos ni carpeta de salida.
3. **Deploy.** Cada push a `main` (desde aquí o desde Lovable) publica una versión nueva.

---

## Acceso al panel (no es autenticación real)

La pantalla de acceso pide una **clave simple escrita en el código**. Sirve para que nadie entre
por accidente, pero **no es seguridad**: cualquiera que lea el código fuente del sitio puede
verla, y los datos están en el navegador de cada persona. La propia pantalla lo aclara.

### Cómo cambiar la clave del panel

1. Abrí `src/lib/presupuestos/config.ts`.
2. Cambiá el valor de `CLAVE_PANEL`:

   ```ts
   export const CLAVE_PANEL = "nueva-clave";
   ```

3. Guardá, hacé commit y push (o pedíselo a Lovable). Vercel vuelve a publicar solo.

La sesión se guarda en `sessionStorage`, así que se cierra al cerrar la pestaña o con **Salir**.

---

## Cómo se preparan los datos sintéticos

- Archivo: `src/lib/presupuestos/semilla.ts`.
- Se cargan **solo la primera vez**: si en localStorage **no existe** la clave
  `vivir125.presupuestos.v1`. Si la clave existe (aunque esté vacía de clientes), no se toca.
- 8 clientes ficticios con correos `nombre.apellido@example.com` (dominio reservado para
  ejemplos) repartidos por las localidades del catálogo.
- 9 presupuestos en todos los estados. Las fechas se calculan **a partir del día de la primera
  carga**, así siempre hay casos útiles: uno Enviado hace 20 días (pasa a Vencido al abrir el
  panel), uno que vence en la semana, borradores, aceptados y rechazados.
- Los precios de la semilla se calculan con el mismo catálogo y la misma función de cálculo que
  usa la app.

**Para volver a cargar la semilla:** en el navegador, abrí las herramientas de desarrollo →
Application/Almacenamiento → Local Storage → borrá la clave `vivir125.presupuestos.v1` y recargá.

---

## Pantallas

- **Acceso**: campo "Clave" con el aviso de que no es autenticación real.
- **Clientes**: alta (Nombre, Correo, Localidad, Edad, ¿Cómo nos conoció?, Fecha de alta
  automática), lista con buscador y ficha con historial de presupuestos. Botones "Guardar cliente"
  y "Eliminar cliente".
- **Nuevo presupuesto**: cliente, categoría (A/G1/G2/G3/Automático), una o más líneas de clases
  (práctica 60/120 min, teórica, simulador) con cantidad, extras y localidad. Muestra en vivo base
  de clases, descuento, extras, traslado y total. Aviso "DEMO: guardar no contacta al negocio".
  Botones "Guardar borrador", "Marcar Enviado", "Compartir por WhatsApp" y "Copiar texto".
- **Seguimiento**: tabla (tarjetas en móvil) con filtros combinables Estado, Categoría, Localidad
  y "Vencen esta semana", contador de resultados y acciones según el estado.
- **Vista imprimible**: las mismas cifras guardadas que muestra el panel, lista para imprimir o
  guardar como PDF.
- **Prueba guiada**: ejecuta la verificación del descuento sobre una copia aislada de los datos.

## Reglas de negocio

| Regla | Dónde está |
| --- | --- |
| Clase 60 min: $U 900 (A/Automático), $U 700 (G1/G2/G3). 120 min = doble −5% | `catalog.ts` |
| Extras: gestión $U 1.500, simulador teórico $U 600, auto para el examen $U 2.000 | `catalog.ts` |
| Recargo por clase práctica: Costa/Solymar $U 0; Neptunia/Pinamar/Salinas $U 100; Marindia/El Fortín/Atlántida $U 150; Las Toscas/Parque del Plata $U 200 | `catalog.ts` |
| Descuento 10% con 10 clases o más, solo sobre la base de clases (los extras no cuentan para el umbral y nunca se descuentan; el traslado tampoco) | `calc.ts` |
| Precios congelados al guardar; duplicar usa precios vigentes | `modelo.ts`, `store.ts` |
| Enviado con más de 15 días corridos → Vencido al abrir el panel | `store.ts` (`vencerAutomaticos`) |
| Aceptado/Rechazado/Vencido no se editan; solo se duplican como Borrador | `store.ts` |
| Correo único (sin distinguir mayúsculas ni espacios), sin espacios, dominio example.com | `store.ts` (`validarCliente`) |
| No se borra un cliente con presupuestos en Borrador o Enviado | `store.ts` |
| Si falla el guardado, no se muestra éxito, se conserva el formulario y no avanza el correlativo | `store.ts` (`confirmar`) |
| Compartir solo prepara el texto (enlace `wa.me` o portapapeles); el envío es manual | `compartir.ts` |

### Supuestos a confirmar con la academia

- **Precio de clase teórica ($U 500) y de clase en simulador ($U 600)**: el brief no los fija.
  Están en `PRECIO_TEORICA` y `PRECIO_SIMULADOR` de `catalog.ts`.
- **El traslado se cobra solo por clases prácticas** (60 y 120 min), no por teóricas ni simulador.
- "Vencen esta semana" = presupuestos Enviados cuyo vencimiento cae de lunes a domingo de la
  semana actual.

## Pruebas

- **Automatizadas** (`npm test`): `src/lib/presupuestos/presupuestos.test.ts`. Incluyen
  "9 clases + 2 extras NO aplica 10%" y "10 clases SÍ, con extras y traslado completos", usando
  una copia aislada de datos en memoria. También cubren correo repetido, borrado bloqueado,
  vencimiento a los 15 días, edición bloqueada y duplicado, fallo de guardado, semilla y
  persistencia.
- **Guiada**: pestaña **Prueba guiada** → "Ejecutar prueba". Muestra cada paso con su resultado y
  confirma que los datos reales no cambiaron.

## Estructura

```
src/
  lib/presupuestos/      lógica sin interfaz (catálogo, cálculo, datos, semilla, compartir)
  components/presupuestos/  pantallas
  routes/index.tsx       punto de entrada de la app
```

## Compartir

Compartir el repositorio y el proyecto con **partners@kodarvia.com**
(GitHub → Settings → Collaborators → Add people).

---

Proyecto conectado a Lovable: los cambios en `main` se sincronizan con el
[editor de Lovable](https://lovable.dev/projects/fbed8d55-2536-4128-af60-47aadf0439fc).
