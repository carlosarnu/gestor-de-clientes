# Plan — Spec 009 · FOAM → Espuma y depuración

**Estado:** aprobado (spec 009 aprobada 2026-10-14)

---

## 1. `logica.js`

| Cambio | Detalle |
|---|---|
| `esTipoFijo` | `["Tela", "Espuma", "Estructuras"]` (RF-701) |
| `nombreTipo` | ya no traduce «FOAM»: vacío → «Sin tipo», resto tal cual |
| **`migrarTipos(lista)`** | **Nueva** (RF-702): `tipo` «FOAM» → «Espuma» con `Object.assign` ( resto intacto), misma referencia si no hay cambio; exportada |
| Comentarios | «10 campos» → «12»; errata «quedado queda»; cabeceras con «Espuma» |

## 2. `index.html`

- `<option value="Espuma">Espuma</option>`; pestaña `data-filtro="Espuma"`.

## 3. `styles.css`

- Variables `--foam*` → `--espuma*`; selectores `.tarjeta-foam`/`.etiqueta-foam` →
  `-espuma`; `[data-filtro="FOAM"]` → `="Espuma"`.
- **Cinta a 4 franjas** (RF-703.5): `var(--tela) 0 25.1%, var(--espuma) 0 50.1%,
  var(--estructuras) 0 75.1%, var(--otros) 0`.

## 4. `app.js`

- `cargarClientes`: `migrarTipos(Array.isArray(lista) ? lista : [])` y **persistir solo
  si cambia** (RF-702); con array corrupto vuelve a vacío.
- Comentario «los 10 campos» → «los 12»; fila de la ficha «Correo» → «Correo
  electrónico».

## 5. `test-logica.js` (+2 tests = 34)

- Fixtures y aserciones `FOAM` → `Espuma` (`claseTipo`→`espuma`, `esTipoFijo`,
  `nombreTipo`, búsqueda por «espuma» sin «foam»).
- `CLIENTE_V1`, `LISTA` y `LISTA_BUSCAR` con los **12 campos** (RF-703.6).
- **Nuevos:** `migrarTipos` cambia FOAM→Espuma sin tocar nada más / devuelve la misma
  lista si no hay que migrar.

## 6. Documentación

- `spec.md`/`plan.md` de la **008**: caso límite corregido y tipos fijos «Espuma».
- `AGENTS.md`: resumen, bullet de `tipo`, bullet de Filtros con «Otros», límites y
  funcionalidad 009.
- `MEMORY.md`: línea de la 009 (supera la decisión de la 005).
- Specs históricas 002/003/005/006: **no se tocan**.

## 7. Verificación

`node --check` + `node --test` (34) + Chrome DevTools: sembrar datos **con** tipo
`"FOAM"` → al abrir migran a «Espuma» (color mostaza, pestaña Espuma activa), migración
idempotente (reabrir no reescribe), cinta de 4 colores, «Correo electrónico» en la
ficha, `grep -i foam` limpio en código funcional, móvil 375, consola limpia y datos de
prueba borrados.
