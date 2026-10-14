# Spec 009 — Renombrar FOAM a Espuma y depuración general

| Campo | Valor |
|---|---|
| **ID** | `009-espuma` |
| **Título** | El valor interno «FOAM» pasa a «Espuma» (con migración de datos) y se corrigen los hallazgos de la revisión de código |
| **Estado** | **Aprobada** (revisión de código pedida y aprobada por el usuario el 2026-10-14) |
| **Fecha** | 2026-10-14 |

---

## 1. Contexto y objetivo

El usuario pidió revisar **todo** el código y reportar los errores antes de tocar nada.
La revisión confirmó que la web ya muestra **«Espuma»** en todo lo visible (spec 005),
pero «FOAM» seguía como **valor interno** en `index.html`, `styles.css`, `logica.js`,
los datos de prueba y lo guardado en `localStorage`. El usuario eligió **renombrar todo
a «Espuma»** (opción A) y además **aprobar todos los hallazgos secundarios**.

**Objetivo:** que «FOAM» desaparezca del código y de los datos, sin perder **nunca** un
cliente (regla 3 de la constitución), y dejar la documentación y los textos al día.

## 2. Requisitos funcionales (EARS)

- **RF-701** — El sistema SHALL usar **«Espuma»** como valor interno del tipo: `value` de
  la opción, `data-filtro` de la pestaña, variables y clases CSS (`--espuma`,
  `.tarjeta-espuma`, `.etiqueta-espuma`), la lista de tipos fijos y los datos de prueba.
  En el código funcional solo queda «FOAM» en `migrarTipos` (RF-702).
- **RF-702** — Al cargar los datos, el sistema SHALL migrar a «Espuma» cualquier cliente
  con tipo «FOAM» (tras recortar espacios), **conservando intactos el resto de campos**,
  de forma **idempotente** y persistiendo el cambio **solo si lo hay**.
- **RF-703** — Se SHALL corregir los hallazgos aprobados:
  1. comentarios «los 10 campos» → «los 12 campos» (`logica.js`, `app.js`);
  2. errata «sin tipo quedado queda» (`logica.js`);
  3. texto del caso límite de `specs/008-otros/spec.md` (decía lo contrario de lo
     que hace el código);
  4. `AGENTS.md` desactualizado (resumen sin «Otros», pestañas sin «Otros», `FOAM`);
  5. cinta de la cabecera con **4 franjas** (tela, espuma, estructuras, violeta);
  6. datos de prueba de los tests con los **12 campos** del esquema actual;
  7. ficha «Correo» → **«Correo electrónico»** (igual que el formulario).

## 3. Criterios de aceptación

- **Given** `localStorage` con un cliente de tipo `"FOAM"`, **when** se abre la app,
  **then** queda `"Espuma"`, con la etiqueta y el canto mostaza en su pestaña, y el resto
  de sus datos (notas, teléfono…) no cambia.
- **Given** la migración ya hecha, **when** se vuelve a abrir, **then** no se reescribe
  nada (misma referencia, sin escrituras).
- **Given** `grep -i foam` en el código funcional, **then** solo aparece en
  `migrarTipos`, su test y las specs históricas (puente inevitable con los datos viejos).
- **Given** `node --test` y el navegador, **then** todo verde, móvil 375 sin desbordes y
  consola limpia; la cinta de la cabecera muestra 4 colores.

## 4. Casos límite

- Datos corruptos o que no son array → se comporta como vacío (ya no puede romper al
  cargar).
- Clientes antiguos sin `movil`/`codigoPostal` → la migración solo toca `tipo`; el resto
  se muestra vacío como siempre (tolerancia de la spec 007).

## 5. Fuera de alcance

- **No se reescriben las specs históricas** 002/003/005/006: son el registro de lo
  decidido entonces (la 005 documenta expresamente que FOAM se conservaba; la 009 la
  **supera**). La spec 008 solo se corrige en su error factual de comportamiento.

## 6. Decisiones

1. **Migración en `migrarTipos`** (lógica pura en `logica.js`, con tests), llamada desde
   `cargarClientes` y guardada solo si cambia algo.
2. Se conservan **todos** los campos del cliente tal cual (`Object.assign`) por si hubiera
   campos inesperados: la migración solo sustituye `tipo`.
3. El literal «FOAM» permanece únicamente donde es imprescindible para **reconocer** los
   datos viejos: `migrarTipos`, su test y las specs históricas.
4. Cinta de cabecera a 4 franjas con el mismo patrón de gradiente que la tricolor.
