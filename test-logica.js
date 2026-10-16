// =====================================================
// Tests de la lógica pura del Gestor de Clientes
// Ejecutar con: node --test
// =====================================================

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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
  direccionCompleta,
  debeMostrarMapa,
  urlMapa,
  urlBusquedaMapa,
  contenidoMapa,
  nombreTipo,
  normalizar,
  buscarClientes,
  esTipoFijo,
  migrarTipos,
  nombreArchivoExportacion,
  CATALOGO_CAMPOS,
  normalizarSeleccion,
  alternarCampo,
  fechaTextoLocal,
  construirCeldas,
  construirFilas,
  dosDigitos,
  importarClientes,
  escaparAtributo
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
  movil: "655000111",
  email: "ana@textilesnorte.es",
  direccion: "Pol. Ind. Norte 4",
  codigoPostal: "28013",
  tipo: "Tela",
  notas: "Pide presupuesto"
};

const LISTA = [
  CLIENTE_V1,
  { id: 1002, fecha: 1700000100000, empresa: "Asientos Vega", cif: "", contacto: "", telefono: "633444555", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "Espuma", notas: "" },
  { id: 1003, fecha: 1700000200000, empresa: "Estructuras Delta", cif: "", contacto: "", telefono: "699888777", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "Estructuras", notas: "" }
];

// ===== utilidades =====

test("texto quita espacios y trata vacíos como cadena vacía", () => {
  assert.equal(texto("  hola  "), "hola");
  assert.equal(texto(null), "");
  assert.equal(texto(undefined), "");
});

test("claseTipo convierte el tipo a minúsculas para las clases CSS", () => {
  assert.equal(claseTipo("Tela"), "tela");
  assert.equal(claseTipo("Espuma"), "espuma");
  assert.equal(claseTipo("Estructuras"), "estructuras");
});

test("claseTipo agrupa cualquier tipo escrito en «otros» y deja vacío sin tipo (RF-604)", () => {
  assert.equal(claseTipo("Otros"), "otros");
  assert.equal(claseTipo("Toldos"), "otros");
  assert.equal(claseTipo("Cortinas"), "otros");
  assert.equal(claseTipo(""), "");
  assert.equal(claseTipo("  "), "");
});

test("esTipoFijo solo reconoce Tela, Espuma y Estructuras (RF-601)", () => {
  assert.equal(esTipoFijo("Tela"), true);
  assert.equal(esTipoFijo("Espuma"), true);
  assert.equal(esTipoFijo("Estructuras"), true);
  assert.equal(esTipoFijo("Otros"), false);
  assert.equal(esTipoFijo("Toldos"), false);
  assert.equal(esTipoFijo(""), false);
});

// ===== alta (RF-011: formato de datos) =====

test("construirCliente crea los 12 campos con id y fecha dados (RF-011, RF-502)", () => {
  const nuevo = construirCliente(
    formulario({ empresa: "  Muebles Rápido  ", cif: "A1", contacto: "", telefono: " 611 ", movil: "622333444", email: "", direccion: "Calle Luna 5", codigoPostal: "28002", tipo: "Espuma", notas: "nada" }),
    555,
    1760000000000
  );
  assert.deepEqual(Object.keys(nuevo), ["id", "fecha", "empresa", "cif", "contacto", "telefono", "movil", "email", "direccion", "codigoPostal", "tipo", "notas"]);
  assert.equal(nuevo.id, 555);
  assert.equal(nuevo.fecha, 1760000000000);
  assert.equal(nuevo.empresa, "Muebles Rápido");
  assert.equal(nuevo.telefono, "611");
  assert.equal(nuevo.movil, "622333444");
  assert.equal(nuevo.codigoPostal, "28002");
});

test("construirCliente con todo vacío guarda igual (nada es obligatorio, RF-501)", () => {
  const vacio = construirCliente(formulario({}), 1, 1760000000000);
  assert.equal(vacio.empresa, "");
  assert.equal(vacio.tipo, "");
  assert.equal(vacio.movil, "");
  assert.equal(vacio.codigoPostal, "");
});

test("construirCliente conserva el tipo personalizado escrito en «Otros» (RF-602)", () => {
  const libre = construirCliente(formulario({ tipo: "  Toldos  " }), 2, 1760000000000);
  assert.equal(libre.tipo, "Toldos"); // espacios recortados, texto tal cual
});

// ===== edición (RF-007, RF-011) =====

test("aplicarEdicion conserva id y fecha y no duplica el cliente (RF-007)", () => {
  const editada = aplicarEdicion(LISTA, 1001, formulario({ empresa: "Textiles Norte S.L.", cif: "B1", contacto: "Ana", telefono: "600", movil: "655777888", email: "", direccion: "", codigoPostal: "28013", tipo: "Tela", notas: "" }));
  assert.equal(editada.length, LISTA.length);
  const editado = buscarCliente(editada, 1001);
  assert.equal(editado.id, 1001);
  assert.equal(editado.fecha, CLIENTE_V1.fecha);
  assert.equal(editado.empresa, "Textiles Norte S.L.");
  assert.equal(editado.movil, "655777888"); // campo nuevo (spec 007)
  assert.equal(editado.codigoPostal, "28013");
  // los demás quedan intactos
  assert.deepEqual(buscarCliente(editada, 1002), LISTA[1]);
});

test("aplicarEdicion con campos de formulario vacíos deja cadena vacía (tolerancia v1, RF-011)", () => {
  const editada = aplicarEdicion(LISTA, 1002, formulario({ empresa: "Asientos Vega", cif: undefined, contacto: undefined, telefono: "633", email: undefined, direccion: undefined, tipo: "Espuma", notas: undefined }));
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

test("filtrarClientes 'Otros' deja lo no fijo con tipo y excluye vacíos y fijos (RF-603)", () => {
  const lista = LISTA.concat([
    { id: 1004, fecha: 1700000300000, empresa: "Toldos Sur", cif: "", contacto: "", telefono: "", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "Toldos", notas: "" },
    { id: 1005, fecha: 1700000400000, empresa: "Sin Tipo SL", cif: "", contacto: "", telefono: "", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "", notas: "" },
    { id: 1006, fecha: 1700000500000, empresa: "Genéricos", cif: "", contacto: "", telefono: "", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "Otros", notas: "" }
  ]);
  const copia = lista.slice();
  assert.deepEqual(filtrarClientes(lista, "Otros").map(c => c.id), [1004, 1006]); // libres y «Otros», nunca «Sin tipo»
  assert.deepEqual(filtrarClientes(lista, "Tela").map(c => c.id), [1001]); // los fijos siguen en su pestaña
  assert.deepEqual(filtrarClientes(lista, "Todos").length, 6);
  assert.deepEqual(lista, copia); // no muta
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

test('mensajeAviso("guardado") avisa del alta con «Cliente guardado» (RF-801)', () => {
  assert.equal(mensajeAviso("guardado"), "Cliente guardado");
  assert.equal(mensajeAviso("actualizado"), "Cliente actualizado"); // el resto no cambia
  assert.equal(mensajeAviso("eliminado"), "Cliente eliminado");
});

// ===== mapa de Google Maps (spec 004) =====

test("direccionCompleta une dirección y código postal (RF-503)", () => {
  assert.equal(direccionCompleta("Calle Sol 1, Madrid", "28001"), "Calle Sol 1, Madrid 28001");
  assert.equal(direccionCompleta("Calle Sol 1, Madrid", ""), "Calle Sol 1, Madrid");
  assert.equal(direccionCompleta("", "28001"), "28001");
  assert.equal(direccionCompleta("  ", "  "), "");
  assert.equal(direccionCompleta(null, undefined), "");
});

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

test("nombreTipo muestra «Sin tipo» si está vacío y el texto tal cual si no (RF-504)", () => {
  assert.equal(nombreTipo("Espuma"), "Espuma");
  assert.equal(nombreTipo("Tela"), "Tela");
  assert.equal(nombreTipo("Estructuras"), "Estructuras");
  assert.equal(nombreTipo("Otros"), "Otros");
  assert.equal(nombreTipo(""), "Sin tipo");
  assert.equal(nombreTipo(null), "Sin tipo");
});

test("normalizar quita mayúsculas, acentos y sobrantes (RF-303)", () => {
  assert.equal(normalizar("  Avenida de la Constitución 4 "), "avenida de la constitucion 4");
  assert.equal(normalizar("Asientos NÚÑEZ"), "asientos nunez");
  assert.equal(normalizar(null), "");
});

const LISTA_BUSCAR = [
  { id: 1, fecha: 1, empresa: "Textiles Norte", cif: "B12345678", contacto: "Nuria Peña", telefono: "600111222", movil: "611999888", email: "nuria@norte.es", direccion: "Calle Sol 1, Madrid", codigoPostal: "28001", tipo: "Tela", notas: "" },
  { id: 2, fecha: 2, empresa: "Asientos Vega", cif: "", contacto: "Luis", telefono: "633444555", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "Espuma", notas: "Pide presupuesto en OCTUBRE" },
  { id: 3, fecha: 3, empresa: "Estructuras Delta", cif: "", contacto: "", telefono: "699888777", movil: "", email: "", direccion: "Avenida de la Constitución 4, Sevilla", codigoPostal: "41001", tipo: "Estructuras", notas: "Obra grande" }
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

test("buscarClientes encuentra por tipo con «espuma» y con «tela» (RF-301/RF-302)", () => {
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "espuma").map(c => c.id), [2]);
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "tela").map(c => c.id), [1]);
});

test("buscarClientes sin coincidencias devuelve vacía y no muta la lista (RF-302)", () => {
  assert.equal(buscarClientes(LISTA_BUSCAR, "empresa que no existe").length, 0);
  assert.equal(LISTA_BUSCAR.length, 3);
});

test("buscarClientes encuentra por móvil y por código postal (RF-502)", () => {
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "611999").map(c => c.id), [1]);
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "28001").map(c => c.id), [1]);
  assert.deepEqual(buscarClientes(LISTA_BUSCAR, "41001").map(c => c.id), [3]);
  assert.equal(buscarClientes(LISTA_BUSCAR, "000555").length, 0); // no existe en ningún sitio
});

// ===== migración FOAM -> Espuma (spec 009) =====

test("migrarTipos cambia el tipo antiguo «FOAM» a «Espuma» sin tocar nada más (RF-702)", () => {
  const lista = [
    { id: 1, fecha: 1, empresa: "Asientos Vega", cif: "", contacto: "", telefono: "633", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "FOAM", notas: "se conserva" },
    { id: 2, fecha: 2, empresa: "Textiles Norte", cif: "", contacto: "", telefono: "", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "Tela", notas: "" }
  ];
  const migrada = migrarTipos(lista);
  assert.equal(migrada[0].tipo, "Espuma");
  assert.equal(migrada[0].notas, "se conserva"); // los datos sagrados intactos
  assert.equal(migrada[0].id, 1);
  assert.equal(migrada[1].tipo, "Tela"); // el resto de tipos no se tocan
  assert.equal(lista[0].tipo, "FOAM"); // la lista original queda como estaba
});

test("migrarTipos con nada que migrar devuelve la MISMA lista (idempotente, RF-702)", () => {
  const lista = [{ id: 1, fecha: 1, empresa: "", cif: "", contacto: "", telefono: "", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "Espuma", notas: "" }];
  assert.equal(migrarTipos(lista), lista);
  const vacia = [];
  assert.equal(migrarTipos(vacia), vacia);
});

// ===== exportación e importación (spec 011) =====

test("nombreArchivoExportacion usa la fecha LOCAL con ceros (RF-905)", () => {
  assert.equal(nombreArchivoExportacion(new Date(2026, 0, 5)), "clientes-2026-01-05.json");
  assert.equal(nombreArchivoExportacion(new Date(2026, 11, 31)), "clientes-2026-12-31.json");
  // Pasada la medianoche local el día es el LOCAL (con UTC se adelantaría al día anterior)
  assert.equal(nombreArchivoExportacion(new Date(2026, 0, 1, 0, 30)), "clientes-2026-01-01.json");
});

test("importarClientes con JSON inválido da error y clientes null (RF-905)", () => {
  const resultado = importarClientes("esto no es json {{{");
  assert.equal(resultado.clientes, null);
  assert.equal(resultado.error, "El archivo no tiene un formato JSON válido");
  // cadena vacía: tampoco es JSON
  assert.equal(importarClientes("").error, "El archivo no tiene un formato JSON válido");
});

test("importarClientes con JSON que no es lista da error (RF-905)", () => {
  const resultado = importarClientes('{"empresa": "Textiles Norte"}');
  assert.equal(resultado.clientes, null);
  assert.equal(resultado.error, "El archivo no contiene una lista de clientes");
});

test("importarClientes normaliza los campos que faltan y descarta lo que no sea objeto (RF-905)", () => {
  const resultado = importarClientes(JSON.stringify([
    { empresa: "  Muebles Rápido  ", telefono: " 611 " },
    "basura",
    null,
    { id: "abc", fecha: "ayer", cif: 12345 }
  ]));
  assert.equal(resultado.error, null);
  assert.equal(resultado.clientes.length, 2); // la basura se ignora
  const cliente = resultado.clientes[0];
  assert.deepEqual(Object.keys(cliente), ["id", "fecha", "empresa", "cif", "contacto", "telefono", "movil", "email", "direccion", "codigoPostal", "tipo", "notas"]);
  assert.equal(cliente.empresa, "Muebles Rápido"); // espacios recortados
  assert.equal(cliente.telefono, "611");
  assert.equal(cliente.cif, ""); // lo que falta, vacío
  assert.equal(cliente.movil, "");
  assert.equal(cliente.notas, "");
  assert.equal(typeof cliente.id, "number");
  assert.equal(typeof cliente.fecha, "number");
  const tambien = resultado.clientes[1];
  assert.equal(typeof tambien.id, "number"); // id/fecha no numéricos se asignan
  assert.equal(typeof tambien.fecha, "number");
  assert.ok(Number.isFinite(tambien.id));
  assert.equal(tambien.cif, "12345"); // texto() convierte a cadena
});

test("importarClientes migra «FOAM» a «Espuma» y conserva id y fecha válidos (RF-905)", () => {
  const resultado = importarClientes(JSON.stringify([
    { id: 10, fecha: 1700000000000, empresa: "Asientos Vega", cif: "", contacto: "", telefono: "633", movil: "", email: "", direccion: "", codigoPostal: "", tipo: "FOAM", notas: "se conserva" }
  ]));
  assert.equal(resultado.error, null);
  assert.equal(resultado.clientes[0].tipo, "Espuma");
  assert.equal(resultado.clientes[0].notas, "se conserva");
  assert.equal(resultado.clientes[0].id, 10);
  assert.equal(resultado.clientes[0].fecha, 1700000000000);
});

test("importarClientes con lista vacía devuelve lista vacía sin error (RF-905)", () => {
  const resultado = importarClientes("[]");
  assert.deepEqual(resultado, { clientes: [], error: null });
});

// ===== listado compacto con selector de campos (spec 012) =====

// Reloj inyectado en las pruebas de fecha: 16/10/2026 a las 12:00 (hora local)
const HOY = new Date(2026, 9, 16, 12, 0, 0);

// Cliente sin ningún dato, para las convenciones de celdas (RF-1004)
const CLIENTE_SIN_DATOS = {
  id: 7,
  fecha: new Date(2026, 9, 10, 8, 30).getTime(),
  empresa: "", cif: "", contacto: "", telefono: "", movil: "",
  email: "", direccion: "", codigoPostal: "", tipo: "", notas: ""
};

test("CATALOGO_CAMPOS lista los 11 campos en orden de formulario con «Fecha de alta» al final (RF-1002/RF-1005)", () => {
  assert.equal(CATALOGO_CAMPOS.length, 11);
  assert.deepEqual(CATALOGO_CAMPOS.map(c => c.clave), [
    "empresa", "cif", "contacto", "telefono", "movil", "email",
    "direccion", "codigoPostal", "tipo", "notas", "fecha"
  ]);
  assert.deepEqual(CATALOGO_CAMPOS.map(c => c.etiqueta), [
    "Empresa", "CIF", "Contacto", "Teléfono", "Móvil", "Correo electrónico",
    "Dirección", "Código postal", "Tipo", "Notas", "Fecha de alta"
  ]);
  // el id nunca se ofrece y ninguna clave se repite
  assert.equal(CATALOGO_CAMPOS.some(c => c.clave === "id"), false);
  assert.equal(new Set(CATALOGO_CAMPOS.map(c => c.clave)).size, 11);
});

test("normalizarSeleccion descarta claves fuera del catálogo y respeta su orden (RF-1005)", () => {
  assert.deepEqual(normalizarSeleccion(["notas", "empresa"]), ["empresa", "notas"]);
  assert.deepEqual(normalizarSeleccion(["tipo", "cif"]), ["cif", "tipo"]);
  assert.deepEqual(normalizarSeleccion(["id", "provincia", "empresa"]), ["empresa"]);
});

test("normalizarSeleccion quita las claves duplicadas (RF-1005)", () => {
  assert.deepEqual(normalizarSeleccion(["empresa", "empresa", "cif", "empresa"]), ["empresa", "cif"]);
});

test("normalizarSeleccion con selección vacía o inválida vuelve a «solo Empresa» (RF-1002/RF-1005)", () => {
  assert.deepEqual(normalizarSeleccion([]), ["empresa"]);
  assert.deepEqual(normalizarSeleccion(["id", "loquesea", ""]), ["empresa"]);
  assert.deepEqual(normalizarSeleccion(undefined), ["empresa"]);
  assert.deepEqual(normalizarSeleccion(null), ["empresa"]);
});

test("alternarCampo marca y desmarca sin mutar la selección original (RF-1002)", () => {
  const seleccion = ["empresa"];
  const conCif = alternarCampo(seleccion, "cif");
  assert.deepEqual(conCif, ["empresa", "cif"]);
  assert.deepEqual(seleccion, ["empresa"]); // la entrada no se toca
  assert.deepEqual(alternarCampo(conCif, "cif"), ["empresa"]); // vuelve a desmarcar
});

test("alternarCampo devuelve la selección en orden del catálogo (RF-1002/RF-1005)", () => {
  assert.deepEqual(alternarCampo(["empresa"], "tipo"), ["empresa", "tipo"]);
  assert.deepEqual(alternarCampo(["empresa", "tipo"], "cif"), ["empresa", "cif", "tipo"]);
});

test("alternarCampo al desmarcar el último campo vuelve a «solo Empresa» sin error (RF-1002)", () => {
  assert.deepEqual(alternarCampo(["empresa"], "empresa"), ["empresa"]);
  assert.deepEqual(alternarCampo(["tipo"], "tipo"), ["empresa"]);
  assert.deepEqual(alternarCampo(["empresa", "cif"], "cif"), ["empresa"]);
});

test("alternarCampo ignora las claves fuera del catálogo (RF-1002/RF-1005)", () => {
  assert.deepEqual(alternarCampo(["empresa"], "id"), ["empresa"]);
  assert.deepEqual(alternarCampo(["empresa"], "loquesea"), ["empresa"]);
});

test("fechaTextoLocal devuelve dd/mm/aaaa con ceros en la fecha local (RF-1005)", () => {
  assert.equal(fechaTextoLocal(new Date(2026, 2, 5, 9, 15).getTime(), HOY), "05/03/2026");
  assert.equal(fechaTextoLocal(new Date(2025, 11, 31, 23, 59).getTime(), HOY), "31/12/2025");
  assert.equal(fechaTextoLocal(HOY.getTime(), HOY), "16/10/2026"); // hoy mismo también es válida
  // el reloj puede inyectarse como Date (plan) o como epoch en milisegundos
  assert.equal(fechaTextoLocal(new Date(2026, 0, 5).getTime(), new Date(2026, 5, 1).getTime()), "05/01/2026");
});

test("fechaTextoLocal con alta tras la medianoche muestra el día LOCAL, no el de UTC (RF-1002/RF-1005)", () => {
  // 00:30 del día 1: con toISOString el día se desplazaría según la zona horaria
  assert.equal(fechaTextoLocal(new Date(2026, 0, 1, 0, 30).getTime(), HOY), "01/01/2026");
  assert.equal(fechaTextoLocal(new Date(2026, 5, 30, 0, 0, 1).getTime(), HOY), "30/06/2026");
});

test("fechaTextoLocal admite cualquier hora de mañana y rechaza desde pasado mañana (RF-1005, decisión del usuario 2026-10-16)", () => {
  // mañana (17/10) a cualquier hora: válida, aunque sea de madrugada
  assert.equal(fechaTextoLocal(new Date(2026, 9, 17, 0, 30).getTime(), HOY), "17/10/2026");
  assert.equal(fechaTextoLocal(new Date(2026, 9, 17, 23, 59).getTime(), HOY), "17/10/2026");
  // pasado mañana (18/10): «—», incluido el primer segundo del día
  assert.equal(fechaTextoLocal(new Date(2026, 9, 18).getTime(), HOY), "");
  assert.equal(fechaTextoLocal(new Date(2026, 9, 18, 0, 30).getTime(), HOY), "");
  assert.equal(fechaTextoLocal(new Date(2026, 9, 18, 9, 0).getTime(), HOY), "");
  assert.equal(fechaTextoLocal(new Date(2030, 0, 1).getTime(), HOY), "");
});

test("fechaTextoLocal con fecha no numérica devuelve cadena vacía (RF-1005)", () => {
  assert.equal(fechaTextoLocal("ayer", HOY), "");
  assert.equal(fechaTextoLocal(NaN, HOY), "");
  assert.equal(fechaTextoLocal(Infinity, HOY), "");
  assert.equal(fechaTextoLocal(null, HOY), "");
  assert.equal(fechaTextoLocal(undefined, HOY), "");
  assert.equal(fechaTextoLocal({}, HOY), "");
});

test("fechaTextoLocal no usa toISOString, fechas de texto ni días en milisegundos (RF-1005, skill local-dates)", () => {
  // revisión de la fuente de logica.js: prohibido el día en UTC y los días fijos
  const fuente = fs.readFileSync(path.join(__dirname, "logica.js"), "utf8");
  assert.equal(/\.toISOString\(/.test(fuente), false);
  assert.equal(/new Date\(\s*["']/.test(fuente), false);
  assert.equal(/86400000/.test(fuente), false);
});

test("construirCeldas devuelve etiqueta y valor por celda elegida, en orden del catálogo y sin HTML (RF-1004/RF-1005)", () => {
  const celdas = construirCeldas(CLIENTE_V1, ["email", "empresa"], HOY);
  assert.deepEqual(celdas, [
    { clave: "empresa", etiqueta: "Empresa", valor: "Textiles Norte" },
    { clave: "email", etiqueta: "Correo electrónico", valor: "ana@textilesnorte.es" }
  ]);
  // los datos llegan crudos: el escapado lo hace app.js al pintar, aquí no hay marcas
  const conNotas = Object.assign({}, CLIENTE_V1, { notas: "<b>urgente</b>" });
  assert.equal(construirCeldas(conNotas, ["notas"], HOY)[0].valor, "<b>urgente</b>");
  // una clave fuera del catálogo no genera columna
  assert.equal(construirCeldas(CLIENTE_V1, ["id", "empresa"], HOY).length, 1);
});

test("construirCeldas aplica las convenciones de celdas vacías (RF-1004)", () => {
  const celdas = construirCeldas(CLIENTE_SIN_DATOS, ["empresa", "tipo", "telefono", "notas", "fecha"], HOY);
  // en orden del catálogo: Teléfono (4.º) va antes que Tipo (9.º)
  assert.deepEqual(celdas.map(c => c.clave), ["empresa", "telefono", "tipo", "notas", "fecha"]);
  assert.deepEqual(celdas.map(c => c.valor), ["Sin nombre", "—", "Sin tipo", "—", "10/10/2026"]);
  // tipo libre (spec 008): se muestra su texto
  const toldos = Object.assign({}, CLIENTE_SIN_DATOS, { tipo: "Toldos" });
  assert.equal(construirCeldas(toldos, ["tipo"], HOY)[0].valor, "Toldos");
  // fecha ausente o inválida: «—» sin romper el listado
  const sinFecha = Object.assign({}, CLIENTE_SIN_DATOS, { fecha: "ayer" });
  assert.equal(construirCeldas(sinFecha, ["fecha"], HOY)[0].valor, "—");
});

test("construirFilas conserva número, orden e id de la lista de entrada (RF-1003/RF-1005)", () => {
  const filas = construirFilas(LISTA, ["empresa", "tipo"], HOY);
  assert.equal(filas.length, 3);
  assert.deepEqual(filas.map(f => f.id), [1001, 1002, 1003]);
  assert.deepEqual(filas[1], {
    id: 1002,
    celdas: [
      { clave: "empresa", etiqueta: "Empresa", valor: "Asientos Vega" },
      { clave: "tipo", etiqueta: "Tipo", valor: "Espuma" }
    ]
  });
});

test("construirFilas con lista vacía devuelve vacío (RF-1005)", () => {
  assert.deepEqual(construirFilas([], ["empresa"], HOY), []);
});

test("dosDigitos rellena a dos cifras y está exportada (RF-1005)", () => {
  assert.equal(dosDigitos(0), "00");
  assert.equal(dosDigitos(5), "05");
  assert.equal(dosDigitos(9), "09");
  assert.equal(dosDigitos(10), "10");
  assert.equal(dosDigitos(27), "27");
});

// ===== Escape de atributos (corrección del reviewer, ronda 1) =====

test("escaparAtributo conserva el texto completo con comillas y etiquetas (RF-1004)", () => {
  assert.equal(
    escaparAtributo('Nota con "comillas" y <b>etiqueta</b>.'),
    "Nota con &quot;comillas&quot; y &lt;b&gt;etiqueta&lt;/b&gt;."
  );
});

test("escaparAtributo neutraliza la inyección de atributos (reviewer)", () => {
  const payload = 'x" onmouseover="window.__inyectado=1';
  const salida = escaparAtributo(payload);
  assert.equal(salida, "x&quot; onmouseover=&quot;window.__inyectado=1");
  // Ni una comilla cruda: el atributo no puede cerrarse ni inyectar otros
  assert.equal(salida.indexOf('"'), -1);
});

test("escaparAtributo escapa el «&» primero y sin doble escape", () => {
  assert.equal(escaparAtributo('a & "b"'), "a &amp; &quot;b&quot;");
  assert.equal(escaparAtributo("R&D < 5 && 6 > 2"), "R&amp;D &lt; 5 &amp;&amp; 6 &gt; 2");
});

test("escaparAtributo escapa comillas simples y trata vacíos/nulos como texto()", () => {
  assert.equal(escaparAtributo("O'Connor"), "O&#39;Connor");
  assert.equal(escaparAtributo(""), "");
  assert.equal(escaparAtributo(null), "");
  assert.equal(escaparAtributo(undefined), "");
});

test("escaparAtributo sobre una celda real de construirCeldas deja el valor sin comillas crudas (RF-1004/RF-1005)", () => {
  const cliente = construirCliente(formulario({ empresa: "Vega", tipo: "Tela", notas: 'x" onmouseover="window.__inyectado=1' }), 1000, 1000);
  const celda = construirCeldas(cliente, ["notas"], HOY)[0];
  const pintado = escaparAtributo(celda.valor);
  assert.equal(celda.valor, 'x" onmouseover="window.__inyectado=1'); // la lógica pura NO maquilla
  assert.equal(pintado.indexOf('"'), -1); // el pintado en atributo, sí
});
