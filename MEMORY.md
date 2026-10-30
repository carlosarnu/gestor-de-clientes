# MEMORY.md — Gestor de Clientes

Memoria entre sesiones. Máximo ~50 líneas. Specs 001–018 cerradas (006 retirada 2026-10-13).

## Estado actual

- Web estática (doble clic, `file://`) + app de escritorio Electron opcional. **166 tests en verde** (`node --test`).
- Esquema: **14 campos** por cliente, ninguno obligatorio (spec 007). `tipos` es array canónico (fijos Tela/Espuma/Estructuras + texto libre) y `tipo` = `tipos[0] ?? ""` solo de lectura (spec 014).
- Filtros **múltiples** (spec 018): dos desplegables con casillas — Tipo (intersección «y») y Provincia (unión «o») — combinados con la búsqueda multi-palabra.
- Búsqueda en vivo que ignora acentos/mayúsculas (005). Mapa de Google Maps en la ficha sin API key (004). Vista Tarjetas ↔ Listado con selector de campos (012). Vista previa de impresión + PDF (013/017). Exportar/Importar JSON (011).
- App de escritorio (011): Electron, fuente única `Documentos\Gestor de Clientes\clientes.json`. `npm start` / `npm run build` (NSIS) desde `escritorio/`.
- Migración idempotente de tipos (`migrarTipos`) en las tres rutas de carga (web, escritorio, importar). FOAM→Espuma incluido.

## Decisiones (y por qué)

- **Estática pura sin dependencias** → portabilidad y doble clic. Excepción única: devDependencies de Electron en `escritorio/` (regla 1 enmendada).
- **Nada obligatorio** (007, decisión del padre del usuario): «que rellene lo que él considere».
- **Acceso con clave retirado** (006, 2026-10-13): el usuario no conseguía entrar; la protección vendrá con la app de escritorio si hace falta.
- **Datos locales, sin servidor** (`localStorage`; JSON en escritorio): nada sale del equipo del usuario.
- **Lógica pura separada** en `logica.js` (sin DOM ni `localStorage`) para probarla con `node --test`; la capa DOM se verifica con Chrome DevTools.
- **Interfaz, identificadores y documentación en español** (constitución regla 5).
- **Enmienda 018 (2026-10-22, aprobada por el usuario)**: el grupo Tipo pasa a «y» (intersección); cinco marcados ya no equivalen a «sin filtro» (solo lo es cero marcas).
- **Selección múltiple de tipos** (2026-10-20): las cuatro casillas sustituyen al `<select>` de la 016; round-trip sin pérdida al editar.
- **GitHub (2026-10-25)**: subido a `carlosarnu/gestor-de-clientes` (público), rama `main`. La clave API de Context7 se purgó del historial con `git filter-repo`; `opencode.json` trackeado sin cabecera de clave.
- **Publicación (2026-10-29)**: README.md, LICENSE (MIT), badge de CI (`.github/workflows/tests.yml`, `node --test`) y **GitHub Pages** activado en la rama `main` → https://carlosarnu.github.io/gestor-de-clientes/. Captura con datos de ejemplo (`screenshot.png`). `MEMORY.md` recortado a ~50 líneas.

## Ubicación

- Trabajo: `C:\Users\carlo\Desktop\PROYECTOS\gestor-de-clientes` (siempre desde aquí).
- App: `index.html`, `styles.css`, `logica.js`, `app.js`, `hoja-impresion.css`; tests: `test-*.js` (166).

## Errores a evitar

- No escribir la clave de Context7 ni ningún dato sensible en `opencode.json` (la constitución lo prohíbe).
- No tocar el orden de los `<script>` en `index.html` ni los valores internos del campo `tipo`.
- Al imprimir, el orden intra-grupo de «Provincia: …» aún no está fijado por spec (pendiente).

## Próximos pasos

- **Instalar el instalador NSIS (2026-10-24) en el ordenador del padre** y migrar sus datos («Exportar» en la web → «Importar» en la app).
- Comprobar allí el cuadro nativo de impresión (en este equipo no abre: problema del subsistema de impresión de esta máquina, no de la app).
- Cerrar el pendiente del orden de «Provincia: …» en la cabecera de impresión.
- Mejoras candidatas: resaltado de coincidencias en el buscador; OpenStreetMap como alternativa sin Google.
