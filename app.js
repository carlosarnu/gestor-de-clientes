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
// Desplegable del filtro por provincia (spec 015, RF-1305): se repuebla en cada
// pintarFiltroProvincia() con las provincias del filtro de tipo activo
const campoFiltroProvincia = document.getElementById("filtro-provincia");
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

// Impresión del listado (spec 013, RF-1101/RF-1103 → spec 017, RF-1501)
const botonImprimir = document.getElementById("boton-imprimir");
const cabeceraImpresion = document.getElementById("cabecera-impresion");

// Vista previa de impresión (spec 017, RF-1501/RF-1504): la hoja conmutable y su
// barra. estiloHoja es el <link id="estilo-hoja" media="print"> de index.html:
// su atributo media es el conmutador entre papel y pantalla-con-vista-previa
// (fuente única de reglas, RF-1510)
const estiloHoja = document.getElementById("estilo-hoja");
const barraVistaPrevia = document.getElementById("barra-vista-previa");
const botonVpImprimir = document.getElementById("boton-vp-imprimir");
const botonVpPdf = document.getElementById("boton-vp-pdf");
const botonVpCerrar = document.getElementById("boton-vp-cerrar");
// Aviso del «Guardar como PDF» en escritorio (RF-1506): el toast es chrome y la
// hoja lo oculta en la vista previa (RF-1501), así que el resultado se muestra
// EN LÍNEA en la barra (parte de la vista previa, no chrome). Resolución de la
// contradicción RF-1501/RF-1506 documentada en la T-05.
const estadoVp = document.getElementById("estado-vp");

// Conmutador de vista y selector de campos (spec 012, RF-1001/RF-1002)
const conmutador = document.getElementById("conmutador");
const selectorCampos = document.getElementById("selector-campos");
const contenedorChips = document.getElementById("chips");

// Estado de la aplicación
// ¿Existía el archivo de datos al arrancar? Solo tiene sentido en escritorio:
// sirve para el mensaje de migración en 2 clics (spec 011, RF-903). Se declara
// ANTES de cargarClientes() porque esa función lo rellena al arrancar.
let archivoInicialExiste = false;
let clientes = cargarClientes();
let filtroActivo = "Todos";
// Filtro por provincia (spec 015, RF-1305): SOLO en memoria, sin ninguna clave
// nueva (igual que el filtro de tipo y la vista). Se limpia en el alta (coherencia
// con la 010) y se repuebla/valida en pintarFiltroProvincia() antes de cada
// pintarLista() que pueda cambiar datos o pestaña. NO redeclarar.
let filtroProvincia = "";
let textoBusqueda = ""; // texto del buscador (spec 005)
// Vista actual y campos elegidos del listado (spec 012): SOLO en memoria, sin
// persistencia — al recargar se vuelve a «Tarjetas» con solo «Empresa» (RF-1006)
let vistaActual = "tarjetas"; // "tarjetas" (por defecto) o "listado"
let camposSeleccionados = normalizarSeleccion(["empresa"]); // 1 campo por defecto
let clienteEditandoId = null; // id del cliente en edición, o null si no se está editando
let confirmandoEliminarId = null; // id de la tarjeta mostrando "¿Seguro?", o null si no hay ninguna
let importacionPendiente = null; // clientes del fichero esperando confirmación, o null
let temporizadorAviso = null;
// Vista previa de impresión (spec 017): SOLO en memoria, sin persistencia — abrir
// o cerrarla no escribe ninguna clave ni cambia clientes (RF-1511). scrollAntes
// guarda la posición de la página al abrir para restaurarla al cerrar (RF-1504,
// Decisión 11)
let vistaPreviaAbierta = false;
let scrollAntesVistaPrevia = 0;

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
    // vacía la lista (mismo criterio RF-802 que en la web). SOLO la migración
    // motiva esta escritura: la basura que traiga el archivo (entradas que no
    // son objetos) se conserva en el fichero tal cual (los datos son sagrados).
    const migrada = migrarTipos(lista);
    if (migrada !== lista) {
      try {
        window.gestorDatos.escribir(JSON.stringify(migrada));
      } catch (error) {
        // La lista en memoria sigue siendo la correcta
      }
    }
    // Saneo EN MEMORIA (M1b, revisión global): entradas que no son objetos
    // (null, textos, arrays…) fuera de la lista de trabajo, sin reescribir nada
    return sanearListaClientes(migrada);
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
  const fuente = Array.isArray(lista) ? lista : [];
  const migrada = migrarTipos(fuente);
  if (migrada !== fuente) {
    // 2) Escritura de la migración en su propio try: si falla (p. ej. cuota llena)
    // seguimos con los datos leídos en memoria; un fallo de escritura NUNCA vacía la lista (RF-802)
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(migrada));
    } catch (error) {
      // No se escribe nada; la lista en memoria sigue siendo la correcta
    }
  }
  // Saneo EN MEMORIA (M1b, revisión global): la clave NO se reescribe por esto —
  // la basura solo desaparece si el usuario guarda una acción después
  return sanearListaClientes(migrada);
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

// --- Tipo de cliente: desplegable + campo condicional (spec 016, RF-1401/1402/1403) ---
// El <select> tiene 5 opciones (Sin tipo vacía + 3 fijos + Otros); al elegir
// «Otros» aparece el campo de texto (oculto con hidden, no ocupa espacio). El
// desplegable es de SELECCIÓN ÚNICA (Decisión 4 de la spec 016): el array `tipos`
// se construye con la sola elección del desplegable; un multi-tipo importado
// solo conserva su primer tipo al editar (limitación documentada).
const campoTipo = document.getElementById("tipo");
const campoTipoOtro = document.getElementById("tipo-otro");
const campoTipoOtroContenedor = document.getElementById("campo-tipo-otro");

// Muestra u oculta el campo condicional según la opción del desplegable.
// Al ocultarlo también se vacía su valor (el texto escrito no cuenta si se
// cambia de opción; RF-1402)
function alternarCampoOtro() {
  const otros = campoTipo.value === "Otros";
  campoTipoOtroContenedor.hidden = !otros;
  if (!otros) campoTipoOtro.value = "";
}

// El desplegable cambió: muestra u oculta el campo condicional
campoTipo.addEventListener("change", alternarCampoOtro);

// Lee el desplegable y el campo condicional y devuelve la lista `tipos` (array):
// «Sin tipo» → []; fijo → [fijo]; «Otros» → [texto recortado] o ["Otros"] si
// vacío; texto que coincide con un fijo escrito en «Otros» → se guarda como fijo
// (RF-1403). Este es el ÚNICO punto donde el formulario convierte la elección
// en el array que la lógica pura ya sabe manejar (construirCliente/actualizarCliente).
function tiposDesdeFormulario() {
  const elegido = campoTipo.value;
  if (elegido === "") return [];                 // «Sin tipo»
  if (elegido !== "Otros") return [elegido];     // tipo fijo
  // «Otros»: el texto del campo condicional; vacío → «Otros»
  // (nombre «textoOtro», no «texto»: una constante local llamada `texto`
  // sombrearía la función global texto() de logica.js, revisión global B7)
  const textoOtro = campoTipoOtro.value.trim();
  if (textoOtro === "") return ["Otros"];
  // Si el texto coincide con un tipo fijo escrito a mano, se guarda como fijo
  // (mismo criterio que la lógica añadirTipoLibre, RF-1403)
  return [textoOtro];
}

// Reset del formulario: desplegable en «Sin tipo», campo oculto y vacío
// (nada obligatorio, spec 007)
function resetearFormulario() {
  formulario.reset(); // también vacía el <select> y el campo condicional
  alternarCampoOtro();
}

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  // Validación extra por si acaso (el navegador ya valida lo básico)
  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  const datos = new FormData(formulario);

  // Si estamos en modo edición, guardamos los cambios y salimos
  if (clienteEditandoId !== null) {
    guardarEdicion(datos);
    return;
  }

  // Alta con el tipo elegido en el desplegable (spec 016, RF-1403): la lógica
  // normaliza y escribe `tipos` + `tipo` = tipos[0] ?? ""
  clientes.push(construirCliente(datos, Date.now(), Date.now(), tiposDesdeFormulario()));

  // Guardado protegido (revisión global, M2): si la escritura falla (cuota llena
  // en la web, error de disco en escritorio) SE REVIERTE el push — el cliente no
  // queda en memoria y, al reintentar «Guardar cliente», no se crea un duplicado—
  // y se avisa en el toast; el formulario se conserva RELLENO para poder repetir
  try {
    guardarClientes();
  } catch (error) {
    clientes.pop(); // deshacer el push: memoria igual que antes del alta
    pintarAviso("No se pudo guardar los datos");
    return;
  }

  // Alta con feedback (spec 010, RF-801): buscador limpio y aviso «Cliente guardado».
  // La limpieza va antes de pintarFiltros/pintarLista para que la lista se pinte sin filtro de texto
  textoBusqueda = "";
  campoBuscador.value = "";
  // Coherencia con la 010 y la 015 (caso límite «Alta con filtro de provincia
  // activo»): el alta vuelve a «Todos» y además desactiva el filtro de provincia
  // para no dejar un filtro imposible; pintarFiltroProvincia() repuebla el
  // <select> con las provincias de la lista ya con el cliente nuevo.
  filtroProvincia = "";
  pintarAviso(mensajeAviso("guardado"));

  // Limpiamos el formulario y volvemos a la pestaña "Todos"
  resetearFormulario();
  filtroActivo = "Todos";
  pintarFiltros();
  pintarFiltroProvincia(); // siempre ANTES de pintarLista (RF-1305)
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
  // Las provincias dependen del tipo activo: se repuebla ANTES de pintar la
  // lista; si la selección ya no existe entre las nuevas opciones, la lógica la
  // devuelve «» y el desplegable vuelve a «Todas las provincias» (RF-1305)
  pintarFiltroProvincia();
  pintarLista();
});

function pintarFiltros() {
  const botones = contenedorFiltros.querySelectorAll(".filtro");
  botones.forEach(function (boton) {
    boton.classList.toggle("activo", boton.dataset.filtro === filtroActivo);
  });
}

// Desplegable de provincia (spec 015, RF-1305/RF-1306): una opción por provincia
// de los clientes que pasan el filtro de TIPO activo (sin tener en cuenta la
// búsqueda); de ahí salen también el valor validado de la selección y, más abajo,
// los visibles. Las provincias únicas, su orden y la validación son de la lógica
// pura (provinciasExistentes / provinciaValida): aquí solo se reconstruye el
// <select> — opción «Todas las provincias» (value="") + una por provincia con su
// texto tal cual se guardó (el value es ese mismo texto; la comparación
// normalizada la hace la lógica al filtrar). Si la selección ya no existe entre
// las opciones, provinciaValida() la devuelve «»: nunca un filtro imposible.
function pintarFiltroProvincia() {
  const provincias = provinciasExistentes(filtrarClientes(clientes, filtroActivo));
  filtroProvincia = provinciaValida(provincias, filtroProvincia);

  const opciones = ['<option value="">Todas las provincias</option>'];
  provincias.forEach(function (provincia) {
    opciones.push('<option value="' + escaparAtributo(provincia) + '">' + escapar(provincia) + "</option>");
  });
  campoFiltroProvincia.innerHTML = opciones.join("");

  // La selección puede estar escrita con otra forma que la opción equivalente
  // (p. ej. «Cádiz» elegida en «Todos» cuando en «Espuma» solo hay «CÁDIZ»): el
  // <select> solo admite valores que existan como opción, así que alineamos el
  // estado a la forma que se muestra. El filtrado no cambia (normaliza), solo el
  // texto visible.
  if (filtroProvincia !== "") {
    const forma = provincias.find(function (provincia) {
      return normalizar(provincia) === normalizar(filtroProvincia);
    });
    filtroProvincia = forma || "";
  }
  campoFiltroProvincia.value = filtroProvincia;
}

// Cambio del desplegable: la opción elegida pasa al estado en memoria (sin ninguna
// clave nueva) y se repinta la lista. Las opciones solo dependen del filtro de tipo,
// que aquí no cambia, así que no hace falta repintar el <select> (RF-1305)
campoFiltroProvincia.addEventListener("change", function () {
  filtroProvincia = campoFiltroProvincia.value;
  pintarLista();
});

// =====================================================
// Conmutador de vista y selector de campos (spec 012, RF-1001/RF-1002)
// =====================================================

// Cambia la vista al instante sin tocar datos, filtro, búsqueda ni orden.
// El estado vive solo en memoria: no se escribe nada (RF-1006).
conmutador.addEventListener("click", function (evento) {
  const boton = evento.target.closest("[data-vista]");
  if (!boton) return;

  vistaActual = boton.dataset.vista;
  pintarConmutador();
  pintarLista();
});

function pintarConmutador() {
  const botones = conmutador.querySelectorAll("[data-vista]");
  botones.forEach(function (boton) {
    const activa = boton.dataset.vista === vistaActual;
    boton.classList.toggle("vista-activa", activa);
    boton.setAttribute("aria-pressed", activa ? "true" : "false");
  });
  // El selector de chips solo se enseña en el modo listado (Decisión 2 de la spec)
  selectorCampos.hidden = vistaActual !== "listado";
}

// Clic en un chip: alterna el campo en la selección y repinta chips Y filas
// (las columnas del listado cambian al instante, RF-1002)
contenedorChips.addEventListener("click", function (evento) {
  const chip = evento.target.closest(".chip");
  if (!chip) return;

  const campo = chip.dataset.campo;
  camposSeleccionados = alternarCampo(camposSeleccionados, campo);
  pintarChips();
  pintarLista();

  // pintarChips() reconstruye los botones: devolvemos el foco al mismo chip para
  // que Intro/Espacio seguidos sigan alternando ese campo (RF-1004)
  const chipRepintado = contenedorChips.querySelector('.chip[data-campo="' + campo + '"]');
  if (chipRepintado) chipRepintado.focus();
});

// Chips generados desde CATALOGO_CAMPOS (el único catálogo, RF-1002): casilla
// marcada/desmarcada con estado visible «✔/□», no exclusivos, en español
function pintarChips() {
  contenedorChips.innerHTML = CATALOGO_CAMPOS.map(function (campo) {
    const marcado = camposSeleccionados.indexOf(campo.clave) !== -1;
    return '<button type="button" class="chip' + (marcado ? " marcado" : "") +
      '" role="checkbox" aria-checked="' + (marcado ? "true" : "false") +
      '" data-campo="' + escaparAtributo(campo.clave) + '">' +
      '<span class="chip-marca" aria-hidden="true">' + (marcado ? "✔" : "□") + "</span>" +
      escapar(campo.etiqueta) +
      "</button>";
  }).join("");
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
  // Provincia con la única regla de lectura (RF-1302 / T-02): tolera clientes
  // antiguos sin el campo y recorta; nunca `cliente.provincia` a pelo
  formulario.provincia.value = provinciaCliente(cliente);
  // Tipo del cliente en el desplegable (spec 016, RF-1404): primer tipo de
  // tiposCliente(cliente); si es un tipo fijo → desplegable en ese fijo; si es
  // libre/«Otros» → desplegable en «Otros» con el texto cargado; vacío → «Sin tipo».
  // Un multi-tipo importado solo conserva su primer tipo (Decisión 4)
  const tipos = tiposCliente(cliente);
  const primero = tipos.length > 0 ? tipos[0] : "";
  if (esTipoFijo(primero)) {
    campoTipo.value = primero;       // desplegable en el fijo
  } else if (primero !== "") {
    campoTipo.value = "Otros";       // desplegable en «Otros» + texto cargado
    // El literal «Otros» (guardado por la 008 con el campo vacío) deja el
    // campo vacío, no el texto «Otros» (RF-1404)
    campoTipoOtro.value = primero === "Otros" ? "" : primero;
  } else {
    campoTipo.value = "";            // «Sin tipo»
  }
  alternarCampoOtro();               // oculta el campo si no es «Otros»
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

  // Actualizamos los campos conservando id y fecha originales (ver logica.js);
  // el tipo viene del desplegable del formulario (tiposDesdeFormulario, RF-1403)
  clientes = aplicarEdicion(clientes, clienteEditandoId, datos, tiposDesdeFormulario());

  // Guardado protegido (revisión global, M2): si la escritura falla, la edición
  // se queda en memoria (no se duplica ni se pierde nada, y una acción posterior
  // que sí se pueda guardar la persistirá entera) pero el usuario DEBE enterarse
  let guardado = true;
  try {
    guardarClientes();
  } catch (error) {
    guardado = false;
  }

  clienteEditandoId = null;
  resetearFormulario();
  pintarFormularioModo();
  // La edición puede cambiar o quitar la provincia del filtro activo (RF-1305)
  pintarFiltroProvincia();
  pintarLista();
  pintarAviso(guardado ? mensajeAviso("actualizado") : "No se pudo guardar los datos");
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
  // Guardado protegido (revisión global, M2): el borrado se queda en memoria y
  // el usuario se entera si la escritura falla (la lista repintada ya no lo
  // muestra, pero una acción posterior que se pueda guardar lo consolidará)
  let guardado = true;
  try {
    guardarClientes();
  } catch (error) {
    guardado = false;
  }
  // Si se borró el último cliente de la provincia filtrada, se repuebla y el
  // filtro vuelve solo a «Todas las provincias» (RF-1305, caso límite)
  pintarFiltroProvincia();
  pintarLista();
  pintarAviso(guardado ? mensajeAviso("eliminado") : "No se pudo guardar los datos");
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

  // Guardado protegido (revisión global, M2): si la escritura falla, la lista
  // importada se queda en memoria (es inocua: no duplica ni pierde nada y una
  // acción posterior que sí se pueda guardar la persistirá entera) pero el
  // usuario DEBE enterarse; el resto del estado limpio se aplica igual
  let guardado = true;
  try {
    guardarClientes();
  } catch (error) {
    guardado = false;
  }

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
  // Misma regla que en la 015: si la provincia activa no está en la lista nueva,
  // el desplegable se repuebla y vuelve a «Todas las provincias» (RF-1305)
  pintarFiltroProvincia();
  ocultarConfirmacionImportacion();
  pintarLista();
  pintarAviso(guardado ? "Clientes importados" : "No se pudo guardar los datos");
});

// «Cancelar»: se descarta el fichero y no cambia nada
botonCancelarImportacion.addEventListener("click", function () {
  importacionPendiente = null;
  ocultarConfirmacionImportacion();
});

// =====================================================
// Vista previa de impresión (spec 017, RF-1501…RF-1505)
// =====================================================

// Cabecera de contexto de la hoja (spec 013, RF-1103 → spec 017, RF-1503): una
// ÚNICA helper para las dos rutas que la necesitan — el listener «beforeprint»
// (Ctrl+P / menú del navegador, RF-1509, y también toda impresión lanzada desde la
// vista previa) y la apertura de la vista previa, para que la cabecera ya esté
// fresca al mostrarse sin depender de un evento que Electron no garantiza con
// printToPDF (plan §3.4). Tercer argumento (spec 015, RF-1308): el filtro de
// provincia vigente; sin provincia activa textoContextoImpresion omite la pieza.
// textContent pinta seguro, sin innerHTML.
function refrescarCabeceraImpresion() {
  cabeceraImpresion.textContent = textoContextoImpresion(filtroActivo, textoBusqueda, filtroProvincia);
}

window.addEventListener("beforeprint", refrescarCabeceraImpresion);

// «Imprimir» de la cabecera de la lista (spec 013, RF-1101 → spec 017, RF-1501):
// la GUARDIA de cero visibles queda idéntica (RF-1502 — vacío, filtro, provincia o
// búsqueda sin resultados → aviso breve y SIN abrir nada, sin disparar
// beforeprint); con visibles YA NO llama a window.print(): abre la vista previa
// dentro de la propia app (derogación del RF-1102, Decisión 1 de la 017). No toca
// datos, claves, vista, filtro ni búsqueda.
botonImprimir.addEventListener("click", function () {
  if (visiblesActuales().length === 0) {
    pintarAviso("No hay clientes para imprimir");
    return;
  }
  abrirVistaPrevia();
});

// Abre la vista previa (RF-1501): es un ESTADO de la página, no un documento
// nuevo ni un clon — se muestra el MISMO HTML en vivo de la lista, con el chrome
// oculto por las reglas de hoja-impresion.css cuyo <link> se enciende en pantalla
// conmutando su media de "print" a "all" (RF-1510: un único juego de reglas para
// pantalla-con-vista-previa y papel, imposible que divergan). Orden fijado por el
// plan §1: barra.hidden = false ANTES del focus() (con hidden el botón no podría
// recibir foco). La cabecera de contexto se rellena fresca al abrir (RF-1503).
// Presentación pura: no escribe clientes ni claves y no altera filtro, búsqueda,
// provincia, vista ni selección de campos (instantánea, RF-1501/Decisión 8).
function abrirVistaPrevia() {
  if (vistaPreviaAbierta) return;
  scrollAntesVistaPrevia = window.scrollY;
  refrescarCabeceraImpresion();
  vistaPreviaAbierta = true;
  document.body.classList.add("modo-vista-previa");
  estiloHoja.media = "all";
  barraVistaPrevia.hidden = false;
  estadoVp.hidden = true; // sin restos del PDF de una apertura anterior
  estadoVp.textContent = "";
  botonVpImprimir.focus(); // foco al PRIMER botón, «Imprimir» (RF-1504)
}

// Cierra la vista previa y devuelve la app a su estado anterior EXACTO (RF-1504):
// filtro, búsqueda, provincia, vista y campos intactos (no se tocaron al abrir),
// posición de scroll restaurada (Decisión 11) y foco de vuelta en el botón
// «Imprimir» de la lista. El papel recupera su estado por defecto (media="print"):
// Ctrl+P vuelve a imprimir la hoja aunque la vista previa no se reabra (RF-1509).
function cerrarVistaPrevia() {
  if (!vistaPreviaAbierta) return;
  vistaPreviaAbierta = false;
  barraVistaPrevia.hidden = true;
  estadoVp.hidden = true; // el aviso del PDF desaparece con la barra (RF-1506)
  estadoVp.textContent = "";
  estiloHoja.media = "print";
  document.body.classList.remove("modo-vista-previa");
  window.scrollTo(0, scrollAntesVistaPrevia);
  // preventScroll: focus() por defecto llevaria el boton a la vista y
  // arruinaria la restauracion del scroll (RF-1504 pide las DOS cosas)
  botonImprimir.focus({ preventScroll: true });
}

// Escape cierra la vista previa (RF-1504). Listener ÚNICO y permanente que solo
// reacciona a Escape y solo con la vista previa abierta: no se intercepta ninguna
// otra tecla ni Ctrl+P (Decisión 4 de la spec; la 013 queda intacta). El cuadro
// nativo de impresión consume su propio Escape sin que llegue a la página, así que
// cancelarlo NO cierra la vista previa (RF-1505, caso límite de la spec).
window.addEventListener("keydown", function (evento) {
  if (evento.key !== "Escape" || !vistaPreviaAbierta) return;
  cerrarVistaPrevia();
});

// «Imprimir» de la barra (RF-1505): el diálogo nativo con la hoja ya encendida
// (media="all" hace match también en impresión, Decisión 5 del plan) y SIN cerrar
// la vista previa: cancelar o cerrar el diálogo deja todo tal cual (Decisión 8);
// beforeprint rellena la cabecera fresca, igual que con Ctrl+P (coherencia).
botonVpImprimir.addEventListener("click", function () {
  window.print();
});

// «Guardar como PDF» (RF-1506 escritorio / RF-1507 web). En escritorio la T-05
// expone el IPC guardar-pdf (escritorio/main.js + preload.js) con nombre
// `listado-AAAA-MM-DD.pdf`; si un puente más antiguo no lo expone, caemos al
// MISMO window.print() que «Imprimir», que es además literalmente lo que la
// spec pide en la web (RF-1507: el navegador ofrece «Guardar como PDF» como
// destino y allí el nombre lo propone el navegador).
botonVpPdf.addEventListener("click", function () {
  if (EN_ESCRITORIO && typeof window.gestorDatos.guardarPdf === "function") {
    guardarComoPdfEscritorio();
    return;
  }
  window.print();
});

// Ruta de escritorio (RF-1506), activa con el IPC de la T-05 (main.js +
// preload.js): { cancelado } → nada (los diálogos nativos cancelados no
// avisan); éxito → «PDF guardado: nombre»; { error } o excepción → «No se pudo
// generar el PDF» con la vista previa ABIERTA. Los avisos van AL <p> DE ESTADO
// de la barra, NO al toast: el toast es chrome y la hoja lo oculta con la
// vista previa abierta (RF-1501), lo que haría invisible el aviso que exige el
// RF-1506 — resolución de esa contradicción (opción (a): mensaje en línea,
// dentro de la propia vista previa, que desaparece al cerrarla).
function guardarComoPdfEscritorio() {
  function avisar(mensaje, esError) {
    estadoVp.textContent = mensaje;
    estadoVp.classList.toggle("estado-vp-error", Boolean(esError));
    estadoVp.hidden = false;
  }

  try {
    Promise.resolve(window.gestorDatos.guardarPdf(nombreArchivoPdf(new Date())))
      .then(function (resultado) {
        if (!resultado || resultado.cancelado) return; // cancelar: sin aviso
        if (resultado.guardado) {
          // El nombre del fichero, no la ruta entera: breve y suficiente
          const nombre = String(resultado.ruta || "").split(/[\\/]/).pop() ||
            nombreArchivoPdf(new Date());
          avisar("PDF guardado: " + nombre, false);
        } else if (resultado.error) {
          avisar("No se pudo generar el PDF", true);
        }
      })
      .catch(function () {
        avisar("No se pudo generar el PDF", true);
      });
  } catch (error) {
    avisar("No se pudo generar el PDF", true);
  }
}

// «Cerrar» de la barra (RF-1504): mismo camino que Escape
botonVpCerrar.addEventListener("click", cerrarVistaPrevia);

// =====================================================
// Lista de clientes
// =====================================================

// Clientes visibles en la lista AHORA: orden (más reciente primero) + filtro de
// tipo + filtro de PROVINCIA + búsqueda de texto (combinación en Y, RF-1305), con
// la lógica pura de logica.js. Compartida entre el pintado y el guardia de
// «Imprimir» (plan §5): un solo cálculo, imposible que el guardia y lo que se
// pinten divergan; el contador sale de aquí, así que refleja los tres a la vez.
function visiblesActuales() {
  const porTipo = filtrarClientes(ordenarClientes(clientes), filtroActivo);
  const porProvincia = filtrarPorProvincia(porTipo, filtroProvincia);
  return buscarClientes(porProvincia, textoBusqueda);
}

function pintarLista() {
  // Mismos visibles de siempre (filtro + búsqueda + orden, lógica en logica.js)
  const visibles = visiblesActuales();

  // Contador de clientes (refleja tipo + provincia + búsqueda, RF-1306)
  contador.textContent = textoContador(visibles.length);

  // Lista vacía: mensaje según toque (prioridad búsqueda → provincia → tipo → vacío)
  if (visibles.length === 0) {
    let mensaje;
    if (textoBusqueda.trim() !== "") {
      mensaje = "No hay coincidencias para «" + escapar(textoBusqueda.trim()) +
        "». Prueba con otras palabras o con la pestaña «Todos».";
    } else if (filtroProvincia.trim() !== "") {
      mensaje = "No hay clientes en «" + escapar(filtroProvincia.trim()) +
        "». Prueba con «Todas las provincias» o con la pestaña «Todos».";
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

  // Vista de listado (spec 012, RF-1003): mismos visibles, orden y contador que
  // las tarjetas; los estados vacíos de arriba son comunes a las dos vistas
  if (vistaActual === "listado") {
    listaClientes.innerHTML = crearTablaListado(visibles);
    return;
  }

  // Pintamos las tarjetas
  listaClientes.innerHTML = visibles.map(crearTarjeta).join("");
}

function crearTarjeta(cliente) {
  const editando = cliente.id === clienteEditandoId;
  const confirmando = cliente.id === confirmandoEliminarId;

  // Tipos efectivos (RF-1207): un badge por cada tipo, cada uno con su color
  // (fijos con su paleta por claseTipo, libres en violeta «otros»). Sin tipos se
  // pinta la lista [""] y sale la etiqueta «Sin tipo» de siempre (mismo aspecto
  // que hasta ahora). El texto va por escapar() (contexto de texto); el `title`
  // (atributo, solo si hay tipo) por escaparAtributo: el CSS corta el badge
  // largo con «…» y el title lo muestra completo (como .chip-texto y las celdas)
  const tipos = tiposCliente(cliente);
  const etiquetas = (tipos.length > 0 ? tipos : [""]).map(function (tipo) {
    return '<span class="etiqueta' + claseTipoElemento("etiqueta", tipo) + '"' +
      (tipo ? ' title="' + escaparAtributo(tipo) + '"' : "") + ">" +
      escapar(nombreTipo(tipo)) +
      "</span>";
  }).join("");

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
    // El canto de la tarjeta es el del PRIMER tipo (Decisión 6 de la spec 014: el
    // mismo que `tipo` ven los lectores antiguos); sin tipos, sin canto, como hoy
    '<article class="tarjeta' + claseTipoElemento("tarjeta", tipos[0]) + (editando ? " editando" : "") + '">' +
      '<div class="tarjeta-cabecera">' +
        '<h3 class="tarjeta-empresa">' + (escapar(cliente.empresa) || "Sin nombre") + "</h3>" +
        '<div class="etiquetas">' + etiquetas + "</div>" +
      "</div>" +
      '<dl class="datos-cliente">' +
        fila("CIF/NIF", cliente.cif) +
        fila("Persona de contacto", cliente.contacto) +
        fila("Teléfono", cliente.telefono) +
        fila("Móvil", cliente.movil) +
        fila("Correo electrónico", cliente.email) +
        fila("Dirección", cliente.direccion) +
        fila("Código postal", cliente.codigoPostal) +
        // Provincia (spec 015, RF-1303): justo tras CP y con la única regla de
        // lectura; `fila()` devuelve «» con valor vacío, así que las fichas
        // antiguas (todas) no muestran la línea
        fila("Provincia", provinciaCliente(cliente)) +
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
      '<a class="mapa-enlace mapa-enlace-solo" href="' + escaparAtributo(enlace) +
      '" target="_blank" rel="noopener">Ver en Google Maps</a>' +
    "</div>";
  }

  // Los tres atributos del iframe/enlace se pintan con escaparAtributo: el `title`
  // lleva la dirección del usuario (comillas incluidas) y los demás van por
  // defensa en profundidad — aunque urlMapa/urlBusquedaMapa ya van codificados (reviewer)
  return '<div class="mapa-caja">' +
    '<iframe class="mapa-mapa" title="Mapa de ' + escaparAtributo(direccion) + '" loading="lazy" ' +
    'referrerpolicy="no-referrer-when-downgrade" src="' + escaparAtributo(urlMapa(direccion)) + '"></iframe>' +
    '<a class="mapa-enlace" href="' + escaparAtributo(enlace) +
    '" target="_blank" rel="noopener">Ver en Google Maps</a>' +
  "</div>";
}

function fila(etiqueta, valor) {
  if (!valor) return "";
  return "<div><dt>" + escapar(etiqueta) + ":</dt><dd>" + escapar(valor) + "</dd></div>";
}

// =====================================================
// Listado compacto: filas (spec 012, RF-1003/RF-1004)
// =====================================================

// Tabla del listado: cabecera con las etiquetas de los campos elegidos y una fila
// por cliente. Los valores vienen de la lógica pura (construirFilas) con las
// convenciones de siempre («Sin nombre»/«Sin tipo»/«—»/tipo libre) y la fecha ya
// en dd/mm/aaaa local: aquí solo se escapa y se pinta. Sin mapa ni iframes (RF-1004).
function crearTablaListado(visibles) {
  const hoy = new Date();
  const filas = construirFilas(visibles, camposSeleccionados, hoy);

  // La cabecera usa las celdas de la primera fila: mismas columnas, mismo orden
  const cabecera = filas[0].celdas.map(function (celda) {
    return '<th scope="col" title="' + escaparAtributo(celda.etiqueta) + '">' +
      escapar(celda.etiqueta) + "</th>";
  }).join("") + '<th scope="col" class="acciones-celda">Acciones</th>';

  // filas y visibles van en el mismo orden (construirFilas lo garantiza): el
  // cliente del turno da el color de su tipo; el data-id prepara las acciones (T-05)
  const cuerpo = filas.map(function (filaDatos, indice) {
    const celdas = filaDatos.celdas.map(function (celda) {
      // Una sola línea cortada con «…» (title con el texto completo), RF-1004.
      // El title es un ATRIBUTO: escaparAtributo (comillas incluidas) para que un
      // valor con «"» no rompa el atributo ni inyecte atributos ajenos (reviewer);
      // el contenido de la celda sigue con escapar() (contexto de texto).
      return '<td data-etiqueta="' + escaparAtributo(celda.etiqueta) +
        '" title="' + escaparAtributo(celda.valor) + '">' + escapar(celda.valor) + "</td>";
    }).join("");
    // La marca de edición cubre la fila entera (RF-1003), como en la tarjeta
    const editando = filaDatos.id === clienteEditandoId;
    // Canto por el PRIMER tipo efectivo, igual que la tarjeta (Decisión 6, RF-1207)
    return '<tr class="fila' + claseTipoElemento("fila", tiposCliente(visibles[indice])[0]) +
      (editando ? " editando" : "") + '" data-id="' + filaDatos.id + '">' +
      celdas + accionesFila(filaDatos.id) + "</tr>";
  }).join("");

  return '<table class="listado">' +
    "<thead><tr>" + cabecera + "</tr></thead>" +
    "<tbody>" + cuerpo + "</tbody>" +
  "</table>";
}

// Acciones de la fila (spec 012, RF-1003): réplica del pie de la tarjeta con los
// MISMOS data-accion/data-id, así el listener delegado de #lista-clientes las
// atiende igual («editar», «eliminar», «confirmar-si», «confirmar-no»). Nunca
// conviven botones y «¿Seguro?» en la misma celda.
function accionesFila(id) {
  const confirmando = confirmandoEliminarId === id;

  const contenido = confirmando
    ? '<div class="confirmacion">¿Seguro?' +
        '<button type="button" class="boton-tarjeta boton-si" data-accion="confirmar-si" data-id="' + id + '">Sí, eliminar</button>' +
        '<button type="button" class="boton-tarjeta boton-no" data-accion="confirmar-no" data-id="' + id + '">No</button>' +
      "</div>"
    : '<div class="acciones-fila">' +
        '<button type="button" class="boton-tarjeta boton-editar" data-accion="editar" data-id="' + id + '">Editar</button>' +
        '<button type="button" class="boton-tarjeta boton-eliminar" data-accion="eliminar" data-id="' + id + '">Eliminar</button>' +
      "</div>";

  return '<td class="acciones-celda">' + contenido + "</td>";
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

// Clase extra con el color del tipo de un elemento (« tarjeta-tela»,
// « fila-otros», « etiqueta-espuma») o cadena vacía si no hay tipo: claseTipo("")
// devuelve «» y concatenar a ciegas dejaba clases con guion final («tarjeta-»,
// «fila-», «etiqueta-») que no pinta nada (revisión global, B11)
function claseTipoElemento(prefijo, tipo) {
  const clase = claseTipo(tipo);
  return clase === "" ? "" : " " + prefijo + "-" + clase;
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

pintarConmutador();
pintarChips();
pintarFiltros();
pintarFiltroProvincia(); // desplegable con las provincias de arranque (RF-1305)
pintarLista();
