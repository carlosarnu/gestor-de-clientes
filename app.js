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

// Estado de la aplicación
let clientes = cargarClientes();
let filtroActivo = "Todos";
let textoBusqueda = ""; // texto del buscador (spec 005)
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
  formulario.movil.value = cliente.movil || "";
  formulario.email.value = cliente.email || "";
  formulario.direccion.value = cliente.direccion || "";
  formulario.codigoPostal.value = cliente.codigoPostal || "";
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

  // Actualizamos los 10 campos conservando id y fecha originales (ver logica.js)
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
        fila("Correo", cliente.email) +
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
