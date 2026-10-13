# Plan — Spec 007 · Campos libres, móvil/código postal + acceso robusto

**Estado:** aprobado (spec 007 aprobada 2026-10-13)

---

## 1. `logica.js` (funciones puras, con tests; RF-501…RF-506)

| Función | Cambio |
|---|---|
| `actualizarCliente` | Añade `movil` (tras `telefono`) y `codigoPostal` (tras `direccion`): 12 campos en total |
| `nombreTipo` | Vacío → **«Sin tipo»** (RF-504); el resto igual |
| `textoBusquedaCliente` | Incluye `movil` y `codigoPostal` en el haystack |
| `direccionCompleta(direccion, codigoPostal)` | **Nueva**: une lo que haya (dirección, CP o ambos) para el mapa (RF-503) |
| `hashTexto` | **Reescrita síncrona en JS puro** (SHA-256 estándar, sin `crypto.subtle`); mismo hex que antes → hashes guardados siguen valiendo (RF-506) |
| `validarImportacion` | Relajada: conserva cualquier item objeto con **algún campo propio no vacío** (empresa ya no es imprescindible) y normaliza `movil`/`codigoPostal` (RF-501/RF-502) |

## 2. `index.html`

- Quitar `required` de **empresa**, **teléfono** y **tipo** y los `*` de sus etiquetas.
- Nuevo campo **Móvil** (`name="movil"`, `type="tel"`) tras Teléfono.
- Nuevo campo **Código postal** (`name="codigoPostal"`, `autocomplete="postal-code"`,
  `inputmode="numeric"`) tras Dirección.
- El campo de clave de la pantalla de acceso **mantiene** `required` (no es dato del
  formulario del comercial).

## 3. `app.js` (presentación y estado)

- **Login**: `submit` pasa a síncrono con `hashTexto` JS puro y `try/catch` que muestra
  mensaje en `#error-acceso` (se restaura el texto por defecto tras cada intento) — RF-506.
- **Guardar claves**: mismo cambio (sin `async/await`).
- `iniciarEdicion`: rellena también `movil` y `codigoPostal`.
- `crearTarjeta`: empresa vacía → **«Sin nombre»**; filas «Móvil» y «Código postal».
- `cuadroMapa`: usa `direccionCompleta(direccion, codigoPostal)`.
- Comentarios «8 campos» → 10 campos de datos.

## 4. `test-logica.js` (actualización + nuevos casos)

- `hashTexto` síncrona: vectores `""`, `1234`, `2468`, `9753` (¡prueba de paridad con
  `CLAVES_POR_DEFECTO`!) y uno con acentos/ñ; se elimina el shim de WebCrypto.
- `nombreTipo("") === "Sin tipo"`.
- `construirCliente` → 12 claves.
- `direccionCompleta`: ambos / solo dirección / solo CP / ninguno.
- `validarImportacion`: item sin empresa pero con otro dato = válido; item sin ningún
  campo propio = filtrado; `movil`/`codigoPostal` conservados.
- `buscarClientes` por código postal y por móvil.

## 5. Verificación obligatoria (RF-501…RF-507)

1. `node --test` en verde.
2. Chrome DevTools: guardar formulario **totalmente vacío** (Sin nombre/Sin tipo),
   alta con solo móvil y CP, ficha con las filas nuevas, buscador por CP y por móvil,
   mapa con dirección+CP y con solo CP, edición conserva campos, importación de archivo
   viejo (sin campos nuevos) y con item sin empresa, regresión 002/004/005/006
   (login usuario/admin, exportar, borrar), móvil 375 px, consola limpia.
3. Borrar datos de prueba (incluidas claves y sesiones) al terminar.
