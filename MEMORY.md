# MEMORY.md - Gestor de Clientes

Memoria del proyecto entre sesiones. Máximo 50 líneas.

## Estado actual
- v1 funcionando: formulario (Empresa, CIF, Contacto, Teléfono, Email, Dirección, Tipo: Tela/FOAM/Estructuras, Notas) + filtros + persistencia en `localStorage` (clave `gestorClientes`).
- **002-editar-eliminar IMPLEMENTADA (2026-10-12)**: editar reutilizando el formulario (conserva id/fecha, respeta el filtro), eliminar con "¿Seguro?" Sí/No, toasts. Verificada en navegador.
- **003-retrovisual (2026-10-12, spec retroactiva creada 2026-10-13)**: paleta de materiales (índigo/mostacia/acero), canto de color por tarjeta, cinta tricolor, botones en tinta, sin sombras.
- **2026-10-13 — Revisión integral**: 3 revisores (constitución, tests, interfaz) → informe fusionado con veredicto y correcciones aplicadas:
  - Lógica extraída a `logica.js` (funciones puras) + `test-logica.js` con **13 tests en verde (`node --test`)**.
  - Corregidos: rutas `docs/specs/$1` en 8 comandos SDD; `reviewer.md` (frontmatter YAML roto, quitado `git` y la skill inexistente); `implementer.md` (ruta); `sdd-implement`/`sdd-validate` (tests condicionales a lógica extraíble); AGENTS.md (tests sin contradicción + archivos); constitución regla 5 (identificadores en español); spec 002 y plan.md sincronizados con el código; clave de Context7 eliminada de `opencode.json`; objetivos táctiles a 44 px.
  - Verificado en navegador (alta, edición, borrado con confirmación, filtros, RF-013, móvil 375 px, consola limpia). Datos de prueba borrados.
- **004-mapa IMPLEMENTADA (2026-10-13)**: cada tarjeta con dirección muestra un cuadro de Google Maps (iframe embed sin API key, `loading="lazy"`, `title` accesible) + enlace «Ver en Google Maps»; sin conexión se degrada solo al enlace; eventos `online`/`offline` refrescan la lista; responsive 375 px. Spec, plan y tasks en `docs/specs/004-mapa/`. Verificada en navegador + **17 tests en verde**.
- **005-buscador IMPLEMENTADA (2026-10-13)**: buscador por texto en la lista (en vivo, multi-palabra «y», ignora acentos/mayúsculas, combinado con el filtro, persiste al cambiar filtro y al editar) y etiqueta **«Espuma»** en filtro/badge/desplegable/subtítulo conservando el valor `"FOAM"` en `localStorage` (sin migración). En `docs/specs/005-buscador/`. **25 tests en verde**.
- **Agentes SDD arreglados (2026-10-13)**: `coordinator` pasó a `mode: all` (antes `primary` → no invocable como `@coordinator`), rutas `specs/`→`docs/specs/` en coordinator/planner y permiso de edición del planner a `docs/specs/**`, AGENTS.md actualizado. NOTA: los subagentes pueden fallar con «free tier can only be used from within OpenCode» (límite del proveedor, no del proyecto).
- **Proyecto alineado con MyStudyDiary (2026-10-13)**: skills nuevas en `.agents/skills/` (`frontend-design`, `web-design-guidelines`, `local-dates` adaptada a `fecha`) + `skills-lock.json`; eliminado el duplicado obsoleto `.opencode/skills/sdd` (ahora carga el rico de `.agents` con rutas `docs/specs/`); AGENTS.md reescrito con la estructura completa de MSD (stack, datos, features, límites, verificación); reviewer con `git diff`/`git status` + skill de fechas; MCPs iguales (Context7 verificado **sin clave**, sin secretos); `.gitignore` + repo git con commit inicial `bc3b5f2` (40 archivos).

## Decisiones (y por qué)
- Arquitectura estática pura (HTML/CSS/JS, sin dependencias) → portabilidad y doble clic (`file://`).
- Orden de la lista: de más reciente a más antiguo por fecha.
- Obligatorios solo: empresa, teléfono y tipo.
- Idioma: identificadores, comentarios, interfaz y documentación en español (constitución regla 5, enmendada 2026-10-13).
- Tests: lógica pura en `logica.js` con `node --test`; la capa DOM se verifica con Chrome DevTools. Repo git desde 2026-10-13 (`.gitignore` al estilo de MSD, commit inicial `bc3b5f2`).

## Ubicación
- `C:\Users\carlo\Desktop\PROYECTOS\gestor-de-clientes` (siempre se trabaja desde aquí).
- Archivos de la app: `index.html`, `styles.css`, `logica.js`, `app.js`; tests: `test-logica.js`.

## Próximos pasos
- 005 cerrada. Mejoras candidatas: buscar clientes con resaltado, exportar/importar datos, OpenStreetMap como alternativa sin Google.
