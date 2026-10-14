// =====================================================
// Gestor de Clientes - JavaScript
// =====================================================

// Clave que usamos para guardar los datos en el navegador
const CLAVE_STORAGE = "gestorClientes";

// Modo de datos (spec 011, RF-902): en la app de escritorio (Electron) el puente
// window.gestorDatos (contextBridge + IPC síncrono) es la fuente única de verdad
// (Documentos\Gestor de Clientes\clientes.json) y NO se usa localStorage;
// en la web no existe el puente y todo sigue exactamente como siempre.
const EN_ESCRITORIO = typeof window.gestorDatos !== "undefined";

// Elementos de la página
const formulario = document.getElementById("formulario-cliente");
const listaClientes = document.getElementById("lista-clientes");
const contador = document.getElementById("contador");
const contenedorFiltros = document.getElementById("filtros");
const tituloFormulario = document.getElementById("titulo-formulario");
const botonGuardar = document.getElementById("boton-guardar");
const botonCancelar = document.getElementById("boton-cancelar");
const panelFormulario = document.getElementById("panel-formulario");
const aviso = document.getElementById("toast");
const campoBuscador = document.getElementById("buscador");

// Copia de seguridad (spec 011, RF-901)
const botonExportar = document.getElementById("boton-exportar");
const botonImportar = document.getElementById("boton-importar");
const archivoImportar = document.getElementById("archivo-importar");
const panelConfirmacionImportar = document.getElementById("confirmacion-importacion");
const textoConfirmacionImportar = document.getElementById("confirmacion-importacion-texto");
const botonReemplazar = document.getElementById("boton-reemplazar");
const botonCancelarImportacion = document.getElementById("boton-cancelar-importacion");

// Estado de la aplicación
// ¿Existía el archivo de datos al arrancar? Solo tiene sentido en escritorio:
// sirve para el mensaje de migración en 2 clics (spec 011, RF-903). Se declara
// ANTES de cargarClientes() porque esa función lo rellena al arrancar.
let archivoInicialExiste = false;
let clientes = cargarClientes();
let filtroActivo = "Todos";
let textoBusqueda = ""; // texto del buscador (spec 005)
let clienteEditandoId = null; // id del cliente en edición, o null si no se está editando
let confirmandoEliminarId = null; // id de la tarjeta mostrando "¿Seguro?", o null si no hay ninguna
let importacionPendiente = null; // clientes del fichero esperando confirmación, o null
let temporizadorAviso = null;

// =====================================================
// Guardar y cargar datos
// =====================================================

function cargarClientes() {
  // ===== Escritorio (spec 011, RF-902/RF-903): fuente única = clientes.json =====
  if (EN_ESCRITORIO) {
    const archivo = window.gestorDatos.leer();
    archivoInicialExiste = Boolean(archivo && archivo.archivoExiste);

    // Si el archivo estaba dañado, el proceso principal ya lo renombró a
    // «clientes-daños-…json» (RF-903) y llega clientes: null → arrancamos vacíos.
    // Si no existía (archivoExiste: false) también llega null → lista vacía.
    const lista = archivo && Array.isArray(archivo.clientes) ? archivo.clientes : [];

    // Migración spec 009 («FOAM» → «Espuma») también al leer el archivo (RF-902).
    // Si hubo cambio, lo escribimos en el archivo; un fallo de escritura NUNCA
    // vacía la lista (mismo criterio RF-802 que en la web).
    const migrada = migrarTipos(lista);
    if (migrada !== lista) {
      try {
        window.gestorDatos.escribir(JSON.stringify(migrada));
      } catch (error) {
        // La lista en memoria sigue siendo la correcta
      }
    }
    return migrada;
  }

  // ===== Web: comportamiento original intacto (RF-802) =====
  // 1) Lectura y parseo: si fallan, empezamos de cero (RF-802)
  let lista;
  try {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    lista = datos ? JSON.parse(datos) : [];
  } catch (error) {
    // Si los datos están corruptos, empezamos de cero
    return [];
  }

  // Migración spec 009: el tipo antiguo «FOAM» pasa a «Espuma» (solo si hay cambio)
  const migrada = migrarTipos(Array.isArray(lista) ? lista : []);
  if (migrada !== lista) {
    // 2) Escritura de la migración en su propio try: si falla (p. ej. cuota llena)
    // seguimos con los datos leídos en memoria; un fallo de escritura NUNCA vacía la lista (RF-802)
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(migrada));
    } catch (error) {
      // No se escribe nada; la lista en memoria sigue siendo la correcta
    }
  }
  return migrada;
}

function guardarClientes() {
  // Punto único de escritura (spec 011, RF-902): en escritorio se escribe el
  // JSON completo en clientes.json (el puente crea la carpeta si no existe);
  // en la web, localStorage como siempre.
  if (EN_ESCRITORIO) {
    window.gestorDatos.escribir(JSON.stringify(clientes));
    // Ya hay archivo (lo acabamos de crear o actualizar): el aviso de migración
    // deja de proceder aunque después se vacíe la lista (RF-903)
    archivoInicialExiste = true;
    return;
  }
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(clientes));
}

// =====================================================
// Formulario
// =====================================================

// Campo «Escribe el tipo»: solo existe con la opción «Otros» (spec 008, RF-602)
const campoTipoOtro = document.getElementById("campo-tipo-otro");
const tipoOtro = document.getElementById("tipo-otro");

function sincronizarTipoOtro() {
  const esOtros = formulario.tipo.value === "Otros";
  campoTipoOtro.hidden = !esOtros;
  if (!esOtros) tipoOtro.value = "";
}

// Reset del formulario que también oculta el tipo personalizado
function resetearFormulario() {
  formulario.reset();
  sincronizarTipoOtro();
}

formulario.tipo.addEventListener("change", sincronizarTipoOtro);

// Carga el tipo del cliente en el desplegable (los tipos escritos a mano
// vuelven como «Otros» con su texto, RF-605)
function cargarTipoEnFormulario(tipo) {
  const valor = texto(tipo);
  if (valor !== "" && !esTipoFijo(valor)) {
    formulario.tipo.value = "Otros";
    tipoOtro.value = valor === "Otros" ? "" : valor;
  } else {
    formulario.tipo.value = valor; // uno de los tres fijos o el hueco vacío
    tipoOtro.value = "";
  }
  sincronizarTipoOtro();
}

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  // Validación extra por si acaso (el navegador ya valida lo básico)
  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  const datos = new FormData(formulario);

  // «Otros»: el tipo es lo escrito a mano (o «Otros» si el hueco queda vacío) (RF-602)
  if (datos.get("tipo") === "Otros") {
    datos.set("tipo", texto(tipoOtro.value) || "Otros");
  }

  // Si estamos en modo edición, guardamos los cambios y salimos
  if (clienteEditandoId !== null) {
    guardarEdicion(datos);
    return;
  }

  clientes.push(construirCliente(datos, Date.now(), Date.now()));
  guardarClientes();

  // Alta con feedback (spec 010, RF-801): buscador limpio y aviso «Cliente guardado».
  // La limpieza va antes de pintarFiltros/pintarLista para que la lista se pinte sin filtro de texto
  textoBusqueda = "";
  campoBuscador.value = "";
  pintarAviso(mensajeAviso("guardado"));

  // Limpiamos el formulario y volvemos a la pestaña "Todos"
  resetearFormulario();
  filtroActivo = "Todos";
  pintarFiltros();
  pintarLista();
});

// =====================================================
// Filtros
// =====================================================

contenedorFiltros.addEventListener("click", function (evento) {
  const boton = evento.target.closest(".filtro");
  if (!boton) return;

  filtroActivo = boton.dataset.filtro;
  pintarFiltros();
  pintarLista();
});

function pintarFiltros() {
  const botones = contenedorFiltros.querySelectorAll(".filtro");
  botones.forEach(function (boton) {
    boton.classList.toggle("activo", boton.dataset.filtro === filtroActivo);
  });
}

// =====================================================
// Buscador por texto (spec 005)
// =====================================================

// Filtra en vivo mientras escribe; no se borra al cambiar de filtro ni al editar
campoBuscador.addEventListener("input", function () {
  textoBusqueda = campoBuscador.value;
  pintarLista();
});

// =====================================================
// Edición de clientes (la lógica pura vive en logica.js)
// =====================================================

function iniciarEdicion(id) {
  const cliente = buscarCliente(clientes, id);
  if (!cliente) return;

  clienteEditandoId = id;
  confirmandoEliminarId = null;

  // Cargamos los datos actuales del cliente en el formulario
  formulario.empresa.value = cliente.empresa || "";
  formulario.cif.value = cliente.cif || "";
  formulario.contacto.value = cliente.contacto || "";
  formulario.telefono.value = cliente.telefono || "";
  formulario.movil.value = cliente.movil || "";
  formulario.email.value = cliente.email || "";
  formulario.direccion.value = cliente.direccion || "";
  formulario.codigoPostal.value = cliente.codigoPostal || "";
  cargarTipoEnFormulario(cliente.tipo);
  formulario.notas.value = cliente.notas || "";

  pintarFormularioModo();
  pintarLista();

  // Subimos la vista hasta el formulario (cómodo en móvil);
  // respetamos a quien tenga el movimiento reducido en el sistema
  const movimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  panelFormulario.scrollIntoView({ behavior: movimiento, block: "start" });
}

// Sincroniza el formulario según estemos editando o creando
function pintarFormularioModo() {
  const editando = clienteEditandoId !== null;
  tituloFormulario.textContent = editando ? "Editar cliente" : "Nuevo cliente";
  botonGuardar.textContent = editando ? "Guardar cambios" : "Guardar cliente";
  botonCancelar.hidden = !editando;
  panelFormulario.classList.toggle("modo-edicion", editando);
}

function cancelarEdicion() {
  clienteEditandoId = null;
  resetearFormulario();
  pintarFormularioModo();
  pintarLista();
}

function guardarEdicion(datos) {
  const cliente = buscarCliente(clientes, clienteEditandoId);
  if (!cliente) {
    cancelarEdicion();
    return;
  }

  // Actualizamos los 12 campos conservando id y fecha originales (ver logica.js)
  clientes = aplicarEdicion(clientes, clienteEditandoId, datos);
  guardarClientes();

  clienteEditandoId = null;
  resetearFormulario();
  pintarFormularioModo();
  pintarLista();
  pintarAviso(mensajeAviso("actualizado"));
}

botonCancelar.addEventListener("click", cancelarEdicion);

// =====================================================
// Eliminar clientes
// =====================================================

function eliminarCliente(id) {
  clientes = eliminarClienteDe(clientes, id);

  // Si el cliente eliminado era el que se estaba editando, salimos del modo edición
  if (clienteEditandoId === id) {
    clienteEditandoId = null;
    resetearFormulario();
    pintarFormularioModo();
  }

  confirmandoEliminarId = null;
  guardarClientes();
  pintarLista();
  pintarAviso(mensajeAviso("eliminado"));
}

// Clics dentro de la lista (Editar / Eliminar / Sí / No)
listaClientes.addEventListener("click", function (evento) {
  const boton = evento.target.closest("[data-accion]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === "editar") {
    iniciarEdicion(id);
  } else if (accion === "eliminar") {
    confirmandoEliminarId = id;
    pintarLista();
  } else if (accion === "confirmar-si") {
    eliminarCliente(id);
  } else if (accion === "confirmar-no") {
    confirmandoEliminarId = null;
    pintarLista();
  }
});

// =====================================================
// Aviso breve tipo toast
// =====================================================

function pintarAviso(mensaje) {
  aviso.textContent = mensaje;
  aviso.classList.add("visible");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    aviso.classList.remove("visible");
  }, 2500);
}

// =====================================================
// Copia de seguridad: exportar e importar (spec 011, RF-901)
// =====================================================

// Descarga los clientes actuales como "clientes-AAAA-MM-DD.json"
function exportarClientes() {
  const nombre = nombreArchivoExportacion(new Date());
  const contenido = JSON.stringify(clientes, null, 2);
  const blob = new Blob([contenido], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // <a download> con Blob funciona también abriendo index.html con doble clic (file://)
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  // Se revoca pasados unos ms: si no, algún navegador cancela la descarga
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);

  pintarAviso("Copia exportada: " + nombre);
}

botonExportar.addEventListener("click", exportarClientes);

// Abre el selector de ficheros (el input está oculto)
botonImportar.addEventListener("click", function () {
  archivoImportar.click();
});

// Al elegir un fichero se lee su texto y se pasa a revisión;
// el input se vacía enseguida para poder volver a elegir el mismo archivo
archivoImportar.addEventListener("change", function () {
  const archivo = archivoImportar.files && archivoImportar.files[0];
  archivoImportar.value = "";
  if (!archivo) return;

  const lector = new FileReader();
  lector.addEventListener("load", function () {
    revisarImportacion(String(lector.result || ""));
  });
  lector.addEventListener("error", function () {
    pintarAviso("No se ha podido leer el archivo");
  });
  lector.readAsText(archivo);
});

// Valida el fichero importado (la validación pura vive en logica.js):
// con error se avisa y NO se toca nada; si es válido se abre la
// confirmación en línea con los contadores (nunca confirm()/alert())
function revisarImportacion(textoJson) {
  const resultado = importarClientes(textoJson);

  if (resultado.error) {
    importacionPendiente = null;
    ocultarConfirmacionImportacion();
    pintarAviso(resultado.error);
    return;
  }

  importacionPendiente = resultado.clientes;
  textoConfirmacionImportar.textContent =
    fraseConfirmacionImportacion(clientes.length, resultado.clientes.length);
  panelConfirmacionImportar.hidden = false;
}

// Pregunta con contadores, en singular o plural según toque
function fraseConfirmacionImportacion(actuales, entrantes) {
  const actual = actuales === 1 ? "1 cliente actual" : actuales + " clientes actuales";
  const entrante = entrantes === 1 ? "1 cliente del archivo" : entrantes + " clientes del archivo";
  return "¿Reemplazar " + actual + " por " + entrante + "?";
}

function ocultarConfirmacionImportacion() {
  panelConfirmacionImportar.hidden = true;
}

// «Sí, reemplazar»: la lista nueva se guarda y todo vuelve a un estado limpio
botonReemplazar.addEventListener("click", function () {
  if (importacionPendiente === null) return;

  clientes = importacionPendiente;
  importacionPendiente = null;
  guardarClientes();

  // Estado limpio (RF-901): pestaña «Todos» y buscador vacío, campo e interno
  filtroActivo = "Todos";
  textoBusqueda = "";
  campoBuscador.value = "";

  // Y sin ediciones ni borrados en curso apuntando a clientes que ya no existen
  confirmandoEliminarId = null;
  if (clienteEditandoId !== null) {
    clienteEditandoId = null;
    resetearFormulario();
    pintarFormularioModo();
  }

  pintarFiltros();
  ocultarConfirmacionImportacion();
  pintarLista();
  pintarAviso("Clientes importados");
});

// «Cancelar»: se descarta el fichero y no cambia nada
botonCancelarImportacion.addEventListener("click", function () {
  importacionPendiente = null;
  ocultarConfirmacionImportacion();
});

// =====================================================
// Lista de clientes
// =====================================================

function pintarLista() {
  // Del más reciente al más antiguo, filtro de tipo y búsqueda de texto (lógica en logica.js)
  const porTipo = filtrarClientes(ordenarClientes(clientes), filtroActivo);
  const visibles = buscarClientes(porTipo, textoBusqueda);

  // Contador de clientes (refleja tipo + búsqueda)
  contador.textContent = textoContador(visibles.length);

  // Lista vacía: mensaje según toque
  if (visibles.length === 0) {
    let mensaje;
    if (textoBusqueda.trim() !== "") {
      mensaje = "No hay coincidencias para «" + escapar(textoBusqueda.trim()) +
        "». Prueba con otras palabras o con la pestaña «Todos».";
    } else if (filtroActivo === "Todos") {
      mensaje = "Aún no hay clientes. Rellena el formulario de arriba para añadir el primero.";
      // Migración en 2 clics (spec 011, RF-903): solo en escritorio y solo si al
      // arrancar NO existía el archivo (sin clientes y sin búsqueda/filtro, que es
      // este mismo caso). Es un aviso más: no bloquea dar de alta clientes nuevos.
      if (EN_ESCRITORIO && !archivoInicialExiste && clientes.length === 0) {
        // Frase fija (sin datos del usuario), pero la pasamos por escapar por costumbre
        mensaje += " " + escapar("¿Vienes de la web? Exporta la copia allí e impórtala aquí con «Importar».");
      }
    } else {
      mensaje = "No hay clientes de tipo " + escapar(nombreTipo(filtroActivo)) +
        ". Prueba con la pestaña «Todos».";
    }
    listaClientes.innerHTML = '<p class="vacio-lista">' + mensaje + "</p>";
    return;
  }

  // Pintamos las tarjetas
  listaClientes.innerHTML = visibles.map(crearTarjeta).join("");
}

function crearTarjeta(cliente) {
  const editando = cliente.id === clienteEditandoId;
  const confirmando = cliente.id === confirmandoEliminarId;

  // Pie de la tarjeta: botones normales o paso de confirmación (nunca a la vez)
  const pie = confirmando
    ? '<div class="confirmacion">¿Seguro?' +
        '<button type="button" class="boton-tarjeta boton-si" data-accion="confirmar-si" data-id="' + cliente.id + '">Sí, eliminar</button>' +
        '<button type="button" class="boton-tarjeta boton-no" data-accion="confirmar-no" data-id="' + cliente.id + '">No</button>' +
      "</div>"
    : '<div class="tarjeta-acciones">' +
        '<button type="button" class="boton-tarjeta boton-editar" data-accion="editar" data-id="' + cliente.id + '">Editar</button>' +
        '<button type="button" class="boton-tarjeta boton-eliminar" data-accion="eliminar" data-id="' + cliente.id + '">Eliminar</button>' +
      "</div>";

  return (
    '<article class="tarjeta tarjeta-' + claseTipo(cliente.tipo) + (editando ? " editando" : "") + '">' +
      '<div class="tarjeta-cabecera">' +
        '<h3 class="tarjeta-empresa">' + (escapar(cliente.empresa) || "Sin nombre") + "</h3>" +
        '<span class="etiqueta etiqueta-' + claseTipo(cliente.tipo) + '">' +
          escapar(nombreTipo(cliente.tipo)) +
        "</span>" +
      "</div>" +
      '<dl class="datos-cliente">' +
        fila("CIF/NIF", cliente.cif) +
        fila("Persona de contacto", cliente.contacto) +
        fila("Teléfono", cliente.telefono) +
        fila("Móvil", cliente.movil) +
        fila("Correo electrónico", cliente.email) +
        fila("Dirección", cliente.direccion) +
        fila("Código postal", cliente.codigoPostal) +
      "</dl>" +
      cuadroMapa(cliente) +
      (cliente.notas ? '<p class="notas">' + escapar(cliente.notas) + "</p>" : "") +
      pie +
    "</article>"
  );
}

// Cuadro del mapa de Google Maps (spec 004):
// iframe con la ubicación; sin conexión se degrada a un enlace.
// Usa dirección + código postal (spec 007, RF-503).
function cuadroMapa(cliente) {
  const direccion = direccionCompleta(cliente.direccion, cliente.codigoPostal);

  let enLinea = true;
  try {
    enLinea = navigator.onLine !== false;
  } catch (error) {
    enLinea = false;
  }

  const modo = contenidoMapa(direccion, enLinea);
  if (modo === "ninguno") return "";

  const enlace = urlBusquedaMapa(direccion);

  if (modo === "enlace") {
    return '<div class="mapa-caja">' +
      '<a class="mapa-enlace mapa-enlace-solo" href="' + escapar(enlace) +
      '" target="_blank" rel="noopener">Ver en Google Maps</a>' +
    "</div>";
  }

  return '<div class="mapa-caja">' +
    '<iframe class="mapa-mapa" title="Mapa de ' + escapar(direccion) + '" loading="lazy" ' +
    'referrerpolicy="no-referrer-when-downgrade" src="' + escapar(urlMapa(direccion)) + '"></iframe>' +
    '<a class="mapa-enlace" href="' + escapar(enlace) +
    '" target="_blank" rel="noopener">Ver en Google Maps</a>' +
  "</div>";
}

function fila(etiqueta, valor) {
  if (!valor) return "";
  return "<div><dt>" + escapar(etiqueta) + ":</dt><dd>" + escapar(valor) + "</dd></div>";
}

// =====================================================
// Utilidades de interfaz (la lógica pura está en logica.js)
// =====================================================

// Quita caracteres peligrosos antes de pintar en HTML
function escapar(valor) {
  const div = document.createElement("div");
  div.textContent = valor || "";
  return div.innerHTML;
}

// =====================================================
// Primer pintado al abrir la página
// =====================================================

// Limpieza de los restos del acceso retirado (spec 006 retirada el 2026-10-13)
localStorage.removeItem("gestorAcceso");
localStorage.removeItem("gestorSesionPersistente");
sessionStorage.removeItem("gestorSesion");

// Spec 004: si vuelve o se corta la conexión, refrescamos los cuadros de mapa
window.addEventListener("online", pintarLista);
window.addEventListener("offline", pintarLista);

pintarFiltros();
pintarLista();
