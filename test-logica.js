// =====================================================
// Tests de la lógica pura del Gestor de Clientes
// Ejecutar con: node --test
// =====================================================

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  texto,
  claseTipo,
  buscarCliente,
  construirCliente,
  aplicarEdicion,
  eliminarClienteDe,
  filtrarClientes,
  ordenarClientes,
  textoContador,
  mensajeAviso,
  debeMostrarMapa,
  urlMapa,
  urlBusquedaMapa,
  contenidoMapa,
  nombreTipo,
  normalizar,
  buscarClientes
} = require("./logica.js");

// Ayuda: un formulario falso con la interfaz de FormData (.get)
function formulario(valores) {
  return {
    get: function (campo) {
      return valores[campo];
    }
  };
}

const CLIENTE_V1 = {
  id: 1001,
  fecha: 1700000000000,
  empresa: "Textiles Norte",
  cif: "B12345678",
  contacto: "Ana",
  telefono: "600111222",
  email: "ana@textilesnorte.es",
  direccion: "Pol. Ind. Norte 4",
  tipo: "Tela",
  notas: "Pide presupuesto"
};

const LISTA = [
  CLIENTE_V1,
  { id: 1002, fecha: 1700000100000, empresa: "Asientos Vega", cif: "", contacto: "", telefono: "633444555", email: "", direccion: "", tipo: "FOAM", notas: "" },
  { id: 1003, fecha: 1700000200000, empresa: "Estructuras Delta", cif: "", contacto: "", telefono: "699888777", email: "", direccion: "", tipo: "Estructuras", notas: "" }
];

// ===== utilidades =====

test("texto quita espacios y trata vacíos como cadena vacía", () => {
  assert.equal(texto("  hola  "), "hola");
  assert.equal(texto(null), "");
  assert.equal(texto(undefined), "");
});

test("claseTipo convierte el tipo a minúsculas para las clases CSS", () => {
  assert.equal(claseTipo("Tela"), "tela");
  assert.equal(claseTipo("FOAM"), "foam");
  assert.equal(claseTipo("Estructuras"), "estructuras");
});

// ===== alta (RF-011: formato de datos) =====

test("construirCliente crea los 10 campos con id y fecha dados (RF-011)", () => {
  const nuevo = construirCliente(
    formulario({ empresa: "  Muebles Rápido  ", cif: "A1", contacto: "", telefono: " 611 ", email: "", direccion: "", tipo: "FOAM", notas: "nada" }),
    555,
    1760000000000
  );
  assert.deepEqual(Object.keys(nuevo), ["id", "fecha", "empresa", "cif", "contacto", "telefono", "email", "direccion", "tipo", "notas"]);
  assert.equal(nuevo.id, 555);
  assert.equal(nuevo.fecha, 1760000000000);
  assert.equal(nuevo.empresa, "Muebles Rápido");
  assert.equal(nuevo.telefono, "611");
});

// ===== edición (RF-007, RF-011) =====

test("aplicarEdicion conserva id y fecha y no duplica el cliente (RF-007)", () => {
  const editada = aplicarEdicion(LISTA, 1001, formulario({ empresa: "Textiles Norte S.L.", cif: "B1", contacto: "Ana", telefono: "600", email: "", direccion: "", tipo: "Tela", notas: "" }));
  assert.equal(editada.length, LISTA.length);
  const editado = buscarCliente(editada, 1001);
  assert.equal(editado.id, 1001);
  assert.equal(editado.fecha, CLIENTE_V1.fecha);
  assert.equal(editado.empresa, "Textiles Norte S.L.");
  // los demás quedan intactos
  assert.deepEqual(buscarCliente(editada, 1002), LISTA[1]);
});

test("aplicarEdicion con campos de formulario vacíos deja cadena vacía (tolerancia v1, RF-011)", () => {
  const editada = aplicarEdicion(LISTA, 1002, formulario({ empresa: "Asientos Vega", cif: undefined, contacto: undefined, telefono: "633", email: undefined, direccion: undefined, tipo: "FOAM", notas: undefined }));
  const editado = buscarCliente(editada, 1002);
  assert.equal(editado.cif, "");
  assert.equal(editado.notas, "");
});

test("aplicarEdicion con un id inexistente devuelve la lista sin cambios", () => {
  const editada = aplicarEdicion(LISTA, 9999, formulario({ empresa: "Nadie" }));
  assert.deepEqual(editada, LISTA);
});

// ===== eliminación (RF-008, RF-009, RF-011) =====

test("eliminarClienteDe quita solo ese cliente y conserva el resto (RF-008/RF-011)", () => {
  const resto = eliminarClienteDe(LISTA, 1002);
  assert.equal(resto.length, 2);
  assert.equal(buscarCliente(resto, 1002), undefined);
  assert.ok(buscarCliente(resto, 1001));
  assert.ok(buscarCliente(resto, 1003));
  // la lista original no se modifica
  assert.equal(LISTA.length, 3);
});

test("eliminarClienteDe con id inexistente no cambia nada (idempotente)", () => {
  assert.deepEqual(eliminarClienteDe(LISTA, 9999), LISTA);
});

// ===== filtros y orden (RF-010) =====

test("ordenarClientes pone lo más reciente primero", () => {
  const ordenados = ordenarClientes(LISTA);
  assert.deepEqual(ordenados.map(c => c.id), [1003, 1002, 1001]);
});

test("filtrarClientes 'Todos' devuelve todos sin tocar la lista original", () => {
  const copia = LISTA.slice();
  assert.deepEqual(filtrarClientes(LISTA, "Todos"), LISTA);
  assert.deepEqual(LISTA, copia);
});

test("filtrarClientes por tipo solo deja ese tipo y no muta la lista (RF-010)", () => {
  const tela = filtrarClientes(LISTA, "Tela");
  assert.equal(tela.length, 1);
  assert.equal(tela[0].empresa, "Textiles Norte");
  assert.equal(LISTA.length, 3);
  assert.deepEqual(filtrarClientes(LISTA, "Estructuras").map(c => c.id), [1003]);
});

// ===== contador y avisos (RF-012) =====

test("textoContador usa singular solo con 1 cliente", () => {
  assert.equal(textoContador(0), "0 clientes");
  assert.equal(textoContador(1), "1 cliente");
  assert.equal(textoContador(7), "7 clientes");
});

test("mensajeAviso devuelve los textos en español del toast (RF-012)", () => {
  assert.equal(mensajeAviso("actualizado"), "Cliente actualizado");
  assert.equal(mensajeAviso("eliminado"), "Cliente eliminado");
});

// ===== mapa de Google Maps (spec 004) =====

test("debeMostrarMapa solo con dirección real (RF-201/RF-202)", () => {
  assert.equal(debeMostrarMapa("Calle Mayor 12"), true);
  assert.equal(debeMostrarMapa("  Calle Mayor 12  "), true);
  assert.equal(debeMostrarMapa(""), false);
  assert.equal(debeMostrarMapa("   "), false);
  assert.equal(debeMostrarMapa(null), false);
});

test("urlMapa codifica la dirección y usa output=embed sin API key (RF-201)", () => {
  assert.equal(
    urlMapa("Calle Mayor 12, Madrid"),
    "https://www.google.com/maps?q=Calle%20Mayor%2012%2C%20Madrid&output=embed"
  );
  // acentos y ñ
  assert.ok(urlMapa("Avenida de la Constitución 4").includes("Constituci%C3%B3n"));
  // respeta espacios sobrantes del formulario
  assert.ok(urlMapa("  Pol. Ind. Norte 4  ").includes("Pol.%20Ind.%20Norte%204"));
});

test("urlBusquedaMapa genera el enlace de respaldo (RF-203)", () => {
  assert.equal(
    urlBusquedaMapa("Calle Mayor 12"),
    "https://www.google.com/maps/search/?api=1&query=Calle%20Mayor%2012"
  );
});

test("contenidoMapa devuelve enlace sin conexión y nada sin dirección (RF-203/RF-202)", () => {
  assert.equal(contenidoMapa("Calle Mayor 12", true), "iframe");
  assert.equal(contenidoMapa("Calle Mayor 12", false), "enlace");
  assert.equal(contenidoMapa("  ", true), "ninguno");
  assert.equal(contenidoMapa("", false), "ninguno");
});

// ===== buscador de texto y etiquetas (spec 005) =====

test("nombreTipo muestra Espuma en la interfaz y conserva el resto (RF-301)", () => {
  assert.equal(nombreTipo("FOAM"), "Espuma");
  assert.equal(nombreTipo("Tela"), "Tela");
  assert.equal(nombreTipo("Estructuras"), "Estructuras");
  assert.equal(nombreTipo(""), "");
});

test("normalizar quita mayúsculas, acentos y sobrantes (RF-303)", () => {
  assert.equal(normalizar("  Avenida de la Constitución 4 "), "avenida de la constitucion 4");
  assert.equal(normalizar("Asientos NÚÑEZ"), "asientos nunez");
  assert.equal(normalizar(null), "");
});

const LISTA_BUSCAR = [
  { id: 1, fecha: 1, empresa: "Textiles Norte", cif: "B12345678", contacto: "Nuria Peña", telefono: "600111222", email: "nuria@norte.es", direccion: "Calle Sol 1, Madrid", tipo: "Tela", notas: "" },
  { id: 2, fecha: 2, empresa: "Asientos Vega", cif: "", contacto: "Luis", telefono: "633444555", email: "", direccion: "", tipo: "FOAM", notas: "Pide presupuesto en OCTUBRE" },
  { id: 3, fecha: 3, empresa: "Estructuras Delta", cif: "", contacto: "", telefono: "699888777", email: "", direccion: "Avenida de la Constitución 4, Sevilla", tipo: "Estructuras", notas: "Obra grande" }
];

test("buscarClientes con consulta vacía devuelve toda la lista (RF-302)", () => {
  assert.equal(buscarClientes(LISTA_BUSCAR, "").length, 3);
  assert.equal(buscarClientes(LISTA_BUSCAR, "   ").length, 3);
});

test("buscarClientes encuentra por empresa ignorando mayúsculas (RF-302/RF-303)", () => {
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "textiles").map(c => c.id), [1]);
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "VEGA").map(c => c.id), [2]);
});

test("buscarClientes multi-palabra exige TODAS repartidas entre campos (RF-303)", () => {
  // "nuria" en contacto y "madrid" en dirección -> solo el cliente 1
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "nuria madrid").map(c => c.id), [1]);
  // "nuria" + "sevilla" no coinciden en ningún cliente
  assert.equal(buscarClientes(LISTA_BUSCAR, "nuria sevilla").length, 0);
});

test("buscarClientes ignora acentos y encuentra por teléfono (RF-303)", () => {
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "constitucion").map(c => c.id), [3]);
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "633444").map(c => c.id), [2]);
});

test("buscarClientes encuentra por tipo con «espuma» y con «foam» (RF-301/RF-302)", () => {
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "espuma").map(c => c.id), [2]);
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "foam").map(c => c.id), [2]);
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "tela").map(c => c.id), [1]);
});

test("buscarClientes sin coincidencias devuelve vacía y no muta la lista (RF-302)", () => {
  assert.equal(buscarClientes(LISTA_BUSCAR, "empresa que no existe").length, 0);
  assert.equal(LISTA_BUSCAR.length, 3);
});
