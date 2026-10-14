// =====================================================
// Gestor de Clientes - Puente de escritorio (spec 011, RF-902)
// =====================================================
// Expone window.gestorDatos al renderer con IPC síncrono (decisión de la spec:
// app.js arranca leyendo los datos de forma síncrona, así casi no cambia).
// El proceso aislado (contextIsolation) no toca Node ni el filesystem.

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
});
