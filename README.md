# Presupuestos por alumno – Academia de Choferes Vivir 125

App web para la secretaría de una academia de choferes: arma, envía y hace seguimiento de
presupuestos por alumno según categoría de libreta, tipo y cantidad de clases, extras y zona de
traslado.

> **Demo.** Los datos se guardan solo en el navegador (localStorage), son sintéticos y la app no
> contacta al negocio ni envía mensajes automáticamente.

Diseño: azul `#1D4E89` como color principal y ámbar `#F2A900` como segundo color de marca
(franjas, pestaña activa, logo, títulos de sección y botones secundarios), con verde `#2E9E5B` y
rojo `#D64545` para estados.

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

### Publicar en Vercel

1. En Vercel: **Add New → Project → Import** este repositorio de GitHub.
2. Vercel detecta **TanStack Start** solo (el proyecto usa
   `@lovable.dev/vite-tanstack-config` ≥ 2.6.2, que trae la detección automática). No hace falta
   cambiar comandos ni carpeta de salida.
3. **Deploy.** Cada push a `main` (desde aquí o desde Lovable) publica una versión nueva.

---

## Acceso a la demo

Esta versión de demostración **no tiene contraseña ni usuarios**: la pantalla de inicio solo tiene
un botón **Entrar**. La sesión se guarda en `sessionStorage` y se cierra al cerrar la pestaña o con
**Salir**. Si en el futuro hace falta controlar el acceso, debe hacerse con autenticación real
(por ejemplo Supabase Auth), no con una clave escrita en el código.

---

## Datos de simulación

La demo trabaja solo con **datos sintéticos** guardados en el navegador. No hay base de datos ni
servidor: cada navegador (y cada dispositivo) tiene su propia copia de los datos.

### Dónde se guardan

| Clave | Almacenamiento | Qué contiene |
| --- | --- | --- |
| `vivir125.presupuestos.v1` | `localStorage` | Clientes, presupuestos y el correlativo (último número de presupuesto usado) |
| `vivir125.sesion` | `sessionStorage` | Marca de que se pulsó **Entrar** (se borra al cerrar la pestaña o con **Salir**) |

### Cómo se preparan

- Archivo: `src/lib/presupuestos/semilla.ts` (función `crearSemilla(hoy)`).
- Se cargan **solo la primera vez**: si en localStorage **no existe** la clave
  `vivir125.presupuestos.v1`. Si la clave existe (aunque esté vacía de clientes), no se toca.
- Las personas son ficticias y los correos usan `example.com`, un dominio reservado para ejemplos.
- Las fechas son **relativas al día de la carga** (alta, creación, envío y vencimiento se
  calculan como "hace N días"), así la demo siempre tiene casos útiles sin importar cuándo se abra.
- Los precios se calculan con el mismo catálogo (`catalog.ts`) y la misma función de cálculo
  (`calc.ts`) que usa la app, así que los totales de ejemplo siguen las reglas de negocio.

### Datos de ejemplo incluidos

**8 clientes**

| Nombre | Correo | Localidad | Edad | ¿Cómo nos conoció? | Alta |
| --- | --- | --- | --- | --- | --- |
| Lucía Fernández | lucia.fernandez@example.com | Solymar | 19 | Redes | hace 40 días |
| Martín Rodríguez | martin.rodriguez@example.com | Atlántida | 34 | Recomendación | hace 35 días |
| Valentina Pérez | valentina.perez@example.com | Neptunia | 22 | Cartel | hace 28 días |
| Santiago Gómez | santiago.gomez@example.com | Parque del Plata | 45 | Redes | hace 25 días |
| Camila Silva | camila.silva@example.com | Costa | 18 | Recomendación | hace 20 días |
| Diego Martínez | diego.martinez@example.com | Salinas | 27 | Otro | hace 12 días |
| Florencia Sosa | florencia.sosa@example.com | Las Toscas | 31 | Redes | hace 8 días |
| Joaquín Núñez | joaquin.nunez@example.com | Marindia | 52 | Cartel | hace 3 días |

**9 presupuestos** (la localidad de traslado es la del cliente)

| N.º | Cliente | Cat. | Clases | Extras | Estado al cargar | Enviado | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P-0001 | Lucía Fernández | A | 10 × Práctica 60 | Gestión del trámite | Aceptado | hace 37 días | $U 9.600 |
| P-0002 | Martín Rodríguez | G1 | 3 × Práctica 60 | — | Vencido | hace 33 días | $U 2.550 |
| P-0003 | Santiago Gómez | G3 | 12 × Práctica 60 + 2 × Simulador | — | Rechazado | hace 23 días | $U 11.040 |
| P-0004 | Martín Rodríguez | G1 | 4 × Práctica 120 + 2 × Teórica | Auto para el examen | Enviado → **Vencido** al abrir el panel | hace 20 días | $U 8.920 |
| P-0005 | Florencia Sosa | G2 | 5 × Práctica 120 | Gestión del trámite | Enviado (vence en 1 día) | hace 14 días | $U 9.150 |
| P-0006 | Valentina Pérez | Automático | 8 × Práctica 60 | Gestión, Simulador teórico | Enviado (vence en 3 días) | hace 12 días | $U 10.100 |
| P-0007 | Camila Silva | G1 | 6 × Práctica 60 | Simulador teórico | Enviado | hace 3 días | $U 4.800 |
| P-0008 | Diego Martínez | A | 9 × Práctica 60 | Gestión, Auto para el examen | Borrador (sin descuento: 9 clases) | — | $U 12.500 |
| P-0009 | Joaquín Núñez | Automático | 15 × Práctica 60 | Gestión, Simulador teórico, Auto para el examen | Borrador (con 10%) | — | $U 18.500 |

Con estos datos se puede probar todo: el vencimiento automático (P-0004), el filtro "Vencen
esta semana" (P-0005 y P-0006, según el día), el descuento en el límite (P-0008 con 9 clases y
P-0009 con 15), el duplicado de presupuestos cerrados (P-0001 a P-0003) y el bloqueo al eliminar
clientes con presupuestos abiertos. El próximo presupuesto que se cree será el **P-0010**.

---

## Reiniciar la simulación

### Opción 1: botón "Reiniciar datos" (recomendada)

1. Entrá al panel con **Entrar**.
2. Pulsá **Reiniciar datos** (botón ámbar, arriba a la derecha, junto a **Salir**).
3. Confirmá el aviso del navegador.
4. Aparece el mensaje "Datos de simulación reiniciados." y la app vuelve a la pestaña
   **Seguimiento** con los 8 clientes y 9 presupuestos de ejemplo.

**Qué se reinicia:**

- Se borran **todos** los clientes y presupuestos creados, editados, enviados o eliminados
  durante la demo.
- Se vuelven a cargar los datos de ejemplo con fechas calculadas **desde el día de hoy**.
- El correlativo vuelve a 9 (el siguiente presupuesto será P-0010).
- Al volver al panel, P-0004 pasa a Vencido otra vez, como en la primera carga.

**Qué no cambia:**

- La sesión sigue abierta (no hace falta volver a pulsar **Entrar**).
- Los precios, extras y recargos del catálogo (`catalog.ts`) no se tocan.
- Solo afecta a este navegador: otros navegadores o dispositivos conservan sus propios datos.

> El reinicio no se puede deshacer. Si el navegador no deja guardar (por ejemplo, almacenamiento
> lleno o bloqueado), se muestra un error y los datos quedan como estaban.

### Opción 2: desde las herramientas del navegador

Útil si la app no carga o se quiere empezar de cero sin entrar al panel.

1. Abrí la app y las herramientas de desarrollo (F12 o clic derecho → Inspeccionar).
2. Pestaña **Application** (Chrome/Edge) o **Almacenamiento** (Firefox) → **Local Storage** →
   el dominio de la app.
3. Borrá la clave `vivir125.presupuestos.v1` y recargá la página.

O, en la pestaña **Console**:

```js
localStorage.removeItem("vivir125.presupuestos.v1");
location.reload();
```

Para cerrar también la sesión de la demo, borrá además `vivir125.sesion` en **Session Storage**
(o pulsá **Salir**).

### Cambiar los datos de ejemplo

1. Editá las listas `CLIENTES` y `PRESUPUESTOS` en `src/lib/presupuestos/semilla.ts`
   (los días se indican como "hace N días": `altaHaceDias`, `creadoHaceDias`, `enviadoHaceDias`).
2. Usá solo localidades, categorías, tipos de clase y extras que existan en `catalog.ts`, y
   correos `@example.com` sin repetir.
3. Subí el cambio (o pedíselo a Lovable) y, en cada navegador donde ya se usó la demo, pulsá
   **Reiniciar datos** para ver la nueva semilla.
4. Corré `npm test`: la prueba "reiniciar datos vuelve a la semilla y se guarda" y el resto
   deben seguir pasando.

---

## Pantallas

- **Inicio**: botón "Entrar" (demo sin contraseña).
- **Reiniciar datos**: botón en la cabecera que vuelve a cargar los datos de simulación (ver
  [Reiniciar la simulación](#reiniciar-la-simulación)).
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
- **Prueba guiada**: verifica el descuento, el vencimiento a los 15 días y el fallo de guardado
  sobre una copia aislada de los datos.

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

### Prueba guiada (en la app)

Pestaña **Prueba guiada** → **Ejecutar prueba**. Trabaja sobre una **copia aislada en memoria** de
los datos (no crea ni modifica clientes o presupuestos reales) y muestra cada paso con ✓ o ✗:

| Paso | Qué comprueba | Resultado esperado |
| --- | --- | --- |
| 1 | Copia aislada de datos | Se copian los datos y se crea un cliente de prueba en Neptunia |
| 2 | 9 clases + 2 extras (categoría A, Neptunia) | Sin descuento: base $U 8.100, extras $U 2.100, traslado $U 900, total $U 11.100 |
| 3 | 10 clases + 2 extras | 10% solo sobre clases: base $U 9.000, descuento $U 900, extras $U 2.100 y traslado $U 1.000 completos, total $U 11.200 |
| 4 | Vencimiento | Un presupuesto Enviado hace 15 días sigue **Enviado**; uno enviado hace 16 días pasa a **Vencido** al revisar el panel |
| 5 | Fallo de guardado simulado | No se muestra éxito y el correlativo no avanza |
| 6 | Datos reales | Siguen sin cambios después de la prueba |

Las fechas del paso 4 se calculan desde el día en que se ejecuta, así que la prueba da el mismo
resultado cualquier día.

### Pruebas automatizadas

`npm test` corre `src/lib/presupuestos/presupuestos.test.ts` (Vitest), también sobre datos aislados
en memoria. Ejecuta la misma prueba guiada (los 6 pasos deben pasar, incluido el de vencimiento) y
además cubre: descuento con 9 y 10 clases, extras que no cuentan para el umbral, precio de 120 min,
correo repetido, dominio y espacios en el correo, borrado bloqueado, vencimiento en el día 15 y 16,
edición bloqueada y duplicado, fallo de guardado, semilla, reinicio de datos y persistencia.

### Cómo verificar el vencimiento a los 15 días

Regla: un presupuesto **Enviado** con **más de 15 días corridos** desde su envío pasa a
**Vencido** al abrir el panel de **Seguimiento** (el día 15 todavía está Enviado; el 16 ya no).

1. **Prueba guiada**: paso 4 (ver arriba). Es la forma más rápida y no toca tus datos.
2. **Datos de ejemplo**: pulsá **Reiniciar datos**. P-0004 (enviado hace 20 días) aparece como
   **Vencido** con el aviso "1 presupuesto(s) pasaron a Vencido", mientras que P-0005 (enviado hace
   14 días) sigue **Enviado**.
3. **Con un presupuesto propio**: crealo y pulsá **Marcar Enviado**. Después, en la consola del
   navegador (F12 → Console), mové su fecha de envío 16 días atrás y recargá:

   ```js
   const k = "vivir125.presupuestos.v1", d = JSON.parse(localStorage.getItem(k));
   const p = d.presupuestos.filter((x) => x.estado === "Enviado").sort((a, b) => b.numero - a.numero)[0];
   const f = new Date(); f.setDate(f.getDate() - 16); p.fechaEnvio = f.toLocaleDateString("sv");
   localStorage.setItem(k, JSON.stringify(d)); location.reload();
   ```

   Al abrir **Seguimiento** pasa a **Vencido**. Con `-15` en lugar de `-16` sigue **Enviado**.
   Al terminar, **Reiniciar datos** deja todo como al principio.
4. **Automatizada**: `npm test` (pruebas "Enviado con más de 15 días corridos pasa a Vencido" y
   "la prueba guiada pasa completa").

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
