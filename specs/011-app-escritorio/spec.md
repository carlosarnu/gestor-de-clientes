# Spec 011 — App de escritorio (Electron) con datos en un archivo visible

| Campo | Valor |
|---|---|
| **ID** | `011-app-escritorio` |
| **Título** | La web se convierte en app de escritorio (Electron) guardando los clientes en `Documentos\Gestor de Clientes\clientes.json` |
| **Estado** | **Aprobada** (camino y excepción de constitución aprobados por el usuario el 2026-10-14) |
| **Fecha** | 2026-10-14 |

---

## 1. Contexto y objetivo

El padre quiere **una aplicación de escritorio** en vez de abrir la web. El usuario aprobó
(question tool, 2026-10-14):

1. Camino **Electron + archivo visible**: icono y ventana propios; los clientes se guardan en
   **`Documentos\Gestor de Clientes\clientes.json`** — un archivo que se ve, se copia a un
   USB y se puede respaldar (los datos son sagrados, regla 3).
2. **Excepción a la regla 1 de la constitución**: JS puro y doble clic para la web; Electron
   (y su build) permitido **solo como embudo de escritorio**. El código de la app sigue
   siendo JS puro, sin frameworks, sin duplicar lógica.

**Objetivo:** doble clic en un icono → «Gestor de Clientes» en ventana propia, con la misma
interfaz de siempre, guardando en un archivo visible; migración del dato actual **sin
pérdida de ningún cliente** (máximo 2 clics).

## 2. Requisitos funcionales (EARS)

- **RF-901 — Web: exportar e importar (copia de seguridad y puente).** La web SHALL mostrar
  los botones **«Exportar»** e **«Importar»**. «Exportar» SHALL descargar
  `clientes-AAAA-MM-DD.json` (fecha local, array con los clientes). «Importar» SHALL
  reemplazar la lista tras una confirmación **en línea** (estilo «¿Seguro?» de los borrados,
  sin `confirm()`/`alert()` nativos) mostrando contadores; un JSON inválido SHALL mostrar
  aviso sin tocar los datos. Todo SHALL funcionar abriendo `index.html` con doble clic.
- **RF-902 — App de escritorio.** Existirá la carpeta `escritorio/` (`main.js`,
  `preload.js`, `package.json`) con Electron y `electron-builder` como **devDependencies**
  que carga `../index.html` en una ventana propia titulada «Gestor de Clientes»; el build
  SHALL generar un instalador Windows (NSIS) que crea el acceso directo. En modo escritorio
  (detectado por `window.gestorDatos`, expuesto con `contextBridge` y **IPC síncrono**) la
  **fuente única de verdad** SHALL ser `Documentos\Gestor de Clientes\clientes.json` (mismo
  formato de siempre: array), aplicando `migrarTipos` (spec 009) al leer, y **no** se usará
  `localStorage`.
- **RF-903 — Arranque y migración.** Si el archivo existe → se carga (con migración). Si no
  existe → la lista arranca vacía con un **mensaje breve** («¿Vienes de la web? Exporta allí
  e importa aquí») que **no bloquea** dar de alta clientes nuevos. Cada operación SHALL
  guardar en el archivo. Si el archivo existe pero **no se puede interpretar**, la app SHALL
  renombrarlo a `clientes-daños-AAAA-MM-DD.json` (no se borra nada) y arrancar vacía.
- **RF-904 — Constitución y documentación.** Se SHALL enmendar la regla 1 de
  `docs/constitution.md` (excepción Electron solo para el embudo de escritorio) y
  `AGENTS.md` (stack, comandos de build y límite nuevo: dependencias únicamente en
  `escritorio/` como devDependencies; nunca frameworks en el código de la app).
- **RF-905 — Lógica de importación y cierre.** La validación de importación SHALL vivir en
  `logica.js` como función pura (p. ej. `importarClientes(textoJson)` → lista normalizada o
  error) con sus tests en `node --test`. `MEMORY.md` se actualizará al cierre.

## 3. Criterios de aceptación

- **Given** la web con clientes, **when** se pulsa «Exportar», **then** se descarga un JSON
  con todos; **when** se importa ese fichero en otra sesión, **then** queda la misma lista y
  los tipos correctos («Espuma», spec 009).
- **Given** texto basura en el archivo de importación, **when** se confirma, **then** aviso
  de error y **ningún** cliente se pierde ni se modifica.
- **Given** el instalador ejecutado, **when** se hace doble clic en el icono, **then** abre
  en ventana propia sin barra de navegador; al crear un cliente **then** aparece
  escrito en `Documentos\Gestor de Clientes\clientes.json`.
- **Given** la app recién instalada (sin archivo) y los datos del padre aún en la web,
  **when** se exporta en la web y se importa en la app, **then** todos los clientes están
  con sus 12 campos.
- `node --test` en verde con los tests nuevos de `importarClientes`; consola limpia; la web
  en móvil 375 sin desbordes.

## 4. Casos límite

- **Documentos en OneDrive** (o similar): el archivo se sincroniza solo — ventaja documentada.
- **Web y app abiertas a la vez**: cada modo tiene su fuente (navegador vs. archivo); se
  documenta que no se mezclan (no hay sincronización entre ambas).
- Importar en la web **reemplaza** la lista completa (como el import histórico de la 006),
  tras confirmación con contadores.

## 5. Fuera de alcance

- No se reescriben specs anteriores; no cambia el esquema de datos (los mismos 12 campos).
- Sin auto-actualización, sin cuentas ni red; el mapa de Google sigue necesitando internet
  (sin conexión queda el enlace, comportamiento actual).

## 6. Decisiones

1. **IPC síncrono** en el puente (decisión consciente): `app.js` hoy arranca cargando los
   datos de forma síncrona; el IPC síncrono lo mantiene casi intacto. App local con datos
   diminutos: la simpleza gana.
2. **Migración en 2 clics** («Exportar» en la web → «Importar» en la app): Electron no puede
   leer el `localStorage` de Chrome — solución honesta que además deja al padre un método de
   copia de seguridad para siempre.
3. El archivo usa el **mismo formato** (array JSON): visible, compatible y reutiliza las
   migraciones existentes (`migrarTipos`).
4. **Parseo fallido en escritorio → renombrar, nunca borrar** (regla 3).
5. Dependencias **solo** en `escritorio/` (excepción aprobada); la app en la raíz sigue
   abriéndose con doble clic exactamente igual.