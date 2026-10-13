// =====================================================
// Gestor de Clientes - Lógica pura (sin DOM)
// Todas las funciones reciben los datos por parámetro
// y no tocan la página: así se pueden testear con node --test.
// =====================================================

// Convierte el valor a texto y quita espacios sobrantes
function texto(valor) {
  return (valor || "").toString().trim();
}

// "Tela" -> "tela", "FOAM" -> "foam", "Estructuras" -> "estructuras"
function claseTipo(tipo) {
  return texto(tipo).toLowerCase();
}

// Devuelve el cliente con ese id dentro de la lista, o undefined
function buscarCliente(lista, id) {
  return lista.find(function (cliente) {
    return cliente.id === id;
  });
}

// Rellena los 8 campos de un cliente a partir del formulario.
// Conserva id y fecha de `actual` (los pone él mismo).
function actualizarCliente(actual, datos) {
  return {
    id: actual.id,
    fecha: actual.fecha,
    empresa: texto(datos.get("empresa")),
    cif: texto(datos.get("cif")),
    contacto: texto(datos.get("contacto")),
    telefono: texto(datos.get("telefono")),
    email: texto(datos.get("email")),
    direccion: texto(datos.get("direccion")),
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
function nombreTipo(tipo) {
  const valor = texto(tipo);
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
    cliente.email, cliente.direccion, cliente.notas,
    cliente.tipo, nombreTipo(cliente.tipo)
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
    debeMostrarMapa,
    urlMapa,
    urlBusquedaMapa,
    contenidoMapa,
    nombreTipo,
    normalizar,
    buscarClientes
  };
}
