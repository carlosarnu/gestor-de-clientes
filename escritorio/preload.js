// =====================================================
// Gestor de Clientes - Puente de escritorio (spec 011, RF-902)
// =====================================================
// Expone window.gestorDatos al renderer. Los datos usan IPC SÍNCRONO (decisión
// de la 011: app.js arranca leyendo los datos de forma síncrona) y el guardado
// del PDF (spec 017, RF-1506) usa IPC ASÍNCRONO (invoke/handle) porque
// showSaveDialog y printToPDF son promesas. El proceso aislado
// (contextIsolation) no toca Node ni el filesystem.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gestorDatos", {
  // → { archivoExiste: <boolean>, clientes: <array|null> }
  leer() {
    return ipcRenderer.sendSync("gestor-datos:leer");
  },

  // Escribe el JSON completo; si el proceso principal devolvió un error,
  // LANZA la excepción: así un fallo de escritura se comporta igual que un
  // fallo de cuota en la web (RF-802: nunca vacía la lista en memoria).
  escribir(contenido) {
    const respuesta = ipcRenderer.sendSync("gestor-datos:escribir", contenido);
    if (respuesta && typeof respuesta === "object") {
      throw new Error(respuesta.error || "No se pudo guardar el archivo");
    }
    return respuesta;
  },

  // Genera y guarda el PDF de la hoja con el diálogo nativo (spec 017, RF-1506).
  // nombreArchivo lo calcula el renderer (nombreArchivoPdf, fecha local) y aquí
  // solo viaja el nombre, nunca una ruta. → PROMESA con
  // { guardado, ruta } | { cancelado: true } | { error: "<mensaje>" }
  guardarPdf(nombreArchivo) {
    return ipcRenderer.invoke("gestor-datos:guardar-pdf", nombreArchivo);
  },
});
