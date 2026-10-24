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

// =====================================================
// Filtros múltiples por listas de marcas (spec 018)
// =====================================================

// Marca de la casilla FIJA «Sin provincia» del grupo provincia (spec 018,
// Decisión D2 del plan): el string vacío. Es la única marca sin colisión
// posible — provinciasExistentes nunca devuelve vacíos—, ni siquiera con una
// provincia escrita literalmente «Sin provincia» (esa es una marca de texto
// normal que pasa por su coincidencia de texto, RF-1603).
const SIN_PROVINCIA = "";

// Filtro por provincia en Y con el de tipo (RF-1603/RF-1604): `marcasProvincias`
// es un ARRAY de marcas (antes un único string, spec 015): [] o entrada no-array
// (defensivo) → la lista tal cual (sin filtro); con marcas, semántica «o» —
// el cliente pasa si su provincia coincide normalizada con ALGUNA marca, o si su
// provincia está vacía/ausente y entre las marcas está SIN_PROVINCIA (la fija).
// Un cliente con la provincia escrita literalmente «Sin provincia» pasa por su
// coincidencia de texto, NUNCA por la fija (su provincia no está vacía, colisión
// decidida del RF-1603). No modifica la lista original.
function filtrarPorProvincia(lista, marcasProvincias) {
  if (!Array.isArray(marcasProvincias)) return lista.slice();
  if (marcasProvincias.length === 0) return lista.slice();
  return lista.filter(function (cliente) {
    return marcasProvincias.some(function (marca) {
      if (texto(marca) === SIN_PROVINCIA) return provinciaCliente(cliente) === "";
      return coincideProvincia(cliente, marca);
    });
  });
}

// Validación de las marcas de provincia contra las opciones del panel (RF-1605,
// sustituye a provinciaValida, D3): `opciones` es el array de STRINGS de salida
// de provinciasExistentes (sin vacíos) y `marcas` el array de marcas marcadas.
// Devuelve solo las marcas que siguen existiendo entre las opciones, ALINEADAS a
// la PRIMERA forma guardada (homófonos unificados: «malaga» → «MÁLAGA»), sin
// duplicados y conservando el orden de las marcas. La fija SIN_PROVINCIA («»,
// vacía también tras recortar) se conserva SIEMPRE (aunque no esté entre las
// opciones ni quede ningún cliente sin provincia): es opción fija, análoga a
// «Sin tipo», y nunca se desmarca sola por repueblado (RF-1605/Decisión 11).
// Entradas no-array → []; nunca lanza.
function marcasProvinciaValidas(opciones, marcas) {
  const formas = new Map();
  (Array.isArray(opciones) ? opciones : []).forEach(function (opcion) {
    const forma = texto(opcion);
    if (forma === "") return;
    const clave = normalizar(forma);
    if (!formas.has(clave)) formas.set(clave, forma);
  });
  if (!Array.isArray(marcas)) return [];
  const validas = [];
  let fijaConservada = false;
  marcas.forEach(function (marca) {
    const forma = texto(marca);
    if (forma === SIN_PROVINCIA) {
      if (!fijaConservada) {
        validas.push(SIN_PROVINCIA);
        fijaConservada = true;
      }
      return;
    }
    const alineada = formas.get(normalizar(forma));
    if (alineada !== undefined && validas.indexOf(alineada) === -1) {
      validas.push(alineada); // huérfana (no existe): desmarcada sola
    }
  });
  return validas;
}

// Etiquetas de pintado de las marcas de provincia (RF-1603): la fija «» se
// muestra como «Sin provincia» y el resto va tal cual (ya alineado por
// marcasProvinciaValidas). Única fuente del literal, para que la etiqueta del
// trigger, la cabecera de impresión y el estado vacío no diverjan (T-03/T-04).
// Entrada no-array → []; nunca lanza.
function nombreMarcasProvincias(marcas) {
  if (!Array.isArray(marcas)) return [];
  return marcas.map(function (marca) {
    const forma = texto(marca);
    return forma === SIN_PROVINCIA ? "Sin provincia" : forma;
  });
}

// Literal del estado vacío de la lista (spec 018, RF-1607) en lógica pura, con
// la prioridad búsqueda → filtros → lista realmente vacía y los TRES literales
// exactos del RF-1607 (los viejos que nombraban «la pestaña «Todos»» y ««Todas
// las provincias»» están derogados, RF-1306):
//   1. Búsqueda activa → «No hay coincidencias para «X». Prueba con otras
//      palabras» + « o desmarca alguna casilla.» SOLO si ALGÚN grupo tiene
//      marcas; con los dos grupos sin marcas, la variante sin esa 2ª parte.
//   2. Sin búsqueda y con casillas marcadas → «No hay clientes con estos filtros
//      (Tipo: … · Provincia: …). Desmarca alguna casilla.» con SOLO las piezas
//      activas (unidas por « · ») y las marcas de cada grupo unidas por «, »;
//      la marca fija SIN_PROVINCIA («») CUENTA como provincia activa y se lee
//      «Sin provincia» (nombreMarcasProvincias, única fuente del literal).
//   3. Sin filtros ni búsqueda → «Aún no hay clientes. Rellena el formulario de
//      arriba para añadir el primero.» (app.js añade sobre ESTE literal el
//      mensaje de migración en 2 clics de la 011 cuando el escritorio arranca
//      sin archivo inicial: la rama de migración la decide app.js).
// `total` = clientes guardados: sin búsqueda ni marcas, 0 visibles ⟺ lista
// «realmente vacía» (total 0); un total > 0 en esta rama sería un estado
// imposible (sin criterios todos los clientes son visibles) y, como la spec solo
// define estos tres literales, se devuelve el mismo de la rama 3.
// `marcasTipos`/`marcasProvincias` son arrays de marcas; una entrada NO-array
// (transición T-03→T-04, como textoContextoImpresion) cuenta como «sin marcas»
// y nunca lanza. Texto plano SIN HTML: app.js lo pinta con textContent.
function mensajeEstadoVacio(busqueda, marcasTipos, marcasProvincias, total) {
  const busquedaLimpia = texto(busqueda);
  const tipos = Array.isArray(marcasTipos)
    ? marcasTipos.map(texto).filter(function (marca) { return marca !== ""; })
    : [];
  const provincias = Array.isArray(marcasProvincias) ? marcasProvincias : [];
  const hayMarcas = tipos.length > 0 || provincias.length > 0;

  // Rama 1: la búsqueda manda sobre todo lo demás (prioridad del RF-1607)
  if (busquedaLimpia !== "") {
    return hayMarcas
      ? "No hay coincidencias para «" + busquedaLimpia +
          "». Prueba con otras palabras o desmarca alguna casilla."
      : "No hay coincidencias para «" + busquedaLimpia +
          "». Prueba con otras palabras.";
  }

  // Rama 2: sin búsqueda pero con marcas → solo las piezas activas
  if (hayMarcas) {
    const piezas = [];
    if (tipos.length > 0) piezas.push("Tipo: " + tipos.join(", "));
    if (provincias.length > 0) {
      piezas.push("Provincia: " + nombreMarcasProvincias(provincias).join(", "));
    }
    return "No hay clientes con estos filtros (" + piezas.join(" · ") +
      "). Desmarca alguna casilla.";
  }

  // Rama 3: sin filtros ni búsqueda (ver comentario sobre `total` arriba)
  return "Aún no hay clientes. Rellena el formulario de arriba para añadir el primero.";
}

// Compatibilidad de la 015 (decisión T-05, spec 018): firma única (un string)
// delegando SIEMPRE en marcasProvinciaValidas (única ruta de validación, D3):
// conserva la forma alineada si la provincia sigue entre las opciones y
// devuelve «» si no (o si la selección viene vacía). app.js YA NO la usa desde
// la 018 (su validación es la múltiple); se MANTIENE exportada por compatibilidad
// con el filtro único de la 015 y sus tests (test-provincia.js), sin semántica
// nueva. NO tocar sin revisar esos tests.
function provinciaValida(provincias, seleccion) {
  const pedida = texto(seleccion);
  const validas = marcasProvinciaValidas(provincias, pedida === "" ? [] : [pedida]);
  return validas.length === 0 ? "" : validas[0];
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

// ¿Es un cliente posible (objeto plano)? Distingue la basura que puede traer un
// fichero o la clave de datos (null, undefined, textos, números, arrays) de un
// objeto de verdad. Único criterio de sanearListaClientes y de migrarTipos.
function esClienteObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

// Lista NUEVA conservando SOLO las entradas que son objetos planos (M1b): es el
// saneo EN MEMORIA de las rutas de carga (web y escritorio) y de la importación.
// Nunca muta la entrada, nunca lanza y, muy importante, NUNCA se escribe en el
// fichero ni en localStorage: filtrar es cosa del arranque, la basura guardada
// solo desaparece si el usuario guarda una acción después (los datos son sagrados).
// Si no viene una lista (JSON que no era un array) → lista vacía, sin errores.
function sanearListaClientes(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter(esClienteObjeto);
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
// NUNCA lanza (revisión global, M1): las entradas que no son objetos (basura de
// datos corruptos, p. ej. [null]) se dejan TAL CUAL sin migrar, en la misma
// posición y sin inventar clientes — así un arranque sucio no mata la app.
function migrarTipos(lista) {
  if (!Array.isArray(lista)) return []; // sin lista no hay nada que migrar (nunca lanza)
  let huboCambio = false;
  const migrada = lista.map(function (cliente) {
    if (!esClienteObjeto(cliente)) return cliente; // basura intacta, sin migrar
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
// Tipos del formulario: helpers de la 014 (chips, ya fuera del formulario) y
// tiposDesdeCasillas, el mapeo al guardar del formulario ACTUAL (spec 016 →
// selección múltiple con casillas)
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

// Mapeo al guardar del formulario de CASILLAS (spec 016 → selección múltiple):
// `marcados` son los valores marcados entre «Tela»/«Espuma»/«Estructuras»/«Otros»
// y `textoLibre` el campo condicional, que se parte por «, », se recorta y se
// descartan los vacíos. Reglas: nada → [] («Sin tipo»); los fijos van SIEMPRE en
// orden canónico (Tela, Espuma, Estructuras); el texto libre va tras los fijos y
// conserva su orden; «Otros» marcado SIN texto → «Otros»; un texto que coincide
// con un fijo (normalizar: sin acentos ni mayúsculas, RF-1403) se guarda como
// FIJO; sin duplicados exactos. No muta la entrada y no trunca (el límite de 40
// caracteres es solo del formulario). Tolera `marcados` no array (→ []) y
// cualquier valor no texto (texto() lo recorta); los valores desconocidos se
// ignoran. El texto sin «Otros» marcado también se conserva: la casilla no
// debería llegar desmarcada con contenido (el formulario lo vacía), y así no se
// pierde lo que el usuario haya escrito.
function tiposDesdeCasillas(marcados, textoLibre) {
  const elegidos = Array.isArray(marcados) ? marcados.map(function (valor) {
    return texto(valor);
  }) : [];
  const fragmentos = texto(textoLibre).split(",").map(function (pieza) {
    return pieza.trim();
  }).filter(function (pieza) {
    return pieza !== "";
  });

  // Fijos elegidos por casilla; el texto puede sumar alguno más (escrito a mano)
  const fijosPresentes = elegidos.filter(function (valor) {
    return TIPOS_FIJOS.indexOf(valor) !== -1;
  });
  const libres = [];
  fragmentos.forEach(function (fragmento) {
    const fijo = TIPOS_FIJOS.filter(function (candidato) {
      return normalizar(candidato) === normalizar(fragmento);
    })[0];
    if (fijo !== undefined) {
      if (fijosPresentes.indexOf(fijo) === -1) fijosPresentes.push(fijo);
      return;
    }
    if (libres.indexOf(fragmento) === -1) libres.push(fragmento);
  });

  // Fijos en orden canónico + libres en orden de escritura; «Otros» literal solo
  // si la casilla está marcada y el texto no aporta nada (vacío o solo comas);
  // si aporta —fijo o libre— manda el texto
  const salida = TIPOS_FIJOS.filter(function (fijo) {
    return fijosPresentes.indexOf(fijo) !== -1;
  }).concat(libres);
  if (elegidos.indexOf("Otros") !== -1 && fragmentos.length === 0) salida.push("Otros");
  return salida;
}

// Filtro por tipo con marcas MÚLTIPLES (RF-1602, RF-1604; sustituye al de
// pestañas de la 014, que solo admitía una marca): `marcasTipos` es un ARRAY de
// marcas —[] o entrada no-array (defensivo) → la lista completa, sin filtro— y
// dentro del grupo la semántica es «y» (intersección, enmienda 2026-10-21: el
// «filtro exacto» —Tela+Espuma = los que son de las DOS cosas—): el cliente pasa
// solo si cumple TODAS las marcadas — un tipo fijo → pertenencia (tiposCliente:
// «Tela» incluye a ["Tela","Espuma"] y al legado solo `tipo`); «Otros» → algún
// tipo no fijo (los que llevan fijos junto a libres también entran, Decisión 7
// de la 014); «Sin tipo» → tiposCliente vacío—. «Sin tipo» junto a cualquier
// otra marca es un imposible lógico (exige tipos vacíos y algún tipo a la vez)
// → lista vacía, sin desmarcado automático (RF-1602/RF-1605); por eso los cinco
// marcados dan [] (ya NO es «sin filtro»: eso solo lo es cero marcas). Las marcas
// desconocidas o vacías se ignoran sin lanzar (el panel solo ofrece las cinco
// fijas). No modifica la lista original.
function filtrarClientes(lista, marcasTipos) {
  if (!Array.isArray(marcasTipos)) return lista.slice();
  const marcas = marcasTipos.map(texto).filter(function (marca) {
    return marca !== "";
  });
  if (marcas.length === 0) return lista.slice();
  const fijasMarcadas = marcas.filter(esTipoFijo);
  const quiereOtros = marcas.indexOf("Otros") !== -1;
  const quiereSinTipo = marcas.indexOf("Sin tipo") !== -1;
  // «Sin tipo» + cualquier otra marca = imposible lógico → sin resultados
  if (quiereSinTipo && marcas.length > 1) return [];
  return lista.filter(function (cliente) {
    const tipos = tiposCliente(cliente);
    if (quiereSinTipo) return tipos.length === 0;
    const leFaltaAlgunFijo = fijasMarcadas.some(function (tipo) {
      return tipos.indexOf(tipo) === -1;
    });
    if (leFaltaAlgunFijo) return false;
    if (quiereOtros && !tipos.some(function (tipo) { return !esTipoFijo(tipo); })) return false;
    return true;
  });
}

// Del más reciente al más antiguo por fecha de creación.
// Comparación SEGURA (revisión global, B10): una fecha no numérica (texto, null,
// campo ausente, Infinity…) se trata como 0 — es decir, como lo más antiguo— en
// vez de dar NaN y dejar el orden en manos del motor; el criterio de «número de
// verdad» es el mismo esNumero que usan fechaTextoLocal e importarClientes.
function fechaOrden(cliente) {
  return cliente && esNumero(cliente.fecha) ? cliente.fecha : 0;
}

function ordenarClientes(lista) {
  return lista.slice().sort(function (a, b) {
    return fechaOrden(b) - fechaOrden(a);
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

// Nombre del PDF de la vista previa: "listado-AAAA-MM-DD.pdf" (RF-1512).
// Espejo de nombreArchivoExportacion con otro prefijo y extensión: fecha LOCAL
// (getMonth/getDate) con dosDigitos, nunca toISOString (UTC adelantaría el día).
// Recibe un Date inyectado por el llamante (app.js pasa new Date()).
function nombreArchivoPdf(fecha) {
  return (
    "listado-" +
    fecha.getFullYear() +
    "-" + dosDigitos(fecha.getMonth() + 1) +
    "-" + dosDigitos(fecha.getDate()) +
    ".pdf"
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

  // Mismo saneo que las rutas de carga (M1b): solo los objetos planos son
  // clientes posibles; el resto (nulos, textos, números, arrays) se ignora sin
  // romper la importación
  const elementos = sanearListaClientes(datos);

  // Ids ÚNICOS en el resultado (B5): los ids del fichero pueden venir repetidos
  // entre sí, y los que hay que generar (Date.now() + índice) pueden chocar con
  // uno que el fichero traiga más adelante — con ids duplicados, Editar o
  // Eliminar afectarían a TODOS los clientes que lo compartan. Para que un id
  // generado nunca le robe el sitio a uno preservado, se apunta TODOS los ids
  // preservados antes de repartir (reservados) y los ya repartidos (repartidos).
  const reservados = new Set();
  elementos.forEach(function (elemento) {
    if (esNumero(elemento.id)) reservados.add(elemento.id);
  });
  const repartidos = new Set();

  const clientes = [];
  elementos.forEach(function (elemento, indice) {
    let id = esNumero(elemento.id) ? elemento.id : null;
    if (id === null || repartidos.has(id)) {
      // Sin id válido o id ya usado: id nuevo, nunca un número reservado
      id = Date.now() + indice;
      while (repartidos.has(id) || reservados.has(id)) id += 1;
    }
    repartidos.add(id);

    clientes.push({
      id: id,
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

// Texto de la cabecera impresa en papel (specs 013/015 → listas de la 018,
// RF-1608): «Gestor de Clientes» + las piezas activas en el MISMO orden de
// siempre — Filtro · Provincia · Búsqueda — unidas por « · » con las piezas
// vacías omitidas (grupo sin marcas → sin pieza; sin búsqueda → sin pieza).
// Cada grupo se une con «, »: los tipos tal cual (la marca «Todos» ya no
// existe: el grupo vacío es «sin filtro» y no lleva pieza) y las provincias vía
// nombreMarcasProvincias — única fuente del literal—, que imprime la marca fija
// SIN_PROVINCIA («») como «Sin provincia» tal cual (RF-1603).
// ENTRADA: arrays de marcas en los dos grupos (una sola semántica de entrada,
// igual que D1 para el filtrado); una entrada NO-array (strings del app.js
// viejo entre T-03 y T-04, null, undefined) cuenta como «sin marcas»: la pieza
// se omite y NUNCA se lanza (envolverla crearía falsos positivos, p. ej. el «»
// del select viejo leería «Provincia: Sin provincia»; app.js se arregla en
// T-04/T-06).
// Texto plano SIN HTML: la seguridad al pintarla la da textContent en app.js;
// conserva acentos, mayúsculas y comillas tal cual las escribió el usuario.
function textoContextoImpresion(marcasTipos, busqueda, marcasProvincias) {
  const piezas = ["Gestor de Clientes"];
  const tipos = Array.isArray(marcasTipos)
    ? marcasTipos.map(texto).filter(function (marca) { return marca !== ""; })
    : [];
  if (tipos.length > 0) piezas.push("Filtro: " + tipos.join(", "));
  const provincias = nombreMarcasProvincias(marcasProvincias);
  if (provincias.length > 0) piezas.push("Provincia: " + provincias.join(", "));
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
    sanearListaClientes,
    nombreArchivoExportacion,
    nombreArchivoPdf,
    importarClientes,
    dosDigitos,
    escaparAtributo,
    TIPOS_FIJOS,
    normalizarTipos,
    tiposCliente,
    alternarTipoFijo,
    añadirTipoLibre,
    quitarTipoLibre,
    tiposDesdeCasillas,
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
    SIN_PROVINCIA,
    marcasProvinciaValidas,
    nombreMarcasProvincias,
    mensajeEstadoVacio,
    // provinciaValida: compatibilidad de la 015 (delega en marcasProvinciaValidas;
    // app.js ya no la usa desde la 018 — ver su comentario, decisión de T-05)
    provinciaValida
  };
}
