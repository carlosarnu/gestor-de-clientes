// =====================================================
// Gestor de Clientes - JavaScript
// =====================================================

// Clave que usamos para guardar los datos en el navegador
const CLAVE_STORAGE = "gestorClientes";

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

// Acceso con clave (spec 006)
const pantallaAcceso = document.getElementById("pantalla-acceso");
const formularioAcceso = document.getElementById("formulario-acceso");
const claveAcceso = document.getElementById("clave-acceso");
const errorAcceso = document.getElementById("error-acceso");
const recordarSesion = document.getElementById("recordar-sesion");
const contenidoApp = document.getElementById("contenido-app");
const botonSalir = document.getElementById("boton-salir");
const panelAdmin = document.getElementById("panel-admin");
const botonExportar = document.getElementById("boton-exportar");
const botonImportar = document.getElementById("boton-importar");
const archivoImportar = document.getElementById("archivo-importar");
const confirmarImportacion = document.getElementById("confirmar-importacion");
const textoConfirmacion = document.getElementById("texto-confirmacion");
const botonSiReemplazar = document.getElementById("boton-si-reemplazar");
const botonCancelarImportar = document.getElementById("boton-cancelar-importar");
const claveNuevaUsuario = document.getElementById("clave-nueva-usuario");
const claveNuevaAdmin = document.getElementById("clave-nueva-admin");
const botonGuardarClaves = document.getElementById("boton-guardar-claves");

// Almacenamiento del acceso (spec 006)
const CLAVE_ACCESO = "gestorAcceso";                        // localStorage: hashes { usuario, administrador }
const CLAVE_SESION = "gestorSesion";                        // sessionStorage: rol
const CLAVE_SESION_PERSISTENTE = "gestorSesionPersistente"; // localStorage: rol

// Hashes SHA-256 de las claves por defecto ("2468" usuario, "9753" administrador):
// en el código NUNCA aparece el PIN en claro (RF-404)
const CLAVES_POR_DEFECTO = {
  usuario: "a1fb4e703a9ef1fa4936801721ff285a97ac85330856674412e054892afe6972",
  administrador: "e4ed4d14170e2017c139c958853c66f4cecd6b43c12b0e0c641f4288bd859d93"
};

// Estado de la aplicación
let clientes = cargarClientes();
let filtroActivo = "Todos";
let textoBusqueda = ""; // texto del buscador (spec 005)
let rol = null; // "usuario" | "administrador" | null (sin sesión)
let archivoPendiente = null; // clientes validados esperando confirmación de importación
let clienteEditandoId = null; // id del cliente en edición, o null si no se está editando
let confirmandoEliminarId = null; // id de la tarjeta mostrando "¿Seguro?", o null si no hay ninguna
let temporizadorAviso = null;

// =====================================================
// Guardar y cargar datos
// =====================================================

function cargarClientes() {
  try {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    return datos ? JSON.parse(datos) : [];
  } catch (error) {
    // Si los datos están corruptos, empezamos de cero
    return [];
  }
}

function guardarClientes() {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(clientes));
}

// =====================================================
// Formulario
// =====================================================

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

  clientes.push(construirCliente(datos, Date.now(), Date.now()));
  guardarClientes();

  // Limpiamos el formulario y volvemos a la pestaña "Todos"
  formulario.reset();
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
  formulario.email.value = cliente.email || "";
  formulario.direccion.value = cliente.direccion || "";
  formulario.tipo.value = cliente.tipo || "";
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
  formulario.reset();
  pintarFormularioModo();
  pintarLista();
}

function guardarEdicion(datos) {
  const cliente = buscarCliente(clientes, clienteEditandoId);
  if (!cliente) {
    cancelarEdicion();
    return;
  }

  // Actualizamos los 8 campos conservando id y fecha originales (ver logica.js)
  clientes = aplicarEdicion(clientes, clienteEditandoId, datos);
  guardarClientes();

  clienteEditandoId = null;
  formulario.reset();
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
    formulario.reset();
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

  // Pie de la tarjeta: botones normales o paso de confirmación (nunca a la vez).
  // «Eliminar» solo lo pinta el administrador (RF-403)
  const pie = confirmando
    ? '<div class="confirmacion">¿Seguro?' +
        '<button type="button" class="boton-tarjeta boton-si" data-accion="confirmar-si" data-id="' + cliente.id + '">Sí, eliminar</button>' +
        '<button type="button" class="boton-tarjeta boton-no" data-accion="confirmar-no" data-id="' + cliente.id + '">No</button>' +
      "</div>"
    : '<div class="tarjeta-acciones">' +
        '<button type="button" class="boton-tarjeta boton-editar" data-accion="editar" data-id="' + cliente.id + '">Editar</button>' +
        (esAdmin(rol)
          ? '<button type="button" class="boton-tarjeta boton-eliminar" data-accion="eliminar" data-id="' + cliente.id + '">Eliminar</button>'
          : "") +
      "</div>";

  return (
    '<article class="tarjeta tarjeta-' + claseTipo(cliente.tipo) + (editando ? " editando" : "") + '">' +
      '<div class="tarjeta-cabecera">' +
        '<h3 class="tarjeta-empresa">' + escapar(cliente.empresa) + "</h3>" +
        '<span class="etiqueta etiqueta-' + claseTipo(cliente.tipo) + '">' +
          escapar(nombreTipo(cliente.tipo)) +
        "</span>" +
      "</div>" +
      '<dl class="datos-cliente">' +
        fila("CIF/NIF", cliente.cif) +
        fila("Persona de contacto", cliente.contacto) +
        fila("Teléfono", cliente.telefono) +
        fila("Correo", cliente.email) +
        fila("Dirección", cliente.direccion) +
      "</dl>" +
      cuadroMapa(cliente) +
      (cliente.notas ? '<p class="notas">' + escapar(cliente.notas) + "</p>" : "") +
      pie +
    "</article>"
  );
}

// Cuadro del mapa de Google Maps (spec 004):
// iframe con la ubicación; sin conexión se degrada a un enlace.
function cuadroMapa(cliente) {
  const direccion = texto(cliente.direccion);

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
// Acceso con clave y permisos (spec 006)
// =====================================================

// Claves vigentes: las que haya guardado el administrador, o las por defecto
function hashesVigentes() {
  try {
    const propios = JSON.parse(localStorage.getItem(CLAVE_ACCESO) || "null");
    if (propios && propios.usuario && propios.administrador) return propios;
  } catch (error) {
    // dato corrupto -> claves por defecto
  }
  return CLAVES_POR_DEFECTO;
}

function mostrarPantallaAcceso() {
  rol = null;
  contenidoApp.hidden = true;
  pantallaAcceso.hidden = false;
  errorAcceso.hidden = true;
  claveAcceso.value = "";
}

function mostrarApp() {
  pantallaAcceso.hidden = true;
  contenidoApp.hidden = false;
  panelAdmin.hidden = !esAdmin(rol); // RF-403: herramientas solo del admin
  pintarFiltros();
  pintarLista();
}

// Login: compara el hash de lo escrito con los hashes guardados (RF-402)
formularioAcceso.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const valor = claveAcceso.value.trim();
  if (valor === "") return;

  const hashes = hashesVigentes();
  const hash = await hashTexto(valor);

  let rolEncontrado = null;
  if (hash === hashes.usuario) rolEncontrado = "usuario";
  if (hash === hashes.administrador) rolEncontrado = "administrador";

  if (rolEncontrado === null) {
    errorAcceso.hidden = false;
    claveAcceso.value = "";
    claveAcceso.focus();
    return;
  }

  rol = rolEncontrado;
  sessionStorage.setItem(CLAVE_SESION, rol);
  if (recordarSesion.checked) {
    localStorage.setItem(CLAVE_SESION_PERSISTENTE, rol);
  } else {
    localStorage.removeItem(CLAVE_SESION_PERSISTENTE);
  }
  mostrarApp();
});

// Salir: borra la sesión y vuelve a pedir clave (RF-405)
botonSalir.addEventListener("click", function () {
  sessionStorage.removeItem(CLAVE_SESION);
  localStorage.removeItem(CLAVE_SESION_PERSISTENTE);
  mostrarPantallaAcceso();
});

// =====================================================
// Herramientas del administrador (spec 006)
// =====================================================

// Exportar: descarga un JSON con todos los clientes (RF-406)
botonExportar.addEventListener("click", function () {
  const contenido = JSON.stringify(clientes, null, 2);
  const blob = new Blob([contenido], { type: "application/json" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivoExportacion(new Date());
  enlace.click();
  URL.revokeObjectURL(enlace.href);
  pintarAviso("Clientes exportados");
});

// Importar: valida el archivo y pide confirmación antes de reemplazar (RF-407)
botonImportar.addEventListener("click", function () {
  archivoImportar.click();
});

archivoImportar.addEventListener("change", function () {
  const archivo = archivoImportar.files[0];
  archivoImportar.value = "";
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = function () {
    let datos = null;
    try {
      datos = JSON.parse(lector.result);
    } catch (error) {
      datos = null;
    }

    const resultado = validarImportacion(datos);
    if (!resultado.ok) {
      pintarAviso("Archivo no válido: " + resultado.error);
      return;
    }

    archivoPendiente = resultado.clientes;
    textoConfirmacion.textContent =
      "Se reemplazarán los " + clientes.length + " clientes actuales por los " +
      archivoPendiente.length + " del archivo.";
    confirmarImportacion.hidden = false;
  };
  lector.readAsText(archivo);
});

botonSiReemplazar.addEventListener("click", function () {
  if (!archivoPendiente) return;
  clientes = archivoPendiente;
  archivoPendiente = null;
  confirmarImportacion.hidden = true;
  guardarClientes();
  pintarLista();
  pintarAviso("Clientes importados");
});

botonCancelarImportar.addEventListener("click", function () {
  archivoPendiente = null;
  confirmarImportacion.hidden = true;
});

// Cambiar claves: se guardan hasheadas, nunca en claro (RF-404)
botonGuardarClaves.addEventListener("click", async function () {
  const nuevaUsuario = claveNuevaUsuario.value.trim();
  const nuevaAdmin = claveNuevaAdmin.value.trim();

  if (nuevaUsuario === "" || nuevaAdmin === "") {
    pintarAviso("Escribe las dos claves nuevas");
    return;
  }

  localStorage.setItem(CLAVE_ACCESO, JSON.stringify({
    usuario: await hashTexto(nuevaUsuario),
    administrador: await hashTexto(nuevaAdmin)
  }));
  claveNuevaUsuario.value = "";
  claveNuevaAdmin.value = "";
  pintarAviso("Claves actualizadas");
});

// =====================================================
// Primer pintado al abrir la página
// =====================================================

// Spec 004: si vuelve o se corta la conexión, refrescamos los cuadros de mapa
window.addEventListener("online", pintarLista);
window.addEventListener("offline", pintarLista);

// Spec 006: sin sesión iniciada solo se ve la pantalla de acceso (RF-401)
(function arrancar() {
  const guardada =
    localStorage.getItem(CLAVE_SESION_PERSISTENTE) ||
    sessionStorage.getItem(CLAVE_SESION);
  if (guardada === "usuario" || guardada === "administrador") {
    rol = guardada;
    mostrarApp();
  } else {
    mostrarPantallaAcceso();
  }
})();
