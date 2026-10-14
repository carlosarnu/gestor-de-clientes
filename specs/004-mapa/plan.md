# Plan — Spec 004 · Mapa de Google Maps para la dirección

**Estado:** aprobado (spec 004 aprobada 2026-10-13)
**Principio rector:** solo presentación; cero cambios en el formulario, `localStorage` o la lógica de negocio.

---

## 1. Técnica y decisiones (según spec)

- Iframe de Google Maps **sin API key**: `https://www.google.com/maps?q=<dirección>&output=embed`.
- Se pinta **solo en la tarjeta** de la lista y **solo si `direccion` no está vacía** (tras `texto()`).
- **Sin conexión** (`navigator.onLine === false`) o si el iframe falla → se muestra el enlace
  `https://www.google.com/maps/search/?api=1&query=<dirección>` («Ver en Google Maps»,
  `target="_blank" rel="noopener"`).
- Carga perezosa: `loading="lazy"` + `title` accesible (RF-204).
- Eventos `online`/`offline` de la ventana → `pintarLista()` para refrescar los cuadros (RF-203).

## 2. Cambios en `../../logica.js` (funciones puras, con tests)

| Función | Qué hace |
|---|---|
| `debeMostrarMapa(direccion)` | `texto(direccion) !== ""` (RF-201/RF-202) |
| `urlMapa(direccion)` | URL del iframe: `.../maps?q=` + `encodeURIComponent(texto(direccion))` + `&output=embed` |
| `urlBusquedaMapa(direccion)` | URL del enlace de respaldo: `.../maps/search/?api=1&query=` + codificado (RF-203) |
| `contenidoMapa(direccion, enLinea)` | Devuelve `"iframe"` si `enLinea` es `true`, si no `"enlace"` (RF-203, testeable sin `navigator`) |

Ninguna toca `document` o `navigator`: el estado de red entra por parámetro.

## 3. Cambios en `../../app.js` (solo presentación)

- En `crearTarjeta()`, después de la fila de dirección (y antes de las notas), si
  `debeMostrarMapa(cliente.direccion)` se inyecta `.mapa-caja`:
  - `enLinea = navigator.onLine !== false` (con `try` por seguridad);
  - `"iframe"` → `<iframe class="mapa-mapa" title="Mapa de …" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src=…>` + enlace pequeño debajo;
  - `"enlace"` → solo el enlace grande «Ver en Google Maps».
- Todo con `escapar()` para el `title` y `encodeURIComponent` (vía `../../logica.js`) para las URLs.
- Al final de `../../app.js`: `window.addEventListener("online", pintarLista)` y `"offline"` (RF-203).
- **No se tocan**: `formulario`, `guardarClientes`, `cargarClientes`, `guardarEdicion`,
  `eliminarCliente`, filtros ni `../../logica.js` de edición/borrado.

## 4. Cambios en `../../styles.css`

| Clase | Estilo resumido |
|---|---|
| `.mapa-caja` | `margin-top: 10px;` contenedor del cuadro |
| `.mapa-mapa` | `display: block; width: 100%; aspect-ratio: 16 / 9; border: 1px solid var(--linea); border-radius: var(--radio); background: var(--linea-suave);` sin sombras |
| `.mapa-enlace` | enlace pequeño `font-size: .875rem;` color `--tinta-media`, subrayado al pasar; en modo solo-enlace (sin conexión) se muestra como botón centrado con `padding: 10px 14px` y borde |

Responsive: a 375 px el iframe ocupa el ancho de la tarjeta sin desbordamiento (RF-205).

## 5. Tests nuevos (`../../test-logica.js`)

- `debeMostrarMapa`: dirección vacía/espacios → `false`; con contenido → `true`.
- `urlMapa`: contiene `output=encode`, codifica espacios y acentos (`Calle Mayor 12` → `Calle%20Mayor%2012`).
- `urlBusquedaMapa`: contiene `/maps/search/?api=1&query=` y la dirección codificada.
- `contenidoMapa`: `("Calle 1", true)` → `"iframe"`; `("Calle 1", false)` → `"enlace"`.

## 6. Verificación obligatoria (RF-207)

1. `node --test` → todos en verde.
2. Chrome DevTools: tarjeta con dirección muestra el iframe; tarjeta sin dirección no muestra cuadro;
   editar la dirección actualiza el mapa; vaciar la dirección lo elimina; vista móvil 375 px sin
   desbordamiento; consola sin errores; filtros/edición/borrado intactos (regresión 002).
3. Borrar datos de prueba al terminar.
