// =====================================================
// Gestor de Clientes - Proceso principal de escritorio (spec 011, RF-902)
// =====================================================
// Proceso principal fino: solo crea la ventana y atiende el IPC síncrono de
// lectura/escritura del archivo de clientes. Toda la lógica de la app vive
// en la web de la raíz (index.html, app.js, logica.js), que aquí solo se carga.

const { app, BrowserWindow, ipcMain } = require("electron");
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

// =====================================================
// IPC síncrono: lectura del archivo (contrato de app.js, RF-902/RF-903)
// =====================================================
// - No existe          → { archivoExiste: false, clientes: null }
// - Es un array        → { archivoExiste: true,  clientes: <array> }
// - Dañado / no array  → se RENOMBRA (nunca se borra) a
//                        clientes-daños-AAAA-MM-DD.json y se devuelve
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
    // (los datos son sagrados, RF-903) y arrancar vacíos
    try {
      const destino = path.join(
        path.dirname(ruta),
        `clientes-daños-${selloFechaLocal(new Date())}.json`
      );
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
