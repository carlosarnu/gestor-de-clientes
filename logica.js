// =====================================================
// Gestor de Clientes - Lógica pura (sin DOM)
// Todas las funciones reciben los datos por parámetro
// y no tocan la página: así se pueden testear con node --test.
// =====================================================

// Convierte el valor a texto y quita espacios sobrantes
function texto(valor) {
  return (valor || "").toString().trim();
}

// Escapa un valor para pintarlo SIEMPRE dentro de un atributo HTML: sustituye los
// cinco caracteres que pueden romper el atributo o inyectar atributos ajenos
// (& < > " '). El «&» va primero para no re-escapar las entidades resultantes.
// Es transformación de texto plano (no construye markup): RF-1005 intacta.
// Uso: todo atributo pintado con dato del usuario (p. ej. el `title` de las celdas
// del listado y del mapa); escapar() de app.js solo sirve para CONTENIDO de texto.
function escaparAtributo(valor) {
  return texto(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Los tres tipos fijos del formulario (spec 008): única fuente desde la 014, de la
// que penden esTipoFijo, los filtros y los chips del formulario
const TIPOS_FIJOS = ["Tela", "Espuma", "Estructuras"];

// "Tela" -> "tela", "Espuma" -> "espuma", "Estructuras" -> "estructuras";
// cualquier tipo escrito («Otros», spec 008) -> "otros"; sin tipo -> ""
function claseTipo(tipo) {
  const valor = texto(tipo);
  if (valor === "") return "";
  return esTipoFijo(valor) ? valor.toLowerCase() : "otros";
}

// ¿Es uno de los tres tipos fijos? (spec 008; comparación exacta tras recortar)
function esTipoFijo(tipo) {
  return TIPOS_FIJOS.indexOf(texto(tipo)) !== -1;
}

// =====================================================
// Tipos múltiples de cliente (spec 014)
// =====================================================

// Array normalizado de tipos (RF-1202): si el valor no es array → []; cada elemento
// se convierte a texto, se recorta y se quitan vacíos y duplicados EXACTOS («tela»
// minúscula NO se unifica con «Tela», Decisión 11), conservando el orden y SIN
// truncar (el límite de 40 caracteres es solo del formulario, RF-1203).
// No aplica FOAM: eso vive solo en la migración (Decisión 4 del plan).
function normalizarTipos(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.reduce(function (salida, elemento) {
    const limpio = texto(elemento);
    if (limpio !== "" && salida.indexOf(limpio) === -1) salida.push(limpio);
    return salida;
  }, []);
}

// FOAM → Espuma (spec 009) dentro de una lista de tipos, volviendo a quitar
// duplicados por si conviven «FOAM» y «Espuma»: así la migración es idempotente
function migrarFoamEnTipos(tipos) {
  return normalizarTipos(tipos.map(function (tipo) {
    return tipo === "FOAM" ? "Espuma" : tipo;
  }));
}

// Única puerta de lectura de los tipos efectivos de un cliente (RF-1201/RF-1202,
// Decisión 12): SI `tipos` es array con elementos tras normalizar → son esos
// (FOAM migrado) y `tipo` se ignora por completo; si `tipos` está ausente, no es
// array o acaba vacío → se reconstruye desde `tipo` (opción protectora del dato).
// Devuelve SIEMPRE un array normalizado, sin mutar al cliente.
function tiposCliente(cliente) {
  const fuente = cliente || {};
  if (Array.isArray(fuente.tipos)) {
    const propios = migrarFoamEnTipos(normalizarTipos(fuente.tipos));
    if (propios.length > 0) return propios;
  }
  const legado = texto(fuente.tipo);
  return migrarFoamEnTipos(legado === "" ? [] : [legado]);
}

// Devuelve el cliente con ese id dentro de la lista, o undefined
function buscarCliente(lista, id) {
  return lista.find(function (cliente) {
    return cliente.id === id;
  });
}

// Tipos a guardar en un alta/edición (RF-1204): los chips elegidos en el formulario
// (parámetro `tipos`, ya un array) normalizados, o — formato legado, sin parámetro —
// derivados del string del campo «tipo» ([tipo] o []). Así la firma antigua sigue
// funcionando (compatibilidad, Decisión 3 del plan).
function tiposSeleccionados(tipos, datos) {
  if (Array.isArray(tipos)) return normalizarTipos(tipos);
  const legado = texto(datos.get("tipo"));
  return legado === "" ? [] : [legado];
}

// =====================================================
// Provincia del cliente (spec 015)
// =====================================================

// Única regla de lectura de la provincia (RF-1301): «» si no hay cliente, no es un
// objeto o el campo falta; el resto pasa por texto() (falsy → «», nunca «false»;
// número no cero u objeto → convertidos a texto; recortado). No escribe nada.
function provinciaCliente(cliente) {
  if (!cliente || typeof cliente !== "object") return "";
  return texto(cliente.provincia);   // texto() ya convierte a string y recorta
}

// Provincias del filtro (RF-1305): strings únicos por normalizar() (acentos y
// mayúsculas fuera), mostrando la PRIMERA forma guardada, sin vacíos y en orden
// alfabético (localeCompare «es»). Los datos no se tocan.
function provinciasExistentes(lista) {
  const unicas = new Map();
  for (const cliente of lista) {
    const valor = provinciaCliente(cliente);
    if (valor === "") continue;
    const clave = normalizar(valor);
    if (!unicas.has(clave)) unicas.set(clave, valor);
  }
  return Array.from(unicas.values())
    .sort(function (a, b) { return a.localeCompare(b, "es"); });
}

// ¿La provincia del cliente coincide con la pedida normalizando acentos y
// mayúsculas? («Cádiz» ~ «cadiz» SOLO para el filtro, Decisión 3; los datos
// guardados no cambian). Pedida vacía → false (sin filtrar).
function coincideProvincia(cliente, provincia) {
  const pedida = normalizar(provincia);
  return pedida !== "" && normalizar(provinciaCliente(cliente)) === pedida;
}

// Filtro por provincia en Y con el de tipo (RF-1305): «» (sin selección; el
// <select> solo emite «» o nombres de provincia) → la lista tal cual; el resto,
// solo los clientes cuya provincia coincida normalizada (los sin provincia solo
// salen en «Todas las provincias»).
function filtrarPorProvincia(lista, provincia) {
  const pedida = texto(provincia);
  if (pedida === "") return lista;
  return lista.filter(function (c) { return coincideProvincia(c, pedida); });
}

// Selección válida del desplegable (RF-1305): `provincias` es el array de STRINGS
// de salida de provinciasExistentes (no clientes). La selección se conserva si
// sigue existiendo entre esas opciones (comparando forma normalizada); si no, o si
// viene vacía → "" («Todas las provincias», nunca un filtro imposible).
function provinciaValida(provincias, seleccion) {
  const pedida = texto(seleccion);
  if (pedida === "") return "";
  const clave = normalizar(pedida);
  return provincias.some(function (p) { return normalizar(p) === clave; })
    ? pedida : "";
}

// Rellena los 14 campos de un cliente a partir del formulario: los 13 de siempre
// más `provincia` (spec 15, entre código postal y tipos) junto a `tipos` (array
// canónico) y `tipo` (= tipos[0] ?? "", solo lectura para versiones antiguas,
// RF-1201).
// Conserva id y fecha de `actual` (los pone él mismo).
// Todos los datos son opcionales (spec 007): lo que no venga, queda en "".
function actualizarCliente(actual, datos, tipos) {
  const listaTipos = tiposSeleccionados(tipos, datos);
  return {
    id: actual.id,
    fecha: actual.fecha,
    empresa: texto(datos.get("empresa")),
    cif: texto(datos.get("cif")),
    contacto: texto(datos.get("contacto")),
    telefono: texto(datos.get("telefono")),
    movil: texto(datos.get("movil")),
    email: texto(datos.get("email")),
    direccion: texto(datos.get("direccion")),
    codigoPostal: texto(datos.get("codigoPostal")),
    provincia: texto(datos.get("provincia")),
    tipos: listaTipos,
    tipo: listaTipos.length > 0 ? listaTipos[0] : "",
    notas: texto(datos.get("notas"))
  };
}

// Cliente nuevo de alta: recibe id y fecha desde fuera (fácil de testear);
// `tipos` (opcional) es la lista de chips elegida en el formulario
function construirCliente(datos, id, fecha, tipos) {
  return actualizarCliente({ id: id, fecha: fecha }, datos, tipos);
}

// Devuelve la lista con el cliente editado (mismo id y fecha, sin duplicar nada)
function aplicarEdicion(lista, id, datos, tipos) {
  return lista.map(function (cliente) {
    if (cliente.id !== id) return cliente;
    return actualizarCliente(cliente, datos, tipos);
  });
}

// Devuelve la lista sin el cliente con ese id
function eliminarClienteDe(lista, id) {
  return lista.filter(function (cliente) {
    return cliente.id !== id;
  });
}

// =====================================================
// Migración de datos antiguos (specs 009 y 014)
// =====================================================

// ¿Los tipos ya guardados coinciden exactamente con los efectivos?
function tiposIguales(guardados, efectivos) {
  return Array.isArray(guardados) &&
    guardados.length === efectivos.length &&
    guardados.every(function (tipo, i) { return tipo === efectivos[i]; });
}

// Migración de datos antiguos al esquema con `tipos` múltiples (RF-1202): por cada
// cliente escribe `tipos` = tiposCliente(cliente) y `tipo` = `tipos[0] ?? ""`,
// conservando intactos el resto de campos (los datos son sagrados, regla 3 de la
// constitución). Cubre TODO el RF-1202: FOAM → Espuma dentro de cada tipo, string
// → array, normalización (recorte, vacíos y duplicados exactos fuera, sin truncar)
// y reconstrucción desde `tipo` cuando `tipos` está ausente, no es array o acaba
// vacío (Decisión 12). Devuelve la MISMA lista si no hay nada que migrar, así que
// la escritura (localStorage / clientes.json) solo ocurre si algo cambió.
// Es idempotente: aplicarla dos veces deja exactamente el mismo resultado.
function migrarTipos(lista) {
  let huboCambio = false;
  const migrada = lista.map(function (cliente) {
    const tipos = tiposCliente(cliente);
    const tipo = tipos.length > 0 ? tipos[0] : "";
    // Solo se reescribe el cliente si `tipos` o `tipo` difieren del resultado
    if (cliente.tipo === tipo && tiposIguales(cliente.tipos, tipos)) return cliente;
    huboCambio = true;
    return Object.assign({}, cliente, { tipos: tipos, tipo: tipo });
  });
  return huboCambio ? migrada : lista;
}

// =====================================================
// Chips del formulario de tipos (spec 014)
// =====================================================

// Lista NUEVA con el chip fijo alternado (RF-1203): si estaba marcado, se quita;
// si no, se añade AL FINAL del orden de selección (Decisión 5). No muta la entrada.
function alternarTipoFijo(tipos, tipo) {
  const lista = normalizarTipos(tipos);
  const valor = texto(tipo);
  if (valor === "") return lista;
  return lista.indexOf(valor) !== -1
    ? lista.filter(function (t) { return t !== valor; })
    : lista.concat([valor]);
}

// Lista NUEVA tras añadir el texto escrito como chip (RF-1203): se recorta; vacío
// o solo espacios → sin cambios (sin «Otros» automático, Decisión 4); si ya estaba
// (fijo marcado o libre añadido) → sin duplicado; si tras recortar coincide EXACTA
// con un tipo fijo, se comporta fijo (coincidencia exacta, mayúsculas incluidas).
// No trunca: los 40 caracteres son solo del formulario (Decisión 5).
function añadirTipoLibre(tipos, escrito) {
  const lista = normalizarTipos(tipos);
  const valor = texto(escrito);
  if (valor === "" || lista.indexOf(valor) !== -1) return lista;
  return lista.concat([valor]);
}

// Lista NUEVA sin ese texto exacto (el «×» del chip libre, RF-1203); si no
// estaba, sin cambios. No muta la entrada.
function quitarTipoLibre(tipos, tipo) {
  const lista = normalizarTipos(tipos);
  const valor = texto(tipo);
  return lista.filter(function (t) { return t !== valor; });
}

// Filtro de pestañas por PERTENENCIA (RF-1205): "Todos" → toda la lista; un tipo
// concreto → los clientes que lo tengan entre sus tipos efectivos («Tela» incluye
// a ["Tela","Espuma"]); "Otros" → quien tenga algún tipo no fijo (los fijos junto
// a libres también entran, Decisión 7). Los «Sin tipos» solo en "Todos".
// Funciona igual con datos viejos (solo `tipo`) gracias a tiposCliente.
// No modifica la lista original.
function filtrarClientes(lista, filtro) {
  if (filtro === "Todos") return lista.slice();
  if (filtro === "Otros") {
    return lista.filter(function (cliente) {
      return tiposCliente(cliente).some(function (tipo) {
        return !esTipoFijo(tipo);
      });
    });
  }
  const buscado = texto(filtro);
  return lista.filter(function (cliente) {
    return tiposCliente(cliente).indexOf(buscado) !== -1;
  });
}

// Del más reciente al más antiguo por fecha de creación
function ordenarClientes(lista) {
  return lista.slice().sort(function (a, b) {
    return b.fecha - a.fecha;
  });
}

// Texto del contador de la lista
function textoContador(total) {
  return total === 1 ? "1 cliente" : total + " clientes";
}

// Mensaje del aviso breve (toast); "guardado" es el alta (spec 010, RF-801)
function mensajeAviso(operacion) {
  if (operacion === "guardado") return "Cliente guardado";
  return operacion === "eliminado" ? "Cliente eliminado" : "Cliente actualizado";
}

// =====================================================
// Mapa de Google Maps (spec 004) - también sin DOM
// =====================================================

// Dirección completa para localizar en el mapa: lo que haya de dirección y
// de código postal (spec 007, RF-503); sin nada, cadena vacía
function direccionCompleta(direccion, codigoPostal) {
  const partes = [texto(direccion), texto(codigoPostal)].filter(function (parte) {
    return parte !== "";
  });
  return partes.join(" ");
}

// ¿Hay dirección que mapear? (solo con contenido real)
function debeMostrarMapa(direccion) {
  return texto(direccion) !== "";
}

// URL del iframe del mapa (sin API key)
function urlMapa(direccion) {
  return "https://www.google.com/maps?q=" + encodeURIComponent(texto(direccion)) + "&output=embed";
}

// URL del enlace de respaldo cuando no se puede cargar el mapa
function urlBusquedaMapa(direccion) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(texto(direccion));
}

// "iframe" si hay conexión; si no, "enlace" (la conexión entra por parámetro para poder testearla)
function contenidoMapa(direccion, enLinea) {
  if (!debeMostrarMapa(direccion)) return "ninguno";
  return enLinea ? "iframe" : "enlace";
}

// =====================================================
// Buscador de texto y etiquetas (spec 005) - sin DOM
// =====================================================

// Nombre visible de cada tipo en la interfaz: «Sin tipo» si no hay y el texto tal cual
// si hay (el «FOAM» antiguo ya no existe: se migra a «Espuma» al cargar, spec 009)
function nombreTipo(tipo) {
  const valor = texto(tipo);
  return valor === "" ? "Sin tipo" : valor;
}

// Minúsculas y sin acentos para comparar búsquedas ("Constitucion" ~ "Constitución")
function normalizar(valor) {
  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Texto completo de un cliente para buscar en él: TODOS sus tipos efectivos
// unidos (RF-1206: «tela toldos» se reparte entre tipos del mismo cliente), su
// provincia (RF-1304) y, si no tiene tipos, la convención de la 005 de buscar
// también en «Sin tipo»
function textoBusquedaCliente(cliente) {
  const tipos = tiposCliente(cliente);
  const textoTipos = tipos.length > 0 ? tipos.join(" ") : nombreTipo("");
  return normalizar([
    cliente.empresa, cliente.cif, cliente.contacto, cliente.telefono,
    cliente.movil, cliente.email, cliente.direccion, cliente.codigoPostal,
    provinciaCliente(cliente), cliente.notas, textoTipos
  ].join(" "));
}

// Filtra la lista por las palabras de la consulta.
// Todas las palabras deben aparecer (repartidas en los campos). No muta la lista.
function buscarClientes(lista, consulta) {
  const palabras = normalizar(consulta).split(/\s+/).filter(function (palabra) {
    return palabra !== "";
  });
  if (palabras.length === 0) return lista.slice();

  return lista.filter(function (cliente) {
    const textoCliente = textoBusquedaCliente(cliente);
    return palabras.every(function (palabra) {
      return textoCliente.includes(palabra);
    });
  });
}

// =====================================================
// Exportar e importar copias de seguridad (spec 011)
// =====================================================

// Rellena con un cero a la izquierda si hace falta (mes y día)
function dosDigitos(numero) {
  return numero < 10 ? "0" + numero : "" + numero;
}

// Nombre del fichero de exportación: "clientes-AAAA-MM-DD.json".
// Usa la fecha LOCAL (getMonth/getDate), nunca la de ISO/UTC (toISOString
// adelantaría o retrasaría el día según la zona horaria).
function nombreArchivoExportacion(fecha) {
  return (
    "clientes-" +
    fecha.getFullYear() +
    "-" + dosDigitos(fecha.getMonth() + 1) +
    "-" + dosDigitos(fecha.getDate()) +
    ".json"
  );
}

// ¿Es un número de verdad (no NaN ni Infinity)? Para conservar id y fecha importados
function esNumero(valor) {
  return typeof valor === "number" && isFinite(valor);
}

// Valida y normaliza el JSON de una importación (RF-905).
// Devuelve SIEMPRE { clientes, error }: la lista lista para usar (error null) o
// null con un mensaje de error en español, para que quien importa no toque los
// datos actuales si el fichero es basura.
function importarClientes(textoJson) {
  let datos;
  try {
    datos = JSON.parse(textoJson);
  } catch (e) {
    return { clientes: null, error: "El archivo no tiene un formato JSON válido" };
  }

  if (!Array.isArray(datos)) {
    return { clientes: null, error: "El archivo no contiene una lista de clientes" };
  }

  const clientes = [];
  datos.forEach(function (elemento, indice) {
    // Solo los objetos son clientes posibles; el resto (nulos, textos, números,
    // arrays) se ignora sin romper la importación
    if (elemento === null || typeof elemento !== "object" || Array.isArray(elemento)) return;
    clientes.push({
      id: esNumero(elemento.id) ? elemento.id : Date.now() + indice,
      fecha: esNumero(elemento.fecha) ? elemento.fecha : Date.now(),
      empresa: texto(elemento.empresa),
      cif: texto(elemento.cif),
      contacto: texto(elemento.contacto),
      telefono: texto(elemento.telefono),
      movil: texto(elemento.movil),
      email: texto(elemento.email),
      direccion: texto(elemento.direccion),
      codigoPostal: texto(elemento.codigoPostal),
      provincia: texto(elemento.provincia),
      // `tipos` se copia TAL CUAL (cualquier valor JSON) y la normalización,
      // la migración FOAM y la reescritura de `tipo` las hace migrarTipos abajo
      tipos: elemento.tipos,
      tipo: texto(elemento.tipo),
      notas: texto(elemento.notas)
    });
  });

  // Ficheros antiguos (solo `tipo`) y nuevos (con `tipos`): RF-1202 y RF-1209
  return { clientes: migrarTipos(clientes), error: null };
}

// =====================================================
// Listado compacto con selector de campos (spec 012)
// =====================================================

// Único catálogo de campos elegibles en el listado (RF-1002): de él penden tanto el
// selector de chips como el orden de las columnas. Orden = orden del formulario con
// «Fecha de alta» al final (es un dato de alta, no del formulario); `id` nunca se
// ofrece. Con «Provincia» (spec 015) y «Tipo» múltiple (014) ya ampliado.
const CATALOGO_CAMPOS = [
  { clave: "empresa", etiqueta: "Empresa" },
  { clave: "cif", etiqueta: "CIF" },
  { clave: "contacto", etiqueta: "Contacto" },
  { clave: "telefono", etiqueta: "Teléfono" },
  { clave: "movil", etiqueta: "Móvil" },
  { clave: "email", etiqueta: "Correo electrónico" },
  { clave: "direccion", etiqueta: "Dirección" },
  { clave: "codigoPostal", etiqueta: "Código postal" },
  { clave: "provincia", etiqueta: "Provincia" },
  { clave: "tipo", etiqueta: "Tipo" },
  { clave: "notas", etiqueta: "Notas" },
  { clave: "fecha", etiqueta: "Fecha de alta" }
];

// Selección válida de campos (RF-1002): claves que estén en el catálogo, sin
// duplicados y en el orden del catálogo; si no queda ninguna (o no viene array)
// → ["empresa"], la vista por defecto, sin errores.
function normalizarSeleccion(claves) {
  const pedidas = Array.isArray(claves) ? claves : [];
  const seleccion = CATALOGO_CAMPOS
    .map(function (campo) {
      return campo.clave;
    })
    .filter(function (clave) {
      return pedidas.indexOf(clave) !== -1;
    });
  return seleccion.length > 0 ? seleccion : ["empresa"];
}

// Selección NUEVA con la clave alternada (marcada si no lo estaba, desmarcada si lo
// estaba), normalizada: si al desmarcar la última no queda nada, vuelve a «solo
// Empresa» automáticamente (Decisión 3 de la spec, sin mensajes de error).
function alternarCampo(seleccion, clave) {
  const actual = normalizarSeleccion(seleccion);
  const siguiente = actual.indexOf(clave) !== -1
    ? actual.filter(function (c) { return c !== clave; })
    : actual.concat([clave]); // una clave desconocida la descartará la normalización
  return normalizarSeleccion(siguiente);
}

// Texto local "dd/mm/aaaa" de la fecha de alta (RF-1002): métodos LOCALES del Date
// (nunca toISOString, que daría el día en UTC) rellenando con dosDigitos().
// `hoy` es el reloj inyectado (Date o epoch en ms) para tests deterministas.
// Fecha inválida (no numérica o de pasado mañana en adelante — decisión del usuario
// 2026-10-16: cualquier hora de mañana vale) → "" → la celda pintará «—».
function fechaTextoLocal(fecha, hoy) {
  if (!esNumero(fecha)) return "";
  const reloj = hoy instanceof Date ? hoy : new Date(hoy);
  // Límite = inicio del día de pasado mañana (00:00 hora local) con el constructor
  // local del Date, nunca toISOString ni días en milisegundos (skill local-dates)
  const limite = new Date(reloj.getFullYear(), reloj.getMonth(), reloj.getDate() + 2);
  if (fecha >= limite.getTime()) return "";
  const alta = new Date(fecha);
  return (
    dosDigitos(alta.getDate()) +
    "/" + dosDigitos(alta.getMonth() + 1) +
    "/" + alta.getFullYear()
  );
}

// Texto plano de la celda «Tipo» del listado y del papel (RF-1208, Decisión 8):
// todos los tipos unidos con « + » (p. ej. «Tela + Espuma») o «Sin tipo» si no
// hay ninguno. Sin HTML (la 012/013 exigen texto puro).
function unirTiposTexto(tipos) {
  const lista = normalizarTipos(tipos);
  return lista.length === 0 ? "Sin tipo" : lista.join(" + ");
}

// Datos de las celdas de un cliente para las columnas elegidas: [{ clave, etiqueta,
// valor }], solo datos y sin HTML (el escapado y el título emergente los pinta
// app.js, RF-1005). Convenciones de la Decisión 6: empresa vacía → «Sin nombre»,
// tipos → unirTiposTexto de los tipos efectivos («Sin tipo», «Tela + Espuma»…,
// RF-1208), fecha → dd/mm/aaaa local y el resto de celdas → «—»; ninguna celda
// queda en blanco.
function construirCeldas(cliente, campos, hoy) {
  return normalizarSeleccion(campos).map(function (clave) {
    const campo = CATALOGO_CAMPOS.find(function (c) {
      return c.clave === clave;
    });
    let valor;
    if (clave === "empresa") valor = texto(cliente.empresa) || "Sin nombre";
    else if (clave === "tipo") valor = unirTiposTexto(tiposCliente(cliente));
    else if (clave === "fecha") valor = fechaTextoLocal(cliente.fecha, hoy) || "—";
    else valor = texto(cliente[clave]) || "—";
    return { clave: campo.clave, etiqueta: campo.etiqueta, valor: valor };
  });
}

// Filas del listado: [{ id, celdas }] conservando el orden de la lista de entrada
// (más reciente primero, RF-1003).
function construirFilas(clientes, campos, hoy) {
  return clientes.map(function (cliente) {
    return { id: cliente.id, celdas: construirCeldas(cliente, campos, hoy) };
  });
}

// =====================================================
// Impresión del listado: cabecera de contexto (spec 013, RF-1104)
// =====================================================

// Texto de la cabecera impresa en papel: «Gestor de Clientes» + «Filtro: X» (solo
// si el filtro no es «Todos» ni viene vacío; la etiqueta es la de la pestaña tal
// cual, «Otros» literal) + «Provincia: X» (solo con provincia filtrada, spec 015,
// RF-1308: tercer parámetro opcional; sin él el texto no cambia en un carácter) +
// «Búsqueda: «texto»» (solo si tras recortar queda algo), unidas por « · » y con
// las piezas vacías omitidas — Decisión 6 de la spec.
// Texto plano SIN HTML: la seguridad al pintarla la da textContent en app.js;
// conserva acentos, mayúsculas y comillas tal cual las escribió el usuario.
function textoContextoImpresion(filtro, busqueda, provincia) {
  const piezas = ["Gestor de Clientes"];
  const filtroLimpio = texto(filtro);
  if (filtroLimpio !== "" && filtroLimpio !== "Todos") {
    piezas.push("Filtro: " + filtroLimpio);
  }
  const provinciaLimpia = texto(provincia);
  if (provinciaLimpia !== "") {
    piezas.push("Provincia: " + provinciaLimpia);
  }
  const busquedaLimpia = texto(busqueda);
  if (busquedaLimpia !== "") {
    piezas.push("Búsqueda: «" + busquedaLimpia + "»");
  }
  return piezas.join(" · ");
}

// En Node (tests) exportamos las funciones; en el navegador no existe `module` y se omite.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    texto,
    claseTipo,
    buscarCliente,
    actualizarCliente,
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
    importarClientes,
    dosDigitos,
    escaparAtributo,
    TIPOS_FIJOS,
    normalizarTipos,
    tiposCliente,
    alternarTipoFijo,
    añadirTipoLibre,
    quitarTipoLibre,
    unirTiposTexto,
    CATALOGO_CAMPOS,
    normalizarSeleccion,
    alternarCampo,
    fechaTextoLocal,
    construirCeldas,
    construirFilas,
    textoContextoImpresion,
    provinciaCliente,
    provinciasExistentes,
    coincideProvincia,
    filtrarPorProvincia,
    provinciaValida
  };
}
