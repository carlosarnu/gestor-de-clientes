# Plan — Spec 016 · Desplegable «Tipo de cliente» con «Otros» de texto

**Estado:** **implementado y validado** (2026-10-17 — validación RF por RF: **APROBADO** con 1 corrección aplicada: RF-1404, literal «Otros» deja el campo vacío; `node --test` 122/122, consola limpia, 375 px sin desbordes)

| Campo | Valor |
|---|---|
| **Spec** | `specs/016-tipo-desplegable/spec.md` (QA del reviewer: **APROBADO**, solo opcionales no bloqueantes — todos aplicados en este plan) |
| **Fecha** | 2026-10-17 |
| **Dependencia** | Se implementa sobre el estado cerrado de las specs **014** (tipos múltiples) y **015** (provincia, 122/122 tests, commit `373c76a`). Comparte `index.html`, `app.js` y `styles.css`; **`logica.js` y `test-*.js` se tocan CERO veces**. Todo lo de este plan está redactado para el estado **post-015** (esquema de 14 campos, `provincia` en el formulario, chips de tipos en el formulario). |
| **Verificación** | `node --test` (**cero tests nuevos**: los 122 siguen en verde sin tocar `test-logica.js`) + Chrome DevTools (desplegable, campo condicional, guardado de cada opción, edición *round-trip*, 375 px, consola limpia, regresiones 002–015) |

---

## 1. Archivos y responsabilidades

| Archivo | Qué se toca | RF |
|---|---|---|
| `index.html` | **Sustituir el bloque de tipos** (líneas 128-145: `<p class="campo-titulo">`, `<div class="chips" id="chips-tipos">` y el campo «Añadir otro tipo» con `#tipo-otro` + `#boton-anadir-tipo`) por un **`<select id="tipo" name="tipo">`** con 5 opciones (vacía «Sin tipo» seleccionada + Tela / Espuma / Estructuras / Otros) y un **campo condicional** `#campo-tipo-otro` (con `<input id="tipo-otro" name="tipo-otro" maxlength="40" placeholder="p. ej. Toldos">`), oculto con `hidden` salvo en «Otros» | RF-1401, RF-1402 |
| `app.js` | **Eliminar** todo el bloque de chips: `let tiposFormulario` (línea 67), los `getElementById` de `#chips-tipos`/`#tipo-otro`/`#boton-anadir-tipo` (150-152), `pintarChipsTipos` (156-183), `anadirTipoDelCampo` (188-193), el listener `click` de chips (196-214), `quitarTipoDelFormulario` (219-232), los listeners de `#boton-anadir-tipo` y del `Enter` (234-242) y la llamada `pintarChipsTipos()` del arranque (949). **Añadir**: lectura del `<select>` + campo condicional, función `alternarCampoOtro()` (mostrar solo en «Otros»), `change` del desplegable, mapeo desplegable → array `tipos` en el `submit` (helper local `tiposDesdeFormulario()`), carga del desplegable + campo en `iniciarEdicion` según `tiposCliente`, y ajustes de `resetearFormulario` / `guardarEdicion` | RF-1401, 1402, 1403, 1404 |
| `styles.css` | Estilos del `<select>` del formulario y del campo condicional (paleta, foco visible, ≥ 44 px, sin sombras, sin desbordes a 375 px; `display:none` cuando está oculto para que **no ocupe espacio**). **Borrar** los estilos específicos de los chips de tipos que quedan sin uso: `.anadir-tipo` (154-170), `.chip-libre`, `.chip-texto`, `.chip-libre:hover`, `.chip-quitar`, `.chip-quitar:hover`, `.chip-quitar:focus-visible` (481-537). **Se mantienen** `.chips`, `.chip`, `.chip-marca`, `.chip.marcado*`, `.chip:focus-visible` (el selector de campos del listado, spec 012, los usa) | RF-1406 |
| `logica.js` | **INTACTO — cero cambios.** Ninguna función pura nueva, ninguna eliminada. El mapeo desplegable → `tipos` vive en `app.js` (capa de interfaz) reutilizando las puras existentes (`tiposCliente`, `esTipoFijo`, `TIPOS_FIJOS`, `construirCliente`/`aplicarEdicion`) | RF-1403, RF-1405, RF-1407 |
| `test-logica.js`, `test-provincia.js` | **INTACTOS — cero cambios.** Los 122 tests siguen en verde tal cual | RF-1407 |
| `AGENTS.md`, `MEMORY.md` | Documentación al cierre (desplegable + campo condicional en el formulario; lógica y esquema intactos) | RF-1407 |

`escritorio/` **no se toca**: la app carga `../index.html`, así que el cambio viaja
solo; el `.exe` instalador sigue **pendiente de regenerar** (nota en `MEMORY.md`, igual
que con 014/015). `docs/constitution.md` **no se toca** (no cambian los principios).

## 2. Funciones puras (`logica.js`): **ninguna nueva**

**La lógica no cambia en absoluto** (RF-1407): el esquema (`tipos` array + `tipo`), la
migración, la lectura canónica (`tiposCliente`), los filtros por pertenencia, la ficha,
el listado, la impresión y la búsqueda quedan intactos. **No se añade ni se elimina
ninguna función pura**, y por tanto **no hay tests nuevos** que escribir.

### 2.1 Funciones que quedan **sin consumidor** (no se borran)

| Función | Estado | Por qué se mantiene |
|---|---|---|
| `alternarTipoFijo(lista, tipo)` | Sin consumidor desde `app.js` (los chips desaparecen) | Pura, cubierta por tests y parte de la superficie de la spec 014 cerrada; borrarla tocaría cobertura sin beneficio en una spec de interfaz (Decisión 6 de la spec) |
| `añadirTipoLibre(lista, texto)` | Sin consumidor | Lo mismo: la regla «coincide con un fijo → se marca el fijo» la hereda el mapeo del formulario; sigue testeada |
| `quitarTipoLibre(lista, tipo)` | Sin consumidor | Lo mismo |

### 2.2 Helper **de interfaz** (en `app.js`, sin tests de Node — se verifica en navegador)

```js
// Capa de interfaz: lee el <select> + el campo condicional y devuelve el array
// canónico `tipos` (RF-1403). No es pura ni va a logica.js: no añade reglas de
// negocio, solo traduce la UI al formato que ya exigía la 014.
function tiposDesdeFormulario() {
  const selector = formulario.tipo;            // <select name="tipo">
  if (selector.value === "") return [];        // «Sin tipo» → sin tipos
  if (selector.value !== "Otros") {
    return [selector.value];                   // «Tela» | «Espuma» | «Estructuras»
  }
  const escrito = formulario.tipoOtro.value.trim();
  // «Otros» → [texto recortado]; vacío/espacios → ["Otros"] (RF-602 de la 008).
  // Si escrito es exactamente un fijo («Tela») se guarda tal cual: ya ES el fijo
  // canónico — RF-604 por construcción, sin código especial.
  return escrito !== "" ? [escrito] : ["Otros"];
}
```

## 3. Algoritmos en pseudocódigo

### 3.1 `submit` (alta y edición, RF-1403)

```
datos      = new FormData(formulario)          // ya recoge name="tipo" y name="tipo-otro"
tipos      = tiposDesdeFormulario()            // §2.2: [] | [fijo] | [texto] | ["Otros"]

si editando:
    aplicarEdicion(clientes, id, datos, tipos)  // conserva id y fecha (spec 002)
sino:
    construirCliente(datos, Date.now(), Date.now(), tipos)
```

`construirCliente` / `aplicarEdicion` **no cambian**: ya escriben `tipos` y
`tipo = tipos[0] ?? ""`.

### 3.2 Campo condicional (RF-1402)

```
alternarCampoOtro():
    si formulario.tipo.value == "Otros":
        campoTipoOtro.hidden = false           // mostrar justo debajo del desplegable
    sino:
        campoTipoOtro.hidden = true            // ocultar SIN ocupar espacio
        formulario.tipoOtro.value = ""         // el texto sobrante se descarta (RF-1402)

// Llamadas: «change» del <select>, al arrancar (reset) y tras iniciarEdicion().
```

### 3.3 `iniciarEdicion` (RF-1404)

```
tipos    = tiposCliente(cliente)               // lectura canónica de la 014
primero  = tipos[0] ?? ""

si primero == "":                               // sin tipos
    formulario.tipo.value = ""                  // «Sin tipo»
    alternarCampoOtro()                         // oculto
sino si esTipoFijo(primero):                   // «Tela» | «Espuma» | «Estructuras»
    formulario.tipo.value = primero
    alternarCampoOtro()                         // oculto
sino:                                          // texto libre o literal «Otros»
    formulario.tipo.value = "Otros"
    formulario.tipoOtro.value = (primero == "Otros") ? "" : primero
    alternarCampoOtro()                         // visible
```

## 4. Interfaz (`index.html`, `styles.css`, `app.js`)

### 4.1 Formulario (RF-1401, RF-1402) — sustituye las líneas 128-145 de `index.html`

```html
<div class="campo">
  <label for="tipo">Tipo de cliente</label>
  <select id="tipo" name="tipo">
    <option value="" selected>Sin tipo</option>
    <option value="Tela">Tela</option>
    <option value="Espuma">Espuma</option>
    <option value="Estructuras">Estructuras</option>
    <option value="Otros">Otros</option>
  </select>
</div>

<!-- Solo visible con «Otros» (RF-1402): hidden + display:none → no ocupa espacio.
     El texto se limita a 40 caracteres SOLO aquí: la lógica y la importación
     no truncan (RF-1209 intacto). name="tipo-otro": el FormData lo recoge, pero
     el submit solo lo lee cuando el desplegable está en «Otros». -->
<div class="campo campo-condicional" id="campo-tipo-otro" hidden>
  <label for="tipo-otro">Escribe el tipo de cliente</label>
  <input type="text" id="tipo-otro" name="tipo-otro" autocomplete="off"
         maxlength="40" placeholder="p. ej. Toldos">
</div>
```

- **Posición**: en el mismo hueco que hoy los chips (tras «Provincia», antes de
  «Información adicional»). Se **elimina el campo «Añadir otro tipo»** actual
  (opcional QA 1) y con él su botón.
- **Alta**: `formulario.reset()` deja el `<select>` en «Sin tipo» (opción con
  `selected`) y el campo oculto — «Sin tipo» es el valor por defecto (Decisión 1).
- **`name="tipo"`** (opcional QA 2): el `FormData` del submit lo recoge como el resto
  de campos; el mapeo §2.2 lo traduce a `tipos`.
- El `<select>` es un control nativo: operable con teclado y ratón, con etiqueta
  visible en español y **sin `required`** (nada obligatorio, spec 007).

### 4.2 Estilos (`styles.css`, RF-1406)

```css
/* Desplegable del formulario: mismo aire que los campos y que el desplegable
   de provincia (.filtro-provincia-select) — tinta y superficie, borde y radio de
   siempre, sin sombras (spec 003), foco visible y objetivo táctil ≥ 44 px */
.campo select {
  width: 100%;
  min-height: 44px;
  font: inherit;
  padding: 10px 12px;
  border: 1px solid var(--linea);
  border-radius: 10px;            /* el mismo radio que los inputs del formulario */
  background: var(--superficie);
  color: var(--tinta);
}

.campo select:focus-visible {
  outline: 2px solid var(--tinta);
  outline-offset: 2px;
}

/* Campo condicional oculto: garantía de que NUNCA ocupe espacio (opcional QA 3) */
.campo-condicional[hidden] {
  display: none;
}

.campo-condicional {
  margin-top: 8px;                /* separación del desplegable cuando se muestra */
}
```

- **Sin desbordes a 375 px**: el select es `width: 100%` dentro de `.campo` (que ya
  tiene el acolchado del formulario); el campo condicional hereda la maquetación de
  los campos de texto de siempre.
- **Limpieza**: se borran `.anadir-tipo` (154-170), `.chip-libre`, `.chip-texto`,
  `.chip-libre:hover`, `.chip-quitar`, `.chip-quitar:hover` y
  `.chip-quitar:focus-visible` (481-537). **No se tocan** `.chips`, `.chip`,
  `.chip-marca`, `.chip.marcado*` ni `.chip:focus-visible`: el **selector de campos
  del listado (spec 012)** sigue usando `.chip` genéricos.

## 5. Decisiones del plan (por qué, y qué se descarta)

1. **`<select>` nativo (no radiogrupo, no `multiple`, no chips).** Es exactamente lo
   que pidió el usuario («el desplegable, y que cuando seleccionaba el apartado otros
   me saliera el cuadro de texto») y el patrón de la 008 que quiere recuperar. *
   *Descartado:* **`<select multiple>` o volver a los chips** — incómodo en táctil, no
   admite el texto libre integrado y va contra la petición literal.
2. **Primera opción vacía «Sin tipo», seleccionada por defecto.** Respeta la spec
   007 y la convención «Sin tipo» de la ficha/listado. *Descartado:* **sin opción
   vacía** (obligaría a elegir) y **placeholder «— Tipo —»** (texto menos claro y
   distinto de la convención existente).
3. **Mapeo al guardar tal como RF-1403:** fijo → `[tipo]`; «Otros» → `[texto]` o
   `["Otros"]` si vacío; «Sin tipo» → `[]`. El texto que coincide con un fijo **ya se
   guarda como fijo por construcción** (se guarda tal cual «Tela»). *Descartado:*
   **«Otros» vacío = `[]`** (decisión de la 014): contradice el RF-602 que el usuario
   quiere recuperar.
4. **El campo condicional se oculta con `hidden` + `display:none` y su texto se
   descarta al cambiar de opción** (limpieza explícita, no solo «no leerlo»). *
   *Descartado:* **solo no leerlo al guardar** (dejaría basura en el DOM y en el
   `FormData`); **campo siempre visible** (desentona con la petición).
5. **Mapeo en `app.js`, no una función pura nueva en `logica.js`.** RF-1407 prohíbe
   añadir funciones puras; el mapeo es traducción de UI, no regla de negocio. *
   *Descartado:* **`tiposDesdeDesplegable(valor, texto)` pura con tests** (sería la
   opción «limpia» de MSD, pero la spec manda cero cambios en `logica.js` y cero
   tests nuevos; la verificación se hace en navegador).
6. **Mantener `.chip` genéricos y las puras sin consumidor.** *Descartado:* **borrar
   `.chips`/`.chip`/`.chip-marca`** (rompería el selector de campos del listado,
   spec 012) y **borrar `alternarTipoFijo`/`añadirTipoLibre`/`quitarTipoLibre`** con
   sus tests (borraría cobertura de la 014 cerrada sin beneficio).
7. **`name="tipo"` y `name="tipo-otro"` en los controles** (opcional QA 2): el
   `FormData` del submit los recoge sin código extra; el mapeo decide qué leer. *
   *Descartado:* **leer solo `FormData.get()`** sin `name` (no funciona: el submit
   actual ya usa `FormData`; los nombres son los que lo hacen posible).
8. **Estilos nuevos mínimos reutilizando la paleta** (misma familia visual que
   `.filtro-provincia-select` y los inputs del formulario). *Descartado:* **dejar el
   `<select>` nativo sin estilizar** (rompe la paleta retro y el objetivo táctil).

## 6. Estrategia de tests (`node --test`) y verificación

### 6.1 Tests de Node: **cero nuevos** (RF-1407)

- **No se toca `test-logica.js` ni `test-provincia.js`.** Los **122 tests** deben
  seguir en verde **tal cual**: la lógica no cambia, así que ningún test existe que
  cubra el desplegable.
- Comprobación obligatoria antes de empezar y al cerrar: `node --test` → **122/122**.

### 6.2 Verificación en navegador (Chrome DevTools) — sí o sí

La interfaz **no** tiene tests de Node; se verifica a mano siguiendo el checklist
del §7. Cubre: RF-1401 (5 opciones, orden, «Sin tipo» por defecto), RF-1402 (campo
solo en «Otros», sin espacio oculto, placeholder, maxlength 40), RF-1403 (guardado
de cada opción: fijo / «Otros» vacío → `["Otros"]` / «Otros»+texto → `[texto]` /
«Otros»+«Tela» → `["Tela"]` / «Sin tipo» → `[]`), RF-1404 (edición: fijo, libre,
literal «Otros» → campo **vacío**, sin tipos, multi-tipo → primer tipo y selección
única), RF-1405 (filtros por pertenencia, ficha, listado, impresión y búsqueda
intactos), RF-1406 (375 px, foco visible, consola limpia) y RF-1407 (regresiones).

## 7. Checklist de verificación final (§8 del flujo)

- [ ] `node --test` en verde (**122/122**, sin tocar `test-*.js` ni un solo test nuevo).
- [ ] `node --check app.js` OK.
- [ ] Desplegable con las **5 opciones en orden**, «Sin tipo» seleccionada en el
      alta, operable con teclado (flechas/Tab/Intro) y foco visible.
- [ ] Campo condicional: aparece **solo** en «Otros», justo debajo; al cambiar a
      otra opción **se oculta y no ocupa espacio** (medir altura del formulario);
      placeholder «p. ej. Toldos»; no deja escribir más de 40 caracteres.
- [ ] Guardado de **cada** opción (comprobar en `localStorage`): «Tela» →
      `tipos: ["Tela"]`; «Otros» vacío → `["Otros"]`; «Otros»+«Toldos» → `["Toldos"]`;
      «Otros»+«Tela» → `["Tela"]`; «Sin tipo» → `[]` y `tipo: ""`. El cliente con
      «Toldos» sale en la pestaña «Otros» con badge violeta; el de «Tela» escrito a
      mano sale en «Tela».
- [ ] Edición *round-trip*: fijo → se carga y es **byte-idéntica** al guardar sin
      tocar; libre → desplegable en «Otros» con el texto; literal «Otros» → campo
      **vacío**; sin tipos → «Sin tipo» y campo oculto; multi-tipo (sembrado a mano
      en `localStorage`) → su **primer** tipo y al guardar se conserva **solo** ese
      (limitación documentada).
- [ ] Cambio «Otros»→«Espuma» con texto escrito: se descarta y guarda `["Espuma"]`.
- [ ] Regresiones en navegador: filtros por pertenencia (5 pestañas), buscador,
      mapa, listado/selector de campos (los chips del listado siguen funcionando),
      impresión (cabecera de contexto), exportar/importar, borrado con «¿Seguro?»,
      alta con filtro de provincia activo (vuelve a «Todas»), datos antiguos sin
      reescribir.
- [ ] Móvil **375 px** sin desbordes (select y campo incluidos); consola **limpia**.
- [ ] Al terminar: `localStorage.removeItem("gestorClientes")` (arranque vacío) y
      `escritorio/` sin cambios (`git status`).
- [ ] `AGENTS.md` (desplegable + campo condicional; lógica y esquema intactos) y
      `MEMORY.md` (línea de la 016; nota de que el instalador sigue pendiente de
      regenerar, ahora con 014+015+016 dentro) al día; spec/plan/tasks marcados como
      implementados; commit único; árbol limpio.
