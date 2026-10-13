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
- **Agentes SDD arreglados (2026-10-13)**: rutas `specs/`→`docs/specs/` en coordinator/planner, permiso de edición del planner a `docs/specs/**`, `reviewer.md` reescrito y AGENTS.md actualizado. `coordinator` = `mode: primary` (idéntico a MSD; se usa como agente principal con el selector, p. ej. `/agent coordinator`). El error «free tier can only be used from within OpenCode» es el **límite de sesiones de la free tier** (mensaje engañoso, se recupera solo): verificado 2026-10-13 — agente por defecto y reviewer OK en este proyecto y coordinator OK en MSD; agotada la ventana, fallan todos los agentes. No es configuración del proyecto.
- **Proyecto alineado con MyStudyDiary (2026-10-13)**: skills nuevas en `.agents/skills/` (`frontend-design`, `web-design-guidelines`, `local-dates` adaptada a `fecha`) + `skills-lock.json`; eliminado el duplicado obsoleto `.opencode/skills/sdd` (ahora carga el rico de `.agents` con rutas `docs/specs/`); AGENTS.md reescrito con la estructura completa de MSD (stack, datos, features, límites, verificación); reviewer con `git diff`/`git status` + skill de fechas; MCPs iguales (Context7 verificado **sin clave**, sin secretos); `.gitignore` + repo git con commit inicial `bc3b5f2` (40 archivos).
- **006-accesos IMPLEMENTADA (2026-10-13)**: pantalla de clave con dos perfiles — usuario (2468: añade/edita/busca) y administrador (9753: además borra, exporta/importa JSON y cambia claves). Claves guardadas **solo como hash SHA-256** (WebCrypto; por defecto documentadas, el admin las cambia); sesión en `sessionStorage` (+ «mantener sesión» en `localStorage`) y botón «Salir». Exportar descarga `clientes-AAAA-MM-DD.json` (fecha local) y importar reemplaza tras confirmar con contadores. Protección disuasoria sin servidor (decisión del usuario). En `docs/specs/006-accesos/`. **30 tests en verde**.
- **007-campos-libres IMPLEMENTADA (2026-10-13)**: nada es obligatorio en el formulario («Sin nombre»/«Sin tipo» en la ficha), campos nuevos **Móvil** y **Código postal** (formulario, ficha, buscador, exportar/importar; el mapa usa dirección + CP). Además el acceso ya **no depende de WebCrypto**: `hashTexto` es SHA-256 en **JS puro** síncrono con los mismos hashes de siempre (paridad con `CLAVES_POR_DEFECTO` testada) y los fallos se muestran en pantalla — el usuario no podía entrar en su navegador y esto lo arregla. Importar: item sin empresa vale si trae otro dato. En `docs/specs/007-campos-libres/`. **35 tests en verde**, verificado en navegador (incl. móvil 375 y consola limpia).

## Decisiones (y por qué)
- Arquitectura estática pura (HTML/CSS/JS, sin dependencias) → portabilidad y doble clic (`file://`).
- Orden de la lista: de más reciente a más antiguo por fecha.
- ~~Obligatorios solo: empresa, teléfono y tipo~~ → **nada obligatorio** (spec 007, decisión del padre del usuario): «que rellene lo que él considere».
- El hash de las claves es JS puro (spec 007): sin WebCrypto, para que el acceso funcione en cualquier navegador.
- Idioma: identificadores, comentarios, interfaz y documentación en español (constitución regla 5, enmendada 2026-10-13).
- Tests: lógica pura en `logica.js` con `node --test`; la capa DOM se verifica con Chrome DevTools. Repo git desde 2026-10-13 (`.gitignore` al estilo de MSD, commit inicial `bc3b5f2`).

## Ubicación
- `C:\Users\carlo\Desktop\PROYECTOS\gestor-de-clientes` (siempre se trabaja desde aquí).
- Archivos de la app: `index.html`, `styles.css`, `logica.js`, `app.js`; tests: `test-logica.js`.

## Próximos pasos
- 007 cerrada. **Pendiente grande**: el padre quiere app de escritorio (no web) — decisión tomada a medias (envolver el código actual vs. reescrita) y aún sin implementar. Mejoras candidatas: resaltado de coincidencias en el buscador, OpenStreetMap como alternativa sin Google.
