# Spec 015 — Provincia del cliente (campo y filtro)

| Campo | Valor |
|---|---|
| **ID** | `015-provincia` |
| **Título** | Campo «Provincia» en el cliente + filtro por provincia combinable con el de tipo |
| **Estado** | **Aprobada** (aprobación del usuario el 2026-10-17; Fase 1 sin consulta) |
| **Fecha** | 2026-10-17 |
| **Dependencia** | Se implementa **después** de cerrar la spec **014-tipos-multiples** (comparte `logica.js`, `app.js`, `index.html` y el catálogo de campos) |

---

## 1. Contexto y objetivo

El comercial trabaja visitando zonas: hoy sabe la dirección y el código postal de cada
cliente, pero **no tiene la provincia** como dato ni como forma de agrupar. Para ver los
clientes de una comarca tiene que buscar a mano o mirar una por una. La propia 012 ya
dejó el terreno preparado: el comentario del `CATALOGO_CAMPOS` dice literalmente
«pensado para ampliarse con «Provincia» (spec 015)».

**Objetivo:** añadir el campo **`provincia`** (texto libre, opcional) al formulario, a la
ficha, al buscador, al catálogo de campos del listado (012) y a la impresión (013), y un
**filtro por provincia** que se combine con el filtro de tipo y con la búsqueda, sin
perder ni reescribir ningún dato existente (regla 3 de la constitución).

**Usuarios:** el comercial que da de alta y edita clientes; el padre del usuario, con
datos reales ya guardados (web y `Documentos\Gestor de Clientes\clientes.json`), que no
tiene ningún cliente con provincia escrita y no debe verse alterado por esto.

**Historias de usuario:**

- **HU-1.** Como comercial, quiero anotar la provincia de cada cliente para saber dónde
  está sin tener que deducirlo de la dirección.
- **HU-2.** Como comercial, quiero filtrar la lista por provincia —y combinarlo con el
  filtro de tipo— para preparar la ruta de visitas de una zona.
- **HU-3.** Como usuario con datos antiguos, quiero que mis clientes sin provincia
  sigan apareciendo igual que antes y que solo yo decida cuándo rellenar el campo.
- **HU-4.** Como usuario del listado y del papel, quiero elegir «Provincia» como una
  columna más y que se imprima con el resto de campos elegidos.

## 2. Requisitos funcionales (EARS)

- **RF-1301 — Esquema: campo `provincia`, opcional y hacia atrás compatible.** EL
  SISTEMA SHALL admitir en cada cliente el campo **`provincia` (texto libre)**, opcional,
  junto a los campos existentes; **ningún campo existente SHALL eliminarse ni
  renombrarse**, la clave `gestorClientes` y el formato del array del fichero de
  escritorio SHALL permanecer intactos. CUANDO un cliente guardado **no tenga
  `provincia`** (todos los datos actuales), EL SISTEMA SHALL leerlo como **cadena vacía**
  («Sin provincia» en los textos de convención) **sin reescribir nada al cargar**: la
  ausencia de un campo nuevo NO SHALL provocar ninguna escritura de migración sobre el
  `localStorage` ni sobre `clientes.json`. SI `provincia` viniera con un valor que no sea
  texto (número, nulo, objeto), SHALL leerse convertido a texto y, si tras recortar
  queda vacío, como cadena vacía.
- **RF-1302 — Formulario con el campo «Provincia».** EL SISTEMA SHALL mostrar un campo
  de texto **«Provincia»** en el formulario, **entre «Código postal» y «Tipo de
  cliente»**, sin que nada sea obligatorio (spec 007) y sin `maxlength` (igual que
  Dirección o Contacto: la normalización solo recorta). CUANDO se guarde una alta o una
  edición, EL SISTEMA SHALL escribir `provincia` con el texto **recortado** (cadena
  vacía si el campo queda vacío o con solo espacios), conservando `id` y `fecha` en la
  edición (spec 002) y sin tocar el resto de campos. MIENTRAS se edite un cliente, EL
  SISTEMA SHALL cargar su `provincia` en el campo.
- **RF-1303 — Ficha (tarjeta): línea «Provincia».** CUANDO un cliente tenga `provincia`
  con contenido, la tarjeta SHALL mostrar la línea **«Provincia»** justo **después de
  «Código postal»**; SI está vacía, ENTONCES esa línea **no SHALL aparecer** (misma
  regla que Dirección, Móvil o Notas: `fila()` oculta lo vacío). Ningún otro elemento de
  la tarjeta (badges, canto, mapa, notas, acciones) SHALL cambiar.
- **RF-1304 — Búsqueda por provincia.** CUANDO el usuario busque, EL SISTEMA SHALL
  encontrar también por el texto de `provincia`, con las reglas de siempre (spec 005:
  todas las palabras «y», ignorando acentos y mayúsculas, combinado con los filtros).
- **RF-1305 — Filtro por provincia.** EL SISTEMA SHALL mostrar un **desplegable de
  provincia** junto a las pestañas de tipo, con una primera opción **«Todas las
  provincias»** (selección por defecto). El desplegable SHALL listarse con las
  **provincias existentes en los datos** (valores recortados, no vacíos, **únicos por
  forma normalizada** —ignorando acentos y mayúsculas—, mostrando la forma tal cual se
  guardó la primera vez) en **orden alfabético**. CUANDO el filtro de provincia esté
  activo, EL SISTEMA SHALL mostrar **solo los clientes cuya provincia coincida**
  normalizando acentos y mayúsculas («Cádiz» y «cadiz» son la misma provincia **para el
  filtro**; el texto guardado no cambia). Los clientes **sin provincia** SHALL aparecer
  **solo** en «Todas las provincias». El filtro de provincia SHALL combinarse en **Y**
  con el filtro de tipo y con la búsqueda. MIENTRAS la app esté abierta, el filtro
  SHALL vivir **solo en memoria** (sin claves nuevas de `localStorage`, igual que la
  vista y el filtro de tipo). El desplegable SHALL **repoblarse** tras cada alta,
  edición, borrado, importación y cambio de filtro de tipo; SI la provincia seleccionada
  ya no existe en los datos, EL SISTEMA SHALL **volver solo a «Todas las provincias»**
  (nunca un filtro imposible). CUANDO se cambie el filtro de tipo, la selección de
  provincia SHALL **conservarse** si sigue existiendo.
- **RF-1306 — Contador y estados vacíos.** El contador SHALL reflejar el resultado de
  tipo **+** provincia **+** búsqueda. CUANDO la lista quede vacía, el mensaje SHALL
  respetar esta prioridad: búsqueda → **provincia** → tipo → lista realmente vacía; con
  provincia activa el texto SHALL ser **«No hay clientes en «X». Prueba con «Todas las
  provincias» o con la pestaña «Todos».»** (con `X` = nombre de la provincia). Los
  mensajes existentes (búsqueda, «Todos», tipo) SHALL quedar **literales e intactos**.
- **RF-1307 — Listado (012): «Provincia» como campo elegible.** EL SISTEMA SHALL
  registrar `provincia` en el **`CATALOGO_CAMPOS`** con la etiqueta **«Provincia»**,
  entre «Código postal» y «Tipo» (mismo orden que el formulario). SI un cliente no tiene
  provincia, ENTONCES la celda SHALL mostrar **«—»** (convención existente). La
  selección por defecto SHALL seguir siendo **solo «Empresa»** y la selección de campos
  **NO SHALL persistirse** (RF-1006 intacta). Número de columnas, «…» + `title`, acciones
  por fila y el resto de reglas de la 012 SHALL permanecer sin cambios.
- **RF-1308 — Impresión (013) con la provincia.** `textoContextoImpresion(filtro,
  busqueda)` SHALL ampliarse con un **tercer parámetro opcional `provincia`** (firma
  compatible: sin él, el texto actual no cambia en ni un carácter). SI hay una provincia
  filtrada, EL SISTEMA SHALL añadir **«Provincia: X»** en la cabecera de contexto, entre
  «Filtro: …» y «Búsqueda: …», y la celda/columna «Provincia» se imprimirá cuando esté
  elegida (013 ya imprime lo que se ve). Ninguna otra regla de impresión SHALL cambiar.
- **RF-1309 — Escritorio (011), exportar/importar y almacenamiento.** `provincia` SHALL
  viajar sola en el array: la exportación la incluye y la importación la acepta
  ausente (cadena vacía) o presente (texto recortado), con los **mensajes de error
  literales** intactos y sin tocar los datos si el fichero es inválido. El sistema NO
  SHALL crear ninguna clave nueva de `localStorage`; ni el alta, la edición, el filtro,
  la búsqueda, el cambio de vista ni la impresión SHALL alterar la estructura de
  almacenamiento más allá del campo `provincia`. El sistema SHALL seguir funcionando
  **con doble clic** (`file://`), sin dependencias, frameworks ni módulos ES (regla 1).
- **RF-1310 — Cierre.** Toda la lógica nueva (tolerancia de lectura, provincias
  existentes/únicas, coincidencia normalizada, filtro, selección válida, cabecera de
  impresión) SHALL vivir en **lógica pura, sin DOM**, con tests en `node --test` **en
  verde** en un archivo **`test-provincia.js`** nuevo (para no pisar `test-logica.js`,
  que toca la 014); la interfaz se SHALL verificar en navegador (consola limpia, móvil
  375 px sin desbordes) y, al cierre, **`AGENTS.md` y `MEMORY.md` se actualizarán**.

## 3. Criterios de aceptación

- **Given** `localStorage` con clientes antiguos sin `provincia`, **when** se abre la
  app, **then** todos aparecen igual que antes, nadie tiene línea de provincia en la
  ficha y el almacenamiento **no se ha reescrito** (misma lista, sin escritura nueva).
- **Given** el formulario, **when** se escribe «Málaga» en Provincia y se guarda,
  **then** el cliente tiene `provincia: "Málaga"` y la ficha muestra la línea
  «Provincia: Málaga» justo debajo de «Código postal».
- **Given** un cliente con solo espacios en Provincia, **when** se guarda, **then**
  `provincia` es `""` y la ficha no muestra la línea.
- **Given** clientes de «Cádiz», «Málaga» y «MÁLAGA», **when** se abre el desplegable,
  **then** hay tres provincias (dos de Málaga se unifican en una sola opción normalizada
  y los datos guardados siguen intactos), ordenadas alfabéticamente.
- **Given** el filtro de provincia en «Málaga», **when** se filtra el tipo «Tela»,
  **then** solo aparecen los de Málaga **y** Tela (combinación en Y); **when** se busca
  «casa», **then** se estrecha aún más.
- **Given** el filtro de provincia en «Cádiz», **when** no hay ningún cliente sin
  provincia visible, **then** los «Sin provincia» **no** aparecen.
- **Given** el filtro de provincia en «Cádiz», **when** se borra el único cliente de
  Cádiz, **then** el desplegable se repuebla y **vuelve solo a «Todas las provincias»**,
  y la lista muestra lo que corresponda.
- **Given** el filtro de provincia en «Málaga» y el tipo «Tela», **when** se cambia la
  pestaña a «Espuma», **then** la provincia sigue en «Málaga» (si sigue existiendo) y el
  contador refleja tipo + provincia + búsqueda.
- **Given** la lista vacía con provincia activa, **when** se pinta, **then** el mensaje
  es «No hay clientes en «Málaga». Prueba con «Todas las provincias» o con la pestaña
  «Todos»».
- **Given** el buscador, **when** se escribe «malaga», **then** aparece el cliente con
  `provincia: "Málaga"` (ignora acentos, como todo el buscador).
- **Given** el listado, **when** se marca «Provincia» en el selector de campos,
  **then** la columna aparece entre «Código postal» y «Tipo», con «—» si no hay valor;
  **when** se imprime, **then** sale la columna y la cabecera dice
  «Gestor de Clientes · Filtro: Tela · Provincia: Málaga · Búsqueda: “casa”».
- **Given** un JSON exportado por esta versión, **when** se importa, **then** las
  provincias quedan idénticas; **when** se importa un JSON antiguo (sin `provincia`),
  **then** todos quedan con `""` y la importación informa igual que siempre.
- **Given** la app de escritorio, **when** se guarda un cliente con provincia,
  **then** `clientes.json` la incluye y un `clientes.json` antiguo se lee sin tocar nada.
- `node --test` en verde (tests nuevos de `test-provincia.js` + los existentes), **sin
  DOM**; consola del navegador limpia; móvil 375 px sin desbordes; interfaz en español.

## 4. Casos límite

- **Datos antiguos** (todos los actuales): sin `provincia` → `""`, sin ninguna
  escritura al cargar; la ficha no muestra la línea y el listado muestra «—».
- **`provincia` que no es texto** (número, nulo, objeto) → convertida a texto en lectura;
  lo que quede vacío tras recortar → sin provincia. **Solo espacios** → `""`.
- **Variantes de mayúsculas/acentos** («CÁDIZ», «Cádiz», «cadiz»): el **filtro** las
  trata como la misma provincia; los **datos** conservan cada forma tal cual se escribió
  (no se unifican ni se reescriben, igual que con los tipos libres de la 008).
- **Dos provincias que normalizan igual** → **una sola opción** en el desplegable (la
  forma de la primera aparición, en orden de lista), sin tocar los datos.
- **Provincia con caracteres especiales** («+», comillas, `<`) → texto plano, escapado
  al pintar con `escapar()` / `escaparAtributo()` (como el resto de campos).
- **Texto muy largo** (más de 40 caracteres) → se guarda íntegra (sin truncar, igual que
  el resto de campos de texto); en el listado la celda aplica «…» + `title` de siempre.
- **Cliente sin provincia con tipo marcado**: entra en su pestaña de tipo y en
  «Todas las provincias», pero nunca en una provincia concreta (las reglas de «Sin
  tipo» de la 014 siguen intactas).
- **Borrar/editar el último cliente de la provincia filtrada** → el desplegable se
  repuebla y el filtro vuelve a «Todas las provincias» (RF-1305).
- **Importar** con la provincia activa: si la nueva lista no contiene esa provincia, el
  filtro vuelve a «Todas» (mismo criterio).
- **Muchas provincias**: el desplegable es un único control (no pestañas), así que a
  375 px no hay desbordes ni scroll horizontal.
- **Alta con filtro de provincia activo**: la 010 ya limpia el buscador y la pestaña
  vuelve a «Todos»; con la 015 el desplegable **vuelve a «Todas las provincias»** en el
  mismo momento (coherencia con el alta).
- **Edición que quita la provincia** con el filtro activo en esa provincia: el cliente
  desaparece de la lista filtrada y, si era el único, el filtro vuelve a «Todas».
- **Impresión sin provincia filtrada**: el texto de la cabecera es **idéntico** al
  actual (compatibilidad de firma, RF-1308).

## 5. Fuera de alcance

- Lista predefinida de las 50 provincias, comunidades autónomas, países o capitales
  (es texto libre, Decisión 1).
- Autocompletado de provincias, geocodificación, estadísticas por provincia, mapa por
  provincia ni filtros persistentes.
- Cambios en la clave `gestorClientes`, en el array del fichero de escritorio ni en el
  resto de campos del esquema.
- Modificar las specs cerradas 002–013 ni la **014** (se implementa después de cerrarla
  y solo se le añade un campo al lado de las suyas).
- Ampliar el mapa (004) para que use la provincia: sigue usando dirección + CP.

## 6. Decisiones

1. **Provincia = texto libre, sin lista cerrada.** El comercial escribe la provincia
   como la llama («Cádiz», «Cadiz», «Málaga»); nada lo obliga y nadie lo bloquea.
   *Descartadas:* **`<select>` con las 50 provincias** (no admite otras zonas ni
   escribir como se quiera, y obligaría a migrar/etiquetar datos existentes);
   **campo obligatorio** (contradice la spec 007 «nada es obligatorio»).
2. **Filtro = desplegable dinámico, no pestañas.** Las provincias dependen de los datos:
   las pestañas fijas de tipo (004 de la 008) no escalan y a 375 px ocuparían todo el
   ancho. *Descartadas:* **pestañas generadas dinámicamente** (inestables al añadir
   provincias y mal en móvil); **campo de texto libre para filtrar** (admite erratas y
   fuerza a escribir exactamente igual).
3. **Coincidencia normalizada (acentos/mayúsculas) solo para el filtro; los datos se
   guardan tal cual.** Coherente con el buscador (005) y sin reescribir nada.
   *Descartada:* **comparación exacta** dejaría «Cádiz» y «cadiz» como dos provincias
   distintas en el desplegable y filtrando a medias.
4. **«Todas las provincias» por defecto y vuelta automática si la selección desaparece.**
   Nunca se queda un filtro imposible que enseña la lista vacía sin explicación.
   *Descartada:* **conservar la selección aunque ya no exista** (usuario atrapado en un
   filtro sin resultados).
5. **`provincia` vacía = no se muestra en la ficha («—» en el listado).** La ficha ya
   oculta las líneas vacías (Móvil, Dirección, Notas) y el listado ya usa «—».
   *Descartada:* **etiqueta «Sin provincia»** en la ficha (ruido visual en todas las
   fichas antiguas, que son todas).
6. **Sin escritura de migración** (a diferencia de la 014): la ausencia de un campo
   nuevo **no es** una contradicción de datos; leerla como `""` basta y así la app no
   reescribe el `localStorage` ni el `clientes.json` del padre solo por abrirse.
   *Descartada:* **migración idempotente que añada `provincia: ""` a todos** (escritura
   innecesaria sobre datos reales, contra la regla 3 y sin aportar nada).
7. **Posición: entre «Código postal» y «Tipo de cliente»** en formulario, catálogo,
   ficha e impresión (sigue el agrupado geográfico: dirección → CP → provincia).
   *Descartada:* **al final, tras «Notas»** (rompe ese agrupado y la celda quedaría
   lejos de la dirección en el papel).
8. **`textoContextoImpresion(filtro, busqueda, provincia)` con el parámetro nuevo
   opcional al final.** Conserva la firma actual y sus tests verdes; sin provincia, el
   texto no cambia en un carácter. *Descartada:* **objeto de opciones `{ filtro,
   busqueda, provincia }`** (cambio de firma grande para un dato más).
9. **Tests en `test-provincia.js` (archivo nuevo).** AGENTS.md ya permite varios
   `test-*.js`, y así no se choca con `test-logica.js`, que la 014 está modificando
   ahora mismo. *Descartado:* **seguir acumulando todo en `test-logica.js`** (merge
   evitable entre dos specs a la vez).
10. **Se implementa tras cerrar la 014.** Comparten `logica.js`, `app.js`, `index.html`
    y el catálogo de campos; en paralelo solo se pisarían. La spec ya está escrita para
    el estado **post-014** (esquema con `tipos` + `provincia`).

**Dudas abiertas:** ninguna pendiente; la decisión «campo + filtro» vino pedida
explícitamente por el usuario (2026-10-17) y el resto se resolvió aquí con la opción
recomendada.
