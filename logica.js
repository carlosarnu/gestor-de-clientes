// =====================================================
// Gestor de Clientes - Lógica pura (sin DOM)
// Todas las funciones reciben los datos por parámetro
// y no tocan la página: así se pueden testear con node --test.
// =====================================================

// Convierte el valor a texto y quita espacios sobrantes
function texto(valor) {
  return (valor || "").toString().trim();
}

// "Tela" -> "tela", "FOAM" -> "foam", "Estructuras" -> "estructuras",
// y sin tipo -> "" (el cliente no encaja en ninguna pestaña de tipo, solo en "Todos")
function claseTipo(tipo) {
  return texto(tipo).toLowerCase();
}

// Devuelve el cliente con ese id dentro de la lista, o undefined
function buscarCliente(lista, id) {
  return lista.find(function (cliente) {
    return cliente.id === id;
  });
}

// Rellena los 10 campos de un cliente a partir del formulario.
// Conserva id y fecha de `actual` (los pone él mismo).
// Todos los datos son opcionales (spec 007): lo que no venga, queda en "".
function actualizarCliente(actual, datos) {
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
    tipo: texto(datos.get("tipo")),
    notas: texto(datos.get("notas"))
  };
}

// Cliente nuevo de alta: recibe id y fecha desde fuera (fácil de testear)
function construirCliente(datos, id, fecha) {
  return actualizarCliente({ id: id, fecha: fecha }, datos);
}

// Devuelve la lista con el cliente editado (mismo id y fecha, sin duplicar nada)
function aplicarEdicion(lista, id, datos) {
  return lista.map(function (cliente) {
    if (cliente.id !== id) return cliente;
    return actualizarCliente(cliente, datos);
  });
}

// Devuelve la lista sin el cliente con ese id
function eliminarClienteDe(lista, id) {
  return lista.filter(function (cliente) {
    return cliente.id !== id;
  });
}

// Filtro de pestañas: "Todos" o un tipo concreto. No modifica la lista original.
function filtrarClientes(lista, filtro) {
  if (filtro === "Todos") return lista.slice();
  return lista.filter(function (cliente) {
    return cliente.tipo === filtro;
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

// Mensaje del aviso breve (toast)
function mensajeAviso(operacion) {
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

// Nombre visible de cada tipo en la interfaz: la etiqueta interna sigue siendo "FOAM"
// y sin tipo quedado queda "Sin tipo" (spec 007, RF-504)
function nombreTipo(tipo) {
  const valor = texto(tipo);
  if (valor === "") return "Sin tipo";
  return valor === "FOAM" ? "Espuma" : valor;
}

// Minúsculas y sin acentos para comparar búsquedas ("Constitucion" ~ "Constitución")
function normalizar(valor) {
  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Texto completo de un cliente para buscar en él (incluye tipo en español y tal cual)
function textoBusquedaCliente(cliente) {
  return normalizar([
    cliente.empresa, cliente.cif, cliente.contacto, cliente.telefono,
    cliente.movil, cliente.email, cliente.direccion, cliente.codigoPostal,
    cliente.notas, cliente.tipo, nombreTipo(cliente.tipo)
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
// Acceso con clave y permisos (spec 006) - sin DOM
// =====================================================

// SHA-256 en hexadecimal de un texto, en JavaScript puro (spec 007, RF-506):
// sin crypto.subtle ni WebCrypto para que funcione en cualquier navegador y
// con los mismos hashes que ya estaban guardados (compatibilidad total).
function hashTexto(entrada) {
  // Constantes: primeros 32 bits de las raíces cuadradas de los 8 primeros primos
  // y de los cubos de los 64 primeros primos
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  // Texto a bytes UTF-8 (siempre string: null/undefined -> "")
  const cadena = entrada === null || entrada === undefined ? "" : String(entrada);
  const bytes = [];
  for (let i = 0; i < cadena.length; i++) {
    const codigo = cadena.charCodeAt(i);
    if (codigo < 0x80) {
      bytes.push(codigo);
    } else if (codigo < 0x800) {
      bytes.push(0xc0 | (codigo >> 6), 0x80 | (codigo & 0x3f));
    } else if (codigo >= 0xd800 && codigo <= 0xdbff && i + 1 < cadena.length) {
      // Par de sustitución (emoji y caracteres extensos)
      const bajo = cadena.charCodeAt(i + 1);
      if (bajo >= 0xdc00 && bajo <= 0xdfff) {
        i++;
        const punto = 0x10000 + ((codigo - 0xd800) << 10) + (bajo - 0xdc00);
        bytes.push(
          0xf0 | (punto >> 18),
          0x80 | ((punto >> 12) & 0x3f),
          0x80 | ((punto >> 6) & 0x3f),
          0x80 | (punto & 0x3f)
        );
      } else {
        bytes.push(0xe0 | (codigo >> 12), 0x80 | ((codigo >> 6) & 0x3f), 0x80 | (codigo & 0x3f));
      }
    } else {
      bytes.push(0xe0 | (codigo >> 12), 0x80 | ((codigo >> 6) & 0x3f), 0x80 | (codigo & 0x3f));
    }
  }

  // Relleno: bit 1, ceros, y la longitud original en bits como entero de 64 bits
  const longitudBits = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(Math.floor(longitudBits / Math.pow(2, i * 8)) & 0xff);

  // Estados iniciales: primeros 32 bits de las fracciones de las raíces de los
  // 8 primeros primos
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const rotr = function (x, n) {
    return (x >>> n) | (x << (32 - n));
  };

  // Procesado por bloques de 512 bits
  for (let inicio = 0; inicio < bytes.length; inicio += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] = (
        (bytes[inicio + i * 4] << 24) |
        (bytes[inicio + i * 4 + 1] << 16) |
        (bytes[inicio + i * 4 + 2] << 8) |
        bytes[inicio + i * 4 + 3]
      ) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map(function (estado) {
    return estado.toString(16).padStart(8, "0");
  }).join("");
}

// Solo el administrador puede borrar, exportar e importar
function esAdmin(rol) {
  return rol === "administrador";
}

// Valida un archivo de importación: acepta array o { clientes: [...] }.
// Devuelve { ok, clientes, error }. Nada es obligatorio (spec 007): se conserva
// cualquier item que traiga ALGÚN dato propio y se filtran los que no dicen nada
// (RF-407/RF-501).
function validarImportacion(datos) {
  const CAMPOS = [
    "empresa", "cif", "contacto", "telefono", "movil",
    "email", "direccion", "codigoPostal", "tipo", "notas"
  ];

  let crudo = datos;
  if (!Array.isArray(crudo) && crudo && Array.isArray(crudo.clientes)) {
    crudo = crudo.clientes;
  }
  if (!Array.isArray(crudo)) {
    return { ok: false, clientes: [], error: "El archivo no contiene una lista de clientes." };
  }

  const clientes = crudo
    .filter(function (item) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      return CAMPOS.some(function (campo) {
        return texto(item[campo]) !== "";
      });
    })
    .map(function (item, indice) {
      return {
        id: typeof item.id === "number" ? item.id : Date.now() + indice,
        fecha: typeof item.fecha === "number" ? item.fecha : Date.now(),
        empresa: texto(item.empresa),
        cif: texto(item.cif),
        contacto: texto(item.contacto),
        telefono: texto(item.telefono),
        movil: texto(item.movil),
        email: texto(item.email),
        direccion: texto(item.direccion),
        codigoPostal: texto(item.codigoPostal),
        tipo: texto(item.tipo),
        notas: texto(item.notas)
      };
    });

  if (clientes.length === 0) {
    return { ok: false, clientes: [], error: "El archivo no tiene ningún cliente válido." };
  }
  return { ok: true, clientes: clientes, error: "" };
}

// Nombre del archivo exportado con la fecha LOCAL del equipo (skill local-dates):
// p. ej. clientes-2026-10-13.json
function nombreArchivoExportacion(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return "clientes-" + anio + "-" + mes + "-" + dia + ".json";
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
    hashTexto,
    esAdmin,
    validarImportacion,
    nombreArchivoExportacion
  };
}
