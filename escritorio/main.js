// =====================================================
// Gestor de Clientes - Proceso principal de escritorio (spec 011, RF-902)
// =====================================================
// Proceso principal fino: crea la ventana, atiende el IPC síncrono de
// lectura/escritura del archivo de clientes (spec 011) y el IPC ASÍNCRONO de
// guardado del PDF de la hoja (spec 017, RF-1506). Toda la lógica de la app
// vive en la web de la raíz (index.html, app.js, logica.js), que aquí se carga.

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Ruta única de los datos: Documentos\Gestor de Clientes\clientes.json
function rutaArchivoClientes() {
  return path.join(app.getPath("documents"), "Gestor de Clientes", "clientes.json");
}

// Sello de fecha LOCAL con dobles dígitos: AAAA-MM-DD
function selloFechaLocal(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Ruta libre para guardar un clientes.json dañado (revisión global, M3): patrón
// «clientes-daños-AAAA-MM-DD.json» y, si ese destino YA EXISTE, contador «-2»,
// «-3»… — fs.renameSync en Windows SOBRESCRIBE el destino, así que un segundo
// daño el mismo día destruiría la primera copia dañada. El fichero dañado
// NUNCA se borra: solo se mueve a un nombre que nadie ocupa.
function rutaCopiaDania(directorio, sello) {
  const base = `clientes-daños-${sello}`;
  let nombre = `${base}.json`;
  let contador = 2;
  while (fs.existsSync(path.join(directorio, nombre))) {
    nombre = `${base}-${contador}.json`;
    contador += 1;
  }
  return path.join(directorio, nombre);
}

// =====================================================
// IPC síncrono: lectura del archivo (contrato de app.js, RF-902/RF-903)
// =====================================================
// - No existe          → { archivoExiste: false, clientes: null }
// - Es un array        → { archivoExiste: true,  clientes: <array> }
// - Dañado / no array  → se RENOMBRA (nunca se borra) a
//                        clientes-daños-AAAA-MM-DD.json — o con sufijo «-2»,
//                        «-3»… si ese nombre ya está ocupado — y se devuelve
//                        { archivoExiste: true, clientes: null }
ipcMain.on("gestor-datos:leer", (event) => {
  const ruta = rutaArchivoClientes();

  let contenido;
  try {
    contenido = fs.readFileSync(ruta, "utf8");
  } catch (error) {
    // Sin archivo (ENOENT) → la app arranca vacía; cualquier otro fallo de
    // lectura tampoco debe tumbar el arranque, pero avisamos de que había algo
    const archivoExiste = !(error && error.code === "ENOENT");
    event.returnValue = { archivoExiste, clientes: null };
    return;
  }

  let clientes = null;
  try {
    const datos = JSON.parse(contenido);
    if (Array.isArray(datos)) clientes = datos;
  } catch (error) {
    clientes = null; // JSON irreparable
  }

  if (clientes === null) {
    // Archivo dañado o que no es una lista: renombrarlo para conservarlo
    // (los datos son sagrados, RF-903) y arrancar vacíos. El destino NUNCA
    // existirá: un segundo daño el mismo día no pisa la copia anterior (M3)
    try {
      const destino = rutaCopiaDania(path.dirname(ruta), selloFechaLocal(new Date()));
      fs.renameSync(ruta, destino);
    } catch (error) {
      // Si el renombrado fallara, se intenta seguir igual: la app arranca vacía
    }
    event.returnValue = { archivoExiste: true, clientes: null };
    return;
  }

  event.returnValue = { archivoExiste: true, clientes };
});

// =====================================================
// IPC síncrono: escritura del archivo (RF-902)
// =====================================================
// Devuelve null si va bien y { error: "<mensaje>" } si algo falla; el preload
// convierte ese objeto en una excepción para que el fallo de escritura se
// comporte igual que un fallo de cuota en la web.
ipcMain.on("gestor-datos:escribir", (event, contenido) => {
  try {
    const ruta = rutaArchivoClientes();
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, contenido, "utf8");
    event.returnValue = null;
  } catch (error) {
    event.returnValue = {
      error: error && error.message ? error.message : String(error),
    };
  }
});

// =====================================================
// IPC ASÍNCRONO: guardar el PDF de la hoja (spec 017, RF-1506)
// =====================================================
// Los IPC síncronos de la 011 no sirven aquí: showSaveDialog y printToPDF son
// PROMESAS. Contrato de resultado (igual que el de la 011 pero como promesa):
//   { guardado: true, ruta } | { cancelado: true } | { error: "<mensaje>" }
// Recorrido: PRIMERO el diálogo de guardado, DESPUÉS el PDF — cancelar no gasta
// la generación y la convención de los diálogos nativos es no avisar al hacerlo.
// El nombre por defecto lo calcula el renderer con nombreArchivoPdf (lógica
// pura testada, RF-1512); aquí solo se confía su basename (defensa: el proceso
// principal no acepta rutas del renderer, solo un nombre de fichero).
// clientes.json NO se lee ni se escribe: el PDF es presentación pura (RF-1511).
ipcMain.handle("gestor-datos:guardar-pdf", async (event, nombreArchivo) => {
  const ventana = BrowserWindow.fromWebContents(event.sender);

  // Carpeta propuesta: la de los datos (Documentos\Gestor de Clientes), creada
  // si no existe (cubre el flujo web→app donde aún no hay clientes.json); si
  // no se pudiera crear, se propone la carpeta de Documentos del usuario.
  const carpeta = path.dirname(rutaArchivoClientes());
  try {
    fs.mkdirSync(carpeta, { recursive: true });
  } catch (error) {
    // Se propone app.getPath("documents") más abajo
  }
  const carpetaPropuesta = fs.existsSync(carpeta) ? carpeta : app.getPath("documents");

  // Solo un basename defensivo: un nombre vacío cae a «listado.pdf»
  const nombre = path.basename(String(nombreArchivo || "")) || "listado.pdf";

  try {
    const respuesta = await dialog.showSaveDialog(ventana, {
      defaultPath: path.join(carpetaPropuesta, nombre),
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    // Usuario canceló (o cerró el cuadro): sin escribir nada y sin aviso
    if (respuesta.canceled || !respuesta.filePath) {
      return { cancelado: true };
    }

    // A4 como el papel del navegador (Decisión 7 de la 017). printBackground:
    // TRUE — aquí NO hay usuario que active «Gráficos de fondo» como en el
    // diálogo del navegador de la 013: la generación es silente y sin opción,
    // así que para que el PDF sea fiel a la hoja de la vista previa (RF-1506,
    // «mismo contenido que la vista previa») los fondos (badges de tipo,
    // tintes) deben salir sí o sí. Decisión de la T-05 documentada en el acta.
    const datos = await ventana.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
    });

    // Escritura con fs.promises (handler async, no se bloquea el proceso
    // principal); un fallo (ruta no writable, disco lleno…) cae al catch y se
    // devuelve { error } para que el renderer avise en la barra de la previa
    await fs.promises.writeFile(respuesta.filePath, datos);

    return { guardado: true, ruta: respuesta.filePath };
  } catch (error) {
    return {
      error: "No se pudo generar el PDF: " +
        (error && error.message ? error.message : String(error)),
    };
  }
});

// =====================================================
// Ventana y ciclo de vida
// =====================================================
function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 380,
    title: "Gestor de Clientes",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // En desarrollo la web está en la raíz del proyecto; una vez empaquetada,
  // electron-builder la copia a la raíz de resources (extraResources)
  const rutaWeb = app.isPackaged
    ? path.join(process.resourcesPath, "index.html")
    : path.join(__dirname, "..", "index.html");

  ventana.loadFile(rutaWeb);
  return ventana;
}

app.whenReady().then(() => {
  crearVentana();

  // macOS: reabrir la ventana al pulsar el icono del dock
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

// Cierre limpio: al quedarse sin ventanas se sale (Windows/Linux);
// sin auto-update, sin menús y sin nada más (spec 011, fuera de alcance).
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
