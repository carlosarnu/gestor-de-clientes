# Plan — Spec 008 · Tipo «Otros»

**Estado:** aprobado (spec 008 aprobada 2026-10-14)

---

## 1. `../../logica.js` (con tests)

| Función | Cambio |
|---|---|
| `esTipoFijo(tipo)` | **Nueva**: `true` para Tela/Espuma/Estructuras (los tres fijos) |
| `claseTipo(tipo)` | Vacío → `""`; fijo → minúsculas; **cualquier otro texto → `"otros"`** (RF-604) |
| `filtrarClientes(lista, filtro)` | Nuevo caso `"Otros"`: tipo no fijo y no vacío (RF-603) |

## 2. `../../index.html`

- `<option value="Otros">Otros</option>` en el desplegable.
- Campo nuevo debajo: `<div class="campo" id="campo-tipo-otro" hidden>` con
  `label for="tipo-otro"` «Escribe el tipo de cliente» e input `name="tipoOtro"`,
  `maxlength="40"`.
- Pestaña `<button data-filtro="Otros">Otros</button>`.

## 3. `../../app.js`

- `sincronizarTipoOtro()`: muestra/oculta el campo según `formulario.tipo.value`
  (listener `change` + se llama tras cualquier reset vía `resetearFormulario()`).
- `submit`: si `tipo === "Otros"` → `datos.set("tipo", texto(tipoOtro.value) || "Otros")`
  (RF-602) antes de construir/editar.
- `iniciarEdicion`: vacío → placeholder; fijo → ese valor; si no → «Otros» + campo con
  el texto («Otros» literal deja el campo vacío) (RF-605).

## 4. `../../styles.css`

- `:root`: `--otros: #6b4f8a`, `--otros-suave: #ece4f4`, `--otros-texto: #513a72`.
- `.campo[hidden] { display: none; }` (**imprescindible**: `.campo` es `flex` y ganaría
  al atributo `hidden`).
- `.filtro[data-filtro="Otros"].activo`, `.tarjeta-otros`, `.etiqueta-otros`.

## 5. Tests (+4)

- `esTipoFijo` (fijos sí; Otros/Toldos/"" no).
- `claseTipo`: `Otros`/`Toldos` → `otros`; `""` → `""`; fijos sin cambios.
- `filtrarClientes("Otros")`: incluye libres y «Otros», excluye fijos y vacíos, no muta.
- `construirCliente` con tipo personalizado se conserva tal cual.

## 6. Verificación

`node --test` + Chrome DevTools: alta con «Otros» (con y sin texto), pestaña «Otros»
(excluye «Sin tipo» y los fijos), edición round-trip, búsqueda por tipo escrito,
regresión de filtros/fichas, móvil 375 px, consola limpia y datos de prueba borrados.
