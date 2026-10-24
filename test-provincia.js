// =====================================================
// Tests de la lógica de provincia (spec 015)
// Ejecutar con: node --test
// =====================================================

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  provinciaCliente,
  provinciasExistentes,
  coincideProvincia,
  filtrarPorProvincia,
  provinciaValida,
  SIN_PROVINCIA,
  marcasProvinciaValidas,
  nombreMarcasProvincias,
  construirCliente,
  actualizarCliente,
  buscarClientes,
  filtrarClientes,
  importarClientes,
  CATALOGO_CAMPOS,
  normalizarSeleccion,
  construirCeldas,
  textoContextoImpresion
} = require("./logica.js");

// Ayuda: un formulario falso con la interfaz de FormData (.get)
function formulario(valores) {
  return {
    get: function (campo) {
      return valores[campo];
    }
  };
}

// Reloj inyectado en las pruebas de celda: 16/10/2026 a las 12:00 (hora local)
const HOY = new Date(2026, 9, 16, 12, 0, 0);

// ===== 1. Lectura tolerante (RF-1301) =====

test("provinciaCliente aplica la regla de texto(): falsy → «», número y objeto a texto, recortado (RF-1301)", () => {
  // sin cliente o sin campo: cadena vacía
  assert.equal(provinciaCliente(undefined), "");
  assert.equal(provinciaCliente(null), "");
  assert.equal(provinciaCliente("Textiles Norte"), "");
  assert.equal(provinciaCliente({}), "");
  assert.equal(provinciaCliente({ provincia: undefined }), "");
  // falsy → «» (nunca «false»), igual que el resto de campos de texto
  assert.equal(provinciaCliente({ provincia: null }), "");
  assert.equal(provinciaCliente({ provincia: false }), "");
  assert.equal(provinciaCliente({ provincia: 0 }), "");
  assert.equal(provinciaCliente({ provincia: "" }), "");
  assert.equal(provinciaCliente({ provincia: "   " }), "");
  // número no cero u objeto → convertidos a texto
  assert.equal(provinciaCliente({ provincia: 29 }), "29");
  assert.equal(provinciaCliente({ provincia: {} }), "[object Object]");
  // texto normal: recortado
  assert.equal(provinciaCliente({ provincia: "  Málaga  " }), "Málaga");
});

// ===== 2. Provincias existentes (RF-1305) =====

test("provinciasExistentes devuelve strings únicos por normalizar(), primera forma guardada y sin vacíos (RF-1305)", () => {
  const lista = [
    { provincia: "Cádiz" },
    { provincia: "cadiz" },       // misma provincia normalizada: no duplica
    { provincia: " MÁLAGA " },    // primera forma de Málaga (recortada)
    { provincia: "" },            // vacío fuera
    { provincia: "Málaga" },      // ya vista
    { provincia: undefined },     // sin campo fuera
    { provincia: "   " }          // solo espacios fuera
  ];
  assert.deepEqual(provinciasExistentes(lista), ["Cádiz", "MÁLAGA"]);
});

test("provinciasExistentes ordena con localeCompare «es» y devuelve siempre strings (RF-1305)", () => {
  const lista = [
    { provincia: "Valencia" },
    { provincia: "Murcia" },
    { provincia: "Alicante" },
    { provincia: "Cádiz" },
    { provincia: "Castellón" }
  ];
  assert.deepEqual(provinciasExistentes(lista),
    ["Alicante", "Cádiz", "Castellón", "Murcia", "Valencia"]);
  // sin provincias: array vacío
  assert.deepEqual(provinciasExistentes([]), []);
  assert.deepEqual(provinciasExistentes([{ empresa: "Sin provincia" }]), []);
});

// ===== 3. Coincidencia normalizada (RF-1305) =====

test("coincideProvincia compara normalizando acentos y mayúsculas; sin provincia o filtro vacío → false (RF-1305)", () => {
  assert.equal(coincideProvincia({ provincia: "Cádiz" }, "cadiz"), true);
  assert.equal(coincideProvincia({ provincia: "cadiz" }, "CÁDIZ"), true);
  assert.equal(coincideProvincia({ provincia: "MÁLAGA" }, "  Málaga  "), true);
  assert.equal(coincideProvincia({ provincia: "Cádiz" }, "Málaga"), false);
  assert.equal(coincideProvincia({ provincia: "" }, "Cádiz"), false); // sin provincia nunca coincide
  assert.equal(coincideProvincia({}, "Cádiz"), false);
  assert.equal(coincideProvincia({ provincia: "Cádiz" }, ""), false); // filtro vacío: sin filtrar
});

// ===== 4. Filtro por provincia (RF-1305) =====

const LISTA_PROVINCIAS = [
  { id: 1, empresa: "Toldos Cádiz", provincia: "Cádiz", tipos: ["Tela"], tipo: "Tela" },
  { id: 2, empresa: "Manta Málaga", provincia: "Málaga", tipos: ["Tela", "Espuma"], tipo: "Tela" },
  { id: 3, empresa: "Delta", provincia: "cadiz", tipos: ["Estructuras"], tipo: "Estructuras" },
  { id: 4, empresa: "Sin sitio", provincia: "", tipos: ["Tela"], tipo: "Tela" },
  { id: 5, empresa: "Otro cadiz", provincia: undefined, tipos: ["Espuma"], tipo: "Espuma" }
];

test("filtrarPorProvincia con la lista vacía devuelve la lista completa y con provincia solo la coincidente normalizada (RF-1305, RF-1603)", () => {
  assert.deepEqual(filtrarPorProvincia(LISTA_PROVINCIAS, []), LISTA_PROVINCIAS);
  assert.deepEqual(filtrarPorProvincia(LISTA_PROVINCIAS, ["Málaga"]).map(c => c.id), [2]);
  // «Cádiz» y «cadiz» son la misma provincia PARA EL filtro (los datos no cambian)
  assert.deepEqual(filtrarPorProvincia(LISTA_PROVINCIAS, ["cadiz"]).map(c => c.id), [1, 3]);
  // con una provincia real marcada, los sin provincia NO pasan si la fija no está marcada
  assert.equal(filtrarPorProvincia(LISTA_PROVINCIAS, ["Cádiz"]).some(c => c.id === 4 || c.id === 5), false);
});

test("filtrarPorProvincia se combina en Y con el filtro de tipo (RF-1305, RF-1604)", () => {
  const porTipo = filtrarClientes(LISTA_PROVINCIAS, ["Tela"]); // ids 1, 2, 4
  assert.deepEqual(filtrarPorProvincia(porTipo, ["Cádiz"]).map(c => c.id), [1]);
  assert.deepEqual(filtrarPorProvincia(porTipo, ["Málaga"]).map(c => c.id), [2]);
  assert.deepEqual(filtrarPorProvincia(porTipo, ["Cádiz"]).length, 1);
});

// ===== 5. Validación de marcas de provincia (spec 018, RF-1605) =====

test("marcasProvinciaValidas conserva las marcas existentes alineadas a la primera forma guardada (RF-1605)", () => {
  const opciones = ["Cádiz", "MÁLAGA", "Valencia"]; // salida de provinciasExistentes
  assert.deepEqual(marcasProvinciaValidas(opciones, ["malaga"]), ["MÁLAGA"]);  // homófono alineado
  assert.deepEqual(marcasProvinciaValidas(opciones, ["  Cádiz  "]), ["Cádiz"]); // recortado y alineado
  assert.deepEqual(marcasProvinciaValidas(opciones, ["Valencia"]), ["Valencia"]);
  assert.deepEqual(marcasProvinciaValidas(opciones, ["Valencia", "malaga"]), ["Valencia", "MÁLAGA"]);
});

test("marcasProvinciaValidas desmarca sola la marca huérfana que ya no existe entre las opciones (RF-1605)", () => {
  const opciones = ["Valencia"];
  assert.deepEqual(marcasProvinciaValidas(opciones, ["Castellón"]), []);            // desapareció
  assert.deepEqual(marcasProvinciaValidas(opciones, ["Castellón", "Valencia"]), ["Valencia"]);
  assert.deepEqual(marcasProvinciaValidas([], ["Valencia"]), []);                   // sin opciones
  assert.deepEqual(marcasProvinciaValidas(opciones, []), []);                       // sin marcas
  assert.deepEqual(marcasProvinciaValidas(opciones, undefined), []);                // no-array: sin marcas
});

test("marcasProvinciaValidas conserva SIEMPRE la fija SIN_PROVINCIA («»), nunca se desmarca sola (RF-1605, Decisión 11)", () => {
  const opciones = ["Valencia"];
  assert.equal(SIN_PROVINCIA, "");                       // la casilla fija se codifica como «»
  assert.deepEqual(marcasProvinciaValidas(opciones, [""]), [""]);
  assert.deepEqual(marcasProvinciaValidas(opciones, ["Castellón", ""]), [""]);    // la huérfana fuera, la fija dentro
  assert.deepEqual(marcasProvinciaValidas([], ["", "Valencia"]), [""]);           // aun sin opciones ni sin-provincia en los datos
  assert.deepEqual(marcasProvinciaValidas(opciones, ["", ""]), [""]);             // sin duplicar la fija
});

test("marcasProvinciaValidas unifica las variantes homófonas de una misma provincia en una sola marca (RF-1605)", () => {
  const opciones = ["Cádiz", "Málaga"];
  assert.deepEqual(marcasProvinciaValidas(opciones, ["cadiz", "CÁDIZ"]), ["Cádiz"]);
  assert.deepEqual(marcasProvinciaValidas(opciones, ["MÁLAGA", "malaga"]), ["Málaga"]);
});

test("provinciaValida (compatibilidad de la 015, decisión T-05: se mantiene) delega en marcasProvinciaValidas", () => {
  const provincias = ["Cádiz", "MÁLAGA"]; // salida de provinciasExistentes: strings
  assert.equal(provinciaValida(provincias, "malaga"), "MÁLAGA"); // alineada a la primera forma (antes: «malaga» a secas)
  assert.equal(provinciaValida(provincias, "Málaga"), "MÁLAGA"); // homófono alineado a la opción «MÁLAGA» (el filtrado no cambia: normaliza)
  assert.equal(provinciaValida(provincias, "  Cádiz  "), "Cádiz");
  assert.equal(provinciaValida(provincias, "Valencia"), "");    // ya no existe
  assert.equal(provinciaValida(provincias, ""), "");            // sin selección
  assert.equal(provinciaValida([], "Cádiz"), "");               // sin opciones
});

// ===== 6. Búsqueda por provincia (RF-1304) =====

const CLIENTE_PROV = {
  id: 9,
  empresa: "Toldos Bahía",
  provincia: "Málaga",
  tipos: ["Tela"],
  tipo: "Tela"
};

test("textoBusquedaCliente incluye la provincia: «malaga» encuentra a «Málaga» ignorando acentos (RF-1304)", () => {
  assert.equal(buscarClientes([CLIENTE_PROV], "malaga").length, 1);
  assert.equal(buscarClientes([CLIENTE_PROV], "MÁLAGA").length, 1);
  assert.equal(buscarClientes([CLIENTE_PROV], "almeria").length, 0);
});

test("la búsqueda multi-palabra se reparte entre provincia y otros campos (RF-1304)", () => {
  assert.equal(buscarClientes([CLIENTE_PROV], "malaga toldos").length, 1); // provincia + empresa
  assert.equal(buscarClientes([CLIENTE_PROV], "bahia tela").length, 1);    // empresa + tipo
  assert.equal(buscarClientes([CLIENTE_PROV], "malaga toledo").length, 0);
});

// ===== 7. Catálogo de campos (RF-1307) =====

test("CATALOGO_CAMPOS tiene 12 entradas con «provincia» entre código postal y tipo (RF-1307)", () => {
  assert.equal(CATALOGO_CAMPOS.length, 12);
  assert.deepEqual(CATALOGO_CAMPOS.map(c => c.clave), [
    "empresa", "cif", "contacto", "telefono", "movil", "email",
    "direccion", "codigoPostal", "provincia", "tipo", "notas", "fecha"
  ]);
  assert.deepEqual(CATALOGO_CAMPOS.map(c => c.etiqueta), [
    "Empresa", "CIF", "Contacto", "Teléfono", "Móvil", "Correo electrónico",
    "Dirección", "Código postal", "Provincia", "Tipo", "Notas", "Fecha de alta"
  ]);
  // normalizarSeleccion acepta «provincia» y la coloca según el catálogo
  assert.deepEqual(normalizarSeleccion(["id", "provincia", "empresa"]), ["empresa", "provincia"]);
  assert.deepEqual(normalizarSeleccion(["tipo", "provincia"]), ["provincia", "tipo"]);
});

// ===== 8. Celdas del listado (RF-1307) =====

test("construirCeldas de provincia: «—» sin valor y el texto tal cual con valor (RF-1307)", () => {
  const sinProvincia = construirCeldas({ empresa: "Delta" }, ["provincia"], HOY);
  assert.deepEqual(sinProvincia, [{ clave: "provincia", etiqueta: "Provincia", valor: "—" }]);
  const conProvincia = construirCeldas({ empresa: "Delta", provincia: "Málaga" }, ["provincia"], HOY);
  assert.equal(conProvincia[0].valor, "Málaga");
});

// ===== 9. Alta y edición (RF-1302, lógica) =====

test("construirCliente escribe provincia recortada y «» si el campo viene vacío (RF-1302)", () => {
  const nuevo = construirCliente(formulario({ provincia: "  Málaga  " }), 55, 1760000000000);
  assert.equal(nuevo.provincia, "Málaga");
  assert.equal(construirCliente(formulario({}), 56, 1760000000000).provincia, "");
  assert.equal(construirCliente(formulario({ provincia: "   " }), 57, 1760000000000).provincia, "");
});

test("actualizarCliente cambia solo provincia conservando id, fecha y el resto (RF-1302)", () => {
  const actual = {
    id: 9, fecha: 1700000000000, empresa: "Vega", provincia: "Valencia",
    tipos: ["Tela"], tipo: "Tela", notas: "se conserva"
  };
  const editado = actualizarCliente(
    actual,
    formulario({ empresa: "Vega", provincia: "  Castellón  ", notas: "se conserva" }),
    ["Tela"]
  );
  assert.equal(editado.provincia, "Castellón");
  assert.equal(editado.id, 9);
  assert.equal(editado.fecha, 1700000000000);
  assert.equal(editado.notas, "se conserva");
  assert.deepEqual(editado.tipos, ["Tela"]);
  assert.equal(actual.provincia, "Valencia"); // no muta al cliente original
  // quitar la provincia en la edición → ""
  const sinProvincia = actualizarCliente(actual, formulario({ empresa: "Vega" }), ["Tela"]);
  assert.equal(sinProvincia.provincia, "");
});

// ===== 10. Importación (RF-1309, lógica) =====

test("importarClientes acepta el fichero antiguo sin provincia (→ «») y recorta la presente (RF-1309)", () => {
  const sinProvincia = importarClientes(JSON.stringify([
    { id: 1, fecha: 1700000000000, empresa: "Textiles Norte", tipo: "Tela" }
  ]));
  assert.equal(sinProvincia.error, null);
  assert.equal(sinProvincia.clientes[0].provincia, "");
  const conProvincia = importarClientes(JSON.stringify([
    { id: 2, fecha: 1700000000000, empresa: "Delta", provincia: "  Málaga  " }
  ]));
  assert.equal(conProvincia.error, null);
  assert.equal(conProvincia.clientes[0].provincia, "Málaga");
});

test("importarClientes conserva los literales de error intactos con la provincia en el esquema (RF-1309)", () => {
  assert.equal(importarClientes("basura {{{").error, "El archivo no tiene un formato JSON válido");
  assert.equal(importarClientes('{"empresa": "Textiles Norte"}').error, "El archivo no contiene una lista de clientes");
});

// ===== 11. Cabecera de impresión (RF-1308) =====

test("textoContextoImpresion sin marcas de provincia es idéntica a la cabecera de la 013 (RF-1308, RF-1608)", () => {
  assert.equal(textoContextoImpresion(["Tela"], "", []), "Gestor de Clientes · Filtro: Tela");
  assert.equal(textoContextoImpresion([], "casa", undefined), "Gestor de Clientes · Búsqueda: «casa»");
  assert.equal(textoContextoImpresion(["Otros"], "", []), "Gestor de Clientes · Filtro: Otros");
  assert.equal(textoContextoImpresion([], "", []), "Gestor de Clientes");
});

test("textoContextoImpresion añade «Provincia: X» entre «Filtro» y «Búsqueda» (RF-1308, RF-1608)", () => {
  assert.equal(
    textoContextoImpresion(["Tela"], "casa", ["Málaga"]),
    "Gestor de Clientes · Filtro: Tela · Provincia: Málaga · Búsqueda: «casa»"
  );
  assert.equal(
    textoContextoImpresion(["Tela"], "", ["Málaga"]),
    "Gestor de Clientes · Filtro: Tela · Provincia: Málaga"
  );
  assert.equal(
    textoContextoImpresion([], "", ["Málaga"]),
    "Gestor de Clientes · Provincia: Málaga"
  );
  assert.equal(
    textoContextoImpresion([], "casa", []),
    "Gestor de Clientes · Búsqueda: «casa»" // grupo provincia vacío: sin pieza
  );
});

// ===== 12. Filtros múltiples por lista de marcas (spec 018, RF-1603/RF-1604) =====

// Lista del acta de la 018: provincias variadas, sin provincia, sin campo y la
// colisión de etiqueta «Sin provincia» escrita literalmente
const LISTA_018 = [
  { id: 1, empresa: "A", provincia: "Valencia", tipos: ["Tela"], tipo: "Tela" },
  { id: 2, empresa: "B", provincia: "CÁDIZ", tipos: ["Espuma"], tipo: "Espuma" },
  { id: 3, empresa: "C", provincia: "cadiz", tipos: ["Tela", "Espuma"], tipo: "Tela" },
  { id: 4, empresa: "D", provincia: "", tipos: ["Tela"], tipo: "Tela" },
  { id: 5, empresa: "E", provincia: "Sin provincia", tipos: [], tipo: "" }, // colisión de etiqueta (RF-1603)
  { id: 6, empresa: "F", tipos: ["Toldos"], tipo: "Toldos" }               // sin campo provincia
];

test("filtrarPorProvincia con lista vacía o entrada no-array es sin filtro: la lista completa (RF-1603)", () => {
  assert.deepEqual(filtrarPorProvincia(LISTA_018, []).map(c => c.id), [1, 2, 3, 4, 5, 6]);
  // entrada no-array (defensivo, asunción del plan): sin filtro, nunca lanza
  assert.deepEqual(filtrarPorProvincia(LISTA_018, "Valencia").map(c => c.id), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(filtrarPorProvincia(LISTA_018, undefined).map(c => c.id), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(filtrarPorProvincia([], []).map(c => c.id), []);
});

test("filtrarPorProvincia con marcas usa semántica «o» y normaliza acentos y mayúsculas (RF-1603)", () => {
  assert.deepEqual(filtrarPorProvincia(LISTA_018, ["Valencia"]).map(c => c.id), [1]);
  assert.deepEqual(filtrarPorProvincia(LISTA_018, ["cadiz"]).map(c => c.id), [2, 3]); // homófonos juntos
  // «o»: el 3 es de cadiz (también) y no duplica
  assert.deepEqual(filtrarPorProvincia(LISTA_018, ["valencia", "CÁDIZ"]).map(c => c.id), [1, 2, 3]);
});

test("filtrarPorProvincia: los sin provincia pasan con la lista vacía o con SIN_PROVINCIA, y no con reales sin la fija (RF-1603, RF-1604)", () => {
  assert.deepEqual(filtrarPorProvincia(LISTA_018, [""]).map(c => c.id), [4, 6]);      // vacía o ausente
  assert.deepEqual(filtrarPorProvincia(LISTA_018, [SIN_PROVINCIA]).map(c => c.id), [4, 6]); // la constante es «»
  // con alguna provincia real marcada y la fija DESMARCADA, los sin provincia NO pasan
  assert.equal(filtrarPorProvincia(LISTA_018, ["Valencia"]).some(c => c.id === 4 || c.id === 6), false);
  // la fija junto a una provincia real: semántica «o» (sola o con «Sin provincia» escrita da lo mismo aquí)
  assert.deepEqual(filtrarPorProvincia(LISTA_018, ["Valencia", SIN_PROVINCIA]).map(c => c.id), [1, 4, 6]);
});

test("filtrarPorProvincia con «Sin provincia» escrita literalmente: pasa por su texto, nunca por la fija (RF-1603, colisión)", () => {
  // solo la opción normal «Sin provincia» (coincidencia de texto): el cliente 5
  assert.deepEqual(filtrarPorProvincia(LISTA_018, ["Sin provincia"]).map(c => c.id), [5]);
  // solo la casilla fija «»: el cliente 5 NO pasa (su provincia no está vacía)
  assert.equal(filtrarPorProvincia(LISTA_018, [SIN_PROVINCIA]).some(c => c.id === 5), false);
  // las dos juntas: los sin provincia (4 y 6) + el escrito (5)
  assert.deepEqual(filtrarPorProvincia(LISTA_018, ["Sin provincia", SIN_PROVINCIA]).map(c => c.id), [4, 5, 6]);
});

test("el filtro de tipo y el de provincia se combinan en Y con «o» dentro del grupo provincia (RF-1604)", () => {
  const porTipo = filtrarClientes(LISTA_018, ["Tela", "Espuma"]); // «y»: solo el 3 (tiene las dos)
  assert.deepEqual(porTipo.map(c => c.id), [3]);
  assert.deepEqual(filtrarPorProvincia(porTipo, ["Valencia", "Cádiz"]).map(c => c.id), [3]); // provincias en «o»
  assert.deepEqual(filtrarPorProvincia(filtrarClientes(LISTA_018, ["Sin tipo"]), ["Valencia"]).map(c => c.id), []);
  assert.deepEqual(filtrarPorProvincia(filtrarClientes(LISTA_018, ["Sin tipo"]), ["Sin provincia"]).map(c => c.id), [5]);
  assert.deepEqual(filtrarPorProvincia(filtrarClientes(LISTA_018, ["Otros"]), [SIN_PROVINCIA]).map(c => c.id), [6]);
});

test("nombreMarcasProvincias traduce la fija «» a «Sin provincia» y el resto va tal cual (RF-1603)", () => {
  assert.deepEqual(nombreMarcasProvincias([]), []);
  assert.deepEqual(nombreMarcasProvincias(["Valencia", ""]), ["Valencia", "Sin provincia"]);
  assert.deepEqual(nombreMarcasProvincias(["", "Cádiz"]), ["Sin provincia", "Cádiz"]);
  assert.deepEqual(nombreMarcasProvincias([SIN_PROVINCIA]), ["Sin provincia"]);
  // entrada no-array (defensivo): sin etiquetas, sin lanzar
  assert.deepEqual(nombreMarcasProvincias(undefined), []);
  assert.deepEqual(nombreMarcasProvincias("Valencia"), []);
});

// ===== 13. Cabecera de impresión con listas (spec 018, RF-1608) =====

test("textoContextoImpresion une cada grupo con «, » y omite las piezas vacías (RF-1608)", () => {
  // solo tipo, con N marcas
  assert.equal(
    textoContextoImpresion(["Tela", "Espuma"], "", []),
    "Gestor de Clientes · Filtro: Tela, Espuma"
  );
  // solo provincia, con N marcas
  assert.equal(
    textoContextoImpresion([], "", ["Valencia", "Castellón"]),
    "Gestor de Clientes · Provincia: Valencia, Castellón"
  );
  // los dos grupos + búsqueda: literal completo del criterio de aceptación
  assert.equal(
    textoContextoImpresion(["Tela", "Espuma"], "toldos", ["Valencia", "Castellón"]),
    "Gestor de Clientes · Filtro: Tela, Espuma · Provincia: Valencia, Castellón · Búsqueda: «toldos»"
  );
  // ninguno de los dos grupos: sin pieza (equivalente al antiguo «Todos» + «Todas las provincias»)
  assert.equal(textoContextoImpresion([], "", []), "Gestor de Clientes");
});

test("textoContextoImpresion imprime «Sin provincia» tal cual dentro de la pieza Provincia (RF-1608)", () => {
  assert.equal(
    textoContextoImpresion([], "", [SIN_PROVINCIA]),
    "Gestor de Clientes · Provincia: Sin provincia"
  );
  assert.equal(
    textoContextoImpresion([], "", ["Valencia", SIN_PROVINCIA]),
    "Gestor de Clientes · Provincia: Valencia, Sin provincia"
  );
  // la provincia escrita literalmente «Sin provincia» es una marca de texto normal
  assert.equal(
    textoContextoImpresion([], "", ["Sin provincia"]),
    "Gestor de Clientes · Provincia: Sin provincia"
  );
});

test("textoContextoImpresion con listas devuelve texto plano sin HTML, con acentos y comillas tal cual (RF-1608)", () => {
  const cabecera = textoContextoImpresion(["Espuma"], '  Mü "Hnos"  ', ["Málaga"]);
  assert.equal(
    cabecera,
    'Gestor de Clientes · Filtro: Espuma · Provincia: Málaga · Búsqueda: «Mü "Hnos"»'
  );
  assert.equal(cabecera.indexOf("<"), -1); // sin marcas HTML
});
