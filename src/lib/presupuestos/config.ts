/**
 * Contraseña del panel. Es una clave simple escrita en el código: NO es autenticación
 * real y cualquiera que vea el código fuente del sitio puede leerla.
 * Para cambiarla, editá este valor y volvé a publicar (ver README, "Acceso al panel").
 */
export const CLAVE_PANEL = "vivir125";

/** sessionStorage: la sesión se cierra al cerrar la pestaña o con "Salir". */
export const SESION_KEY = "vivir125.sesion";

/** Compara la clave ingresada con la del panel (ignora espacios al inicio y al final). */
export function claveCorrecta(ingresada: string): boolean {
  return ingresada.trim() === CLAVE_PANEL;
}
