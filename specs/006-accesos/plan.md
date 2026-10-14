# Plan — Spec 006 · Acceso con clave y permisos

**Estado:** aprobado (spec 006 aprobada 2026-10-13)

---

## 1. `../../logica.js` (funciones puras, con tests; RF-404/406/407)

| Función | Qué hace |
|---|---|
| `async hashTexto(texto)` | SHA-256 en hexadecimal con `crypto.subtle` + `TextEncoder`; sin DOM |
| `esAdmin(rol)` | `rol === "administrador"` (único punto de decisión de permisos) |
| `validarImportacion(datos)` | Acepta array o `{ clientes: [...] }`; devuelve `{ ok, clientes, error }`. Filtra objetos con `empresa` no vacía; normaliza campos con `texto()`; `id`/`fecha` numéricos (o generados); 0 válidos → `ok: false` |
| `nombreArchivoExportacion(fecha)` | `"clientes-AAAA-MM-DD.json"` usando los métodos **locales** del `Date` pasado como parámetro (skill `local-dates`) |

En tests se asegura `globalThis.crypto` con `node:crypto` `webcrypto` si faltara.

## 2. `../../index.html`

- `<div id="pantalla-acceso">` (overlay): clave (`type="password"`, `inputmode="numeric"`),
  botón Entrar, `<p id="error-acceso">`, checkbox «mantener sesión iniciada», nota
  RF-409 («¿Sin clave? Pide al administrador»).
- Envolver cabecera + main en `<div id="contenido-app" hidden>` (oculto hasta entrar).
- Botón «Salir» en la cabecera.
- `<section id="panel-admin" hidden">` en la lista: botones «Exportar clientes»,
  «Importar clientes» + `<input type="file" accept=".json" hidden>`, barra de
  confirmación de importación (Sí, reemplazar / Cancelar) y bloque «Cambiar claves»
  (dos inputs + guardar).

## 3. `../../app.js` (presentación y estado)

- Claves/almacenamiento: `gestorAcceso` (localStorage, hashes `{ usuario, administrador }`,
  opcional, sustituye a los por defecto), `gestorSesion` (sessionStorage) y
  `gestorSesionPersistente` (localStorage) — ambas guardan el `rol` en texto.
- Constante `CLAVES_POR_DEFECTO` con los **hashes** precalculados de `2468`/`9753`
  (el PIN en claro no aparece en el código).
- Arranque: si hay sesión (persistente o de sesión) → `mostrarApp()`; si no → pantalla de
  acceso.
- Login: `hashTexto(valor)` → comparar con el hash vigente → guardar sesión (y
  persistente si el checkbox) → `mostrarApp()`. Error → mensaje, sin sesión.
- `mostrarApp()`/`cerrarSesion()`: alterna capas; aplica permisos (panel admin visible o
  no; `crearTarjeta` solo pinta borrar si `esAdmin(rol)`).
- Exportar: `Blob` + enlace descarga con `nombreArchivoExportacion(new Date())`.
- Importar: `FileReader` → `validarImportacion` → barra de confirmación con contadores →
  reemplazar + `pintarLista()`. Inválido → toast de error, datos intactos.
- Cambiar claves: hash de ambos campos nuevos → `gestorAcceso` → toast + limpiar campos.

## 4. `../../styles.css`

| Clase | Estilo resumido |
|---|---|
| `.acceso` (overlay) | `position: fixed; inset: 0;` fondo tinta, tarjeta centrada, `z-index` alto |
| `.acceso input/botón` | ≥44 px, ancho completo en móvil, hereda paleta |
| `.panel-admin` | bloque con borde `--linea`, cabecera y fila de botones envueltos |
| `.confirmar-importacion` | barra dentro del panel (Sí, reemplazar en mostaza-rojo, Cancelar) |

## 5. Tests nuevos (`../../test-logica.js`, +9)

- `hashTexto`: vector conocido SHA-256; mismo texto → mismo hash; distinto → distinto;
  `null` no revienta.
- `esAdmin`: `"administrador"` → true; `"usuario"`/`null` → false.
- `validarImportacion`: array válido; `{clientes:[...]}`; JSON roto (`null`/string) →
  error; items sin `empresa` filtrados; 0 válidos → `ok:false`; no muta la entrada.
- `nombreArchivoExportacion`: `new Date(2026, 9, 13)` → `clientes-2026-10-13.json`.

## 6. Verificación obligatoria (RF-408)

1. `node --test` en verde.
2. Chrome DevTools: pantalla de acceso (clave incorrecta y correcta), permisos de usuario
   (sin borrar/exportar/importar), permisos de administrador (panel + borrar), exportar
   (descarga `clientes-AAAA-MM-DD.json`), importar archivo válido (reemplaza con
   confirmación) e inválido (error, sin cambios), cambiar claves, «Salir», regresión
   002/004/005, móvil 375 px sin desbordamiento y consola limpia.
3. Borrar datos de prueba (incluidas claves y sesiones) al terminar.
