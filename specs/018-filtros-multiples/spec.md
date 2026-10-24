# Spec 018 — Filtros múltiples por tipo y provincia (dos desplegables con casillas)

| Campo | Valor |
|---|---|
| **ID** | `018-filtros-multiples` |
| **Título** | Sustituir las pestañas de tipo y el desplegable único de provincia por dos desplegables con casillas de selección múltiple (tipos en «y», provincias en «o»), combinados en Y con la búsqueda |
| **Estado** | **Implementada** (2026-10-24) — enmienda de semántica del grupo tipo («o» → «y») **aprobada por el usuario (2026-10-22)**; `node --test` **166/166**, acta T-07 en `tasks.md` |
| **Fecha** | 2026-10-21 |
| **Dependencia** | Se implementa sobre el estado cerrado de las specs **014** (tipos múltiples, pertenencia), **015** (provincia y su filtro), **013/017** (impresión, vista previa y PDF), **012** (listado), **016 → casillas del formulario 2026-10-20** (patrón visual de casillas) y **005** (buscador, **intacto**). **Derogaciones expresas**: (a) el RF-1205 de la 014, en su frase final («Las pestañas (Todos / Tela / Espuma / Estructuras / Otros), sus textos, colores y el contador SHALL permanecer sin cambios»): **las pestañas desaparecen**; (b) el RF-1305 de la 015 (desplegable **único** de provincia): pasa a selección múltiple conservando sus reglas de opciones (únicas normalizadas, repueblado, vuelta automática a «sin filtro»); (c) el RF-1306 de la 015, tanto sus literales («la pestaña «Todos»» y ««Todas las provincias»») como **toda su mecánica de mensajes** —estructura de prioridad búsqueda → filtros → vacío—, sustituidos por el RF-1607; (d) el RF-104 de la 003 (color de la pestaña activa) y la pestaña «Otros» de la 008, que pasan a ser casillas. **Nota**: la spec **004 es el mapa** (RF-201…207), que **no se toca**; la barra de pestañas nació en la v1 previa a las specs y la pestaña «Otros» en la 008. La 002 (edición/borrado) queda intacta: su mención de «pestaña de filtro» se lee a partir de ahora como «control de filtro». |

---

## 1. Contexto y objetivo

El usuario pide, con sus palabras: *«En la app, actualmente existe el filtro, pero solo deja
seleccionar una cosa entre los tipos de clientes. Hay que mejorar el filtro, quiero que se pueda
filtrar por tipo de cliente y por provincia, y que se puedan elegir varios tipos a la vez. Quiero
poder buscar clientes de espuma y telas que sean de las provincias de Valencia y Castellón. Quiero
poder filtrar varias cosas a la vez, SIN LÍMITE. Además de mantener en la medida de lo posible lo
que ya hay. Y para no sobrecargar la vista, que salgan varios desplegables en los que se puedan
seleccionar con casillas mis elecciones del filtro. El buscador está genial»*.

**Situación actual:** la barra de filtros son **cinco pestañas** (Todos / Tela / Espuma /
Estructuras / Otros) + **un desplegable único** de provincia («Todas las provincias») + el
buscador. Con las pestañas solo puede haber **un** filtro de tipo activo a la vez: para ver a la
vez «Espuma» y «Tela» hay que ir a «Todos» y mirar a ojo; con la provincia pasa lo mismo (una
sola). El usuario quiere exactamente el caso inverso: **conjuntos** de tipos y **conjuntos** de
provincias, combinados.

**Decisión del usuario (ya tomada, no se cuestiona):** dos **desplegables con casillas** —uno
«Tipo de cliente» y otro «Provincia»—; cada uno se abre mostrando **casillas de verificación** para
marcar varias opciones **sin límite**; **las pestañas actuales desaparecen**; el **buscador de
texto no cambia**. La app sigue siendo web + escritorio **sin dependencias** (JS puro,
`file://`), interfaz 100 % en español, objetivos táctiles ≥ 44 px, diseño retro-memphis y móvil
375 px sin desbordes.

**Cambio de semántica del grupo tipo (petición del usuario, 2026-10-21, verbatim):** *«Cuando
filtre, quiero poder ver el filtro exacto: si filtro tela solo tela, si filtro espuma solo espuma,
si filtro TELA + ESPUMA quiero ver solo los clientes de TELA + ESPUMA, no los clientes de tela y
los clientes de espuma, y los clientes de ambas cosas a la vez»*. Preguntada la semántica,
**respondió: tipos en «y» (intersección) y provincias en «o» (unión)**, confirmando la lectura:
*«Tela+Espuma → solo clientes con LOS DOS tipos (los de un solo tipo no salen); Varias provincias
→ cualquiera de las elegidas (imposible estar en dos); Entre grupos se mantiene la «y»: (Tela y
Espuma) y (Valencia o Castellón) y búsqueda»*. El cambio afecta **solo** a la semántica *dentro*
del grupo tipo: ver RF-1602, RF-1604 y las decisiones 2 y 12.

**Objetivo:** que el usuario pueda responder de un vistazo a preguntas como *«muéstrame los
clientes que son a la vez de Espuma y de Tela, y están en Valencia o en Castellón»* —tipos en «y»
(exigir todos los marcados), provincias en «o», y los dos grupos en «y» con la búsqueda— **sin**
perder nada de lo que ya funciona: buscador, contador, estados vacíos, orden, listado, mapa,
impresión, vista previa, PDF, exportar/importar, web y escritorio, y sobre todo **ni un solo
cliente guardado**.

**Definiciones:**

- **Grupo de filtro**: cada uno de los dos desplegables (tipo y provincia); su estado es el
  **conjunto de casillas marcadas**.
- **Marcas / selección**: las casillas marcadas de un grupo. **Cero marcas = sin filtro** de ese
  grupo (se ve todo), igual que hoy «Todos» y «Todas las provincias».
- **Pertenencia** (concepto heredado de la 014): un cliente «tiene» un tipo si ese tipo está entre
  sus tipos efectivos (`tiposCliente`), sea fijo o libre.
- **Opción**: entrada del desplegable. En tipo son **cinco fijas** (Tela, Espuma, Estructuras,
  Otros, Sin tipo); en provincia son **las provincias de los datos** (únicas por `normalizar`,
  misma regla que el RF-1305) **más la casilla fija «Sin provincia»**, siempre presente y **sin
  depender de los datos** (análoga de «Sin tipo»). **Colisión de etiqueta (decidida)**: si un
  cliente tuviera escrita literalmente «Sin provincia» (el campo es texto libre), esa provincia
  real se lista **además** como opción normal, **sin fusionarse** con la casilla fija: son **dos
  entradas distintas** con etiqueta similar (ver RF-1603 y su caso límite).
- **«Otros»**: en el filtro, la casilla que selecciona a los clientes con **algún tipo no fijo**
  (la agrupación de la 008).
- **«y» del grupo tipo / «o» del grupo provincia (enmienda 2026-10-21):** con casillas marcadas en
  el grupo **tipo**, un cliente pasa solo si cumple **todas** las marcadas (intersección); con
  casillas marcadas en el grupo **provincia**, pasa si coincide con **alguna** (unión: un cliente
  solo puede estar en una provincia). Entre grupos y con la búsqueda la combinación es siempre
  «y».
- **Dataset canónico de las evidencias (acta A–I):** las evidencias de esta spec usan nueve
  clientes: `A: Tela / Valencia`, `B: Espuma / Castellón`, `C: Tela+Espuma / Valencia`,
  `D: sin tipos / Castellón`, `E: Toldos (libre) / Valencia`, `F: sin tipos / sin provincia`,
  `G: sin tipos / «Sin provincia» escrita literalmente`, `H: Estructuras / Gandía` e
  `I: Espuma + Toldos Vega (multi-tipo con tipo libre) / CÁDIZ`.

**Usuarios:** el comercial (usuario directo), que quiere cruzar tipos y provincias sin límite;
el padre del usuario, con datos reales en `localStorage` y en
`Documentos\Gestor de Clientes\clientes.json`, que **no debe ver alterado ni un solo cliente** ni
perder sus formas de trabajar actuales; quien imprime o guarda el listado en PDF, que necesita que
la cabecera de la hoja siga contando exactamente lo que se ve.

**Historias de usuario:**

- **HU-1.** Como comercial, quiero marcar **varios tipos** (p. ej. Espuma y Tela) en un
  desplegable con casillas para ver **solo** a los clientes que tengan **todos** los tipos
  marcados (el filtro exacto: Tela + Espuma = los que son de las dos cosas).
- **HU-2.** Como comercial, quiero marcar **varias provincias** (p. ej. Valencia y Castellón) en
  otro desplegable con casillas —**cualquiera** de las elegidas— y que se combine en «y» con los
  tipos elegidos, para encontrar a «los que son a la vez de Espuma y Tela y están en Valencia o
  en Castellón» de un golpe.
- **HU-3.** Como usuario, quiero que el **buscador de texto siga funcionando igual** y que se
  combine con los dos filtros nuevos, para afinar aún más sin tocar las casillas.
- **HU-4.** Como usuario, quiero que la **etiqueta** de cada desplegable me diga qué tengo
  marcado (p. ej. «Tipo: Tela, Espuma (2)») y que cada panel lleve su **«Limpiar»**, para no
  perder la cuenta de lo que estoy filtrando.
- **HU-5.** Como usuario, quiero que la **impresión y el PDF** sigan saliendo limpios y que la
  cabecera describa **todos** los filtros activos, para que el papel cuente lo mismo que la
  pantalla.
- **HU-6.** Como usuario, quiero que nada de esto toque mis datos guardados ni me introduzca en
  dependencias ni servidores, para seguir abriendo la app con doble clic igual que siempre.
- **HU-7.** Como usuario, quiero una casilla **«Sin provincia»** dentro del desplegable de
  provincia (análoga a «Sin tipo») para ver **a propósito** a los clientes a los que no les he
  escrito provincia (p. ej. los datos antiguos).

## 2. Requisitos funcionales (EARS)

- **RF-1601 — Barra de filtros: dos desplegables con casillas; desaparecen las pestañas.**
  CUANDO la app muestre la lista, EL SISTEMA SHALL mostrar en su barra de filtros **dos y solo
  dos controles de filtro** —**«Tipo de cliente»** y **«Provincia»**—, cada uno con un
  **disparador (trigger)** que muestre su etiqueta de estado — «Tipo: Todos» / «Tipo: Tela,
  Espuma (2)»; «Provincia: Todas» / «Provincia: Valencia, Castellón (2)», con el número entre
  paréntesis **solo si hay marcas** — y que, al activarse, abra un **panel con casillas de
  verificación** donde se pueden marcar **varias opciones a la vez o ninguna, sin límite** en
  ninguno de los dos grupos. El trigger SHALL actualizar su etiqueta **al instante** con cada
  marca. Los dos desplegables SHALL ocupar en la barra **el sitio que hoy ocupan las pestañas y
  el desplegable único de provincia** (a la **izquierda del buscador**, que permanece al final de
  la barra). CUANDO la etiqueta de un trigger **no quepa** en su ancho disponible, EL SISTEMA
  SHALL **cortarla con «…»** y mostrar el texto completo en `title` (coherente con los badges y
  las celdas del listado: 012/014). La **barra de pestañas actual (Todos / Tela / Espuma /
  Estructuras / Otros) SHALL desaparecer** — derogación expresa del RF-1205 (frase final), del
  RF-104 de la 003 y de la pestaña «Otros» de la 008, como se indica en la cabecera de esta
  spec—. El **buscador SHALL permanecer en su sitio, con su misma interfaz y su misma
  semántica** (spec 005 **intacta**). MIENTRAS dure la sesión, las dos selecciones SHALL vivir
  **solo en memoria**: **no** SHALL crearse ninguna clave nueva de `localStorage` (presentación
  pura: mismo criterio que RF-1006 (012) + RF-1511 (017), con datos y claves intactos).
  **Evidencia (MCP Chrome):** abrir `index.html`, constatar que la barra contiene exactamente dos
  controles con esos textos y **cero** botones `data-filtro`, que cada panel abre con sus casillas,
  que la etiqueta refleja las marcas al marcarlas, que tras recargar no hay claves nuevas en
  `localStorage` y que la consola queda **limpia**.
- **RF-1602 — Grupo «Tipo de cliente»: cinco casillas fijas y semántica «y» (intersección).**
  El panel de tipo
  SHALL ofrecer **exactamente cinco casillas, siempre visibles** (no dependen de los datos, igual
  que no dependían las pestañas): **Tela**, **Espuma**, **Estructuras**, **Otros** y **Sin
  tipo**. CUANDO esté marcada **una o varias** casillas, EL SISTEMA SHALL mostrar **solo los
  clientes que cumplan TODAS las marcadas** (semántica «y», enmienda 2026-10-21), donde cada
  marca significa:
  «Tela»/«Espuma»/«Estructuras» → el cliente **tenga ese tipo entre sus tipos** (pertenencia de
  la 014, ahora exigida **a la vez** para cada marca: `["Tela","Espuma"]` pasa con {Tela}, con
  {Espuma} y con {Tela, Espuma}, pero **no** con {Tela, Estructuras}); «Otros» →
  el cliente tenga **algún tipo no fijo** (los que además llevan fijos también entran — Decisión
  7 de la 014 intacta—; combinado con un fijo es intersección normal: exige **el fijo y además**
  un tipo libre); «Sin tipo» → el cliente **no tenga tipos**. SI **«Sin tipo»** estuviera marcada
  **junto con cualquier otra casilla** (fijo u «Otros»), ENTONCES EL SISTEMA SHALL mostrar
  **lista vacía**: es un **imposible lógico** («Sin tipo» exige `tiposCliente` vacío y cualquier
  otra marca exige algún tipo) — **decidido**: **sin** desmarcado automático (el grupo tipo nunca
  se auto-desmarca, RF-1605) y con el estado vacío del RF-1607. CUANDO **ninguna** casilla
  esté marcada, EL SISTEMA SHALL **no filtrar por tipo** (lista completa) — por eso el filtro
  lleva una casilla **«Sin tipo»** que el formulario no necesita: allí nada marcado significa
  «sin tipo» (RF-1403), mientras que aquí nada marcado significa **sin filtro** (Decisión 3). El
  orden de las opciones en el panel SHALL ser **Tela, Espuma, Estructuras, Otros, Sin tipo**.
  **Evidencia:** `node --test` (intersección con 1 y con N marcas, «Otros»∩fijo, «Sin tipo» solo,
  imposibles «Sin tipo»+fijo y «Sin tipo»+«Otros», lista vacía) + MCP Chrome
  con el acta A–I marcando casillas de una en una y varias a la vez: {Tela} → A y C;
  {Tela, Espuma} → **solo C**; {Otros} → E e I; {Otros, Espuma} → **solo I**; {Sin tipo} → D, F y
  G; {Sin tipo, Tela} y {Sin tipo, Otros} → **0 resultados** (estado vacío del RF-1607); 0 marcas
  → los nueve.
- **RF-1603 — Grupo «Provincia»: provincias espejo de los datos (texto libre incluido) + casilla
  fija «Sin provincia», y semántica «o».** El panel de provincia SHALL listar **una casilla por
  provincia** de los clientes que pasen el **grupo tipo** actualmente marcado (misma base que el
  RF-1305: **sin tener en cuenta la búsqueda**; nada marcado en tipo → provincias de **todos** los
  clientes), con las reglas heredadas de la 015: valores **no vacíos**, **únicos por forma
  normalizada** (acentos y mayúsculas fuera: «Cádiz» ≡ «cadiz» ≡ «CADIZ»), mostrando la **primera
  forma guardada** y en **orden alfabético** (locale «es»), **más una casilla fija «Sin
  provincia»** al **final** del panel (tras las provincias), **siempre visible**: no depende de los
  datos ni del grupo tipo (igual que las cinco casillas del RF-1602). **Colisión de etiqueta
  decidida**: si un cliente tuviera escrita literalmente «Sin provincia», esa provincia real se
  lista **también** como opción **normal** en su posición alfabética (coincide por texto con los
  clientes que la tengan escrita) y la casilla **fija** «Sin provincia» **sigue** anclada al final
  del panel con su semántica de provincia vacía/ausente: son **dos casillas distintas** con
  etiqueta similar, que **no** se fusionan, **no** se excluyen entre sí y se marcan por separado.
  CUANDO estén marcadas **una o varias** opciones del grupo, EL SISTEMA SHALL mostrar **solo los
  clientes cuya provincia coincida con ALGUNA de las marcadas** (normalizando, solo para el
  filtro: el texto guardado no cambia), donde **«Sin provincia» (la fija)** coincide con los
  clientes cuya `provincia` está **vacía o ausente** y la opción normal «Sin provincia» (si
  existiera) **solo** con quienes la tengan **escrita** — un cliente con la provincia escrita
  «Sin provincia» **no** pasa por la casilla fija, porque su provincia no está vacía—.
  CUANDO **ninguna** esté marcada, SHALL ser sin filtro de provincia (pasan **todos**,
  incluidos los sin provincia). SI **alguna** provincia real estuviera marcada y «Sin provincia»
  **no** lo estuviera, ENTONCES los clientes sin provincia **NO** SHALL pasar el filtro (coherente
  con el RF-1604: el grupo solo deja pasar lo que coincide con lo marcado). **Decisión 4**: las
  provincias escritas **con texto libre** que no estén entre las sugerencias del formulario (p. ej.
  «Gandía», o el nombre de otro país) SHALL aparecer igual como opción si **algún cliente la
  tiene**: el desplegable de provincia es **espejo de los datos** (más la casilla fija «Sin
  provincia»), no un catálogo cerrado de 52. **Evidencia:** `node --test` (opciones únicas
  normalizadas, «o», «Sin provincia» marcada y desmarcada) + MCP Chrome con el acta A–I: con el
  grupo tipo **vacío**, el panel lista **CÁDIZ, Castellón, Gandía, Valencia** (una sola casilla
  por Cádiz normalizado; «Gandía» y «CÁDIZ» están por ser texto libre de los datos) más la
  provincia normal «Sin provincia» (de G) en su posición alfabética y la casilla **fija «Sin
  provincia»** siempre **al final**; con tipo {Tela} (solo A y C) las opciones se reducen a
  **{Valencia}** + la fija. Con «Sin provincia» (la fija) marcada (sola o con
  «Valencia») **se ve F**, desmarcándola con «Valencia» aún marcada **F desaparece**, y con el
  grupo provincia **vacío** F se ve (RF-1604). Con «G» (provincia
  escrita literalmente «Sin provincia») hay **dos** casillas con esa etiqueta — la normal en su posición alfabética y la
  fija **anclada al final** (colisión decidida) —: marcando solo la normal se ve **G**, marcando
  solo la fija se ve **F**, y con las dos **F y G**.
- **RF-1604 — Combinación en Y entre tipo, provincia y búsqueda, sin límite.** CUANDO estén
  marcadas casillas en uno o en los dos grupos y/o haya texto en el buscador, EL SISTEMA SHALL
  mostrar **solo** los clientes que cumplan **a la vez** los tres criterios activos: (1) tienen
  **todos** los tipos marcados —cualquiera si el grupo tipo está vacío— (intersección, RF-1602);
  (2) su provincia está
  entre **algunas** de las marcadas —incluida «Sin provincia», que marca a los de `provincia`
  vacía o ausente—, y si el grupo provincia está vacío pasan **todos** sin filtrar por provincia;
  (3) pasan
  la búsqueda de texto con las reglas **intactas** de la 005 (multi-palabra «y», acentos y
  mayúsculas fuera, combinada con el filtro). **No SHALL existir límite** al número de casillas
  marcadas en ninguno de los dos grupos. CUANDO el usuario marque o desmarque una casilla, EL
  SISTEMA SHALL repintar **al instante** lista, contador y estados vacíos, sin botón «Aplicar» y
  sin recargar (mismo comportamiento en vivo que el buscador). **Evidencia (MCP Chrome):** con el
  acta A–I (definiciones): tipo {Tela, Espuma} → **solo C** (A y B son de un solo tipo y, aunque
  I es multi-tipo, no lleva Tela); tipo {Tela} + provincia {Valencia} → A y C; tipo {Tela,
  Espuma} + provincia {Valencia} → solo C —y con {Castellón} **no existe** la opción (opciones
  espejo: con {Tela, Espuma} solo hay {Valencia}, RF-1603)—; tipo {Otros} + provincia {CÁDIZ} →
  solo I; tipo {Otros, Sin tipo} → **0 resultados** (imposible lógico del RF-1602); y con los
  tres criterios encima —tipo {Espuma} + provincia {CÁDIZ} + búsqueda «vega»— **solo I**
  (Espuma ∩ CÁDIZ ∩ «Toldos Vega»). Con el grupo tipo **vacío**: provincia {Sin provincia} (la
  fija) → solo F; provincia {Valencia, Sin provincia} → A, C, E y F; quitando «Sin
  provincia» → F **desaparece** de la lista y del contador (los tres criterios en Y con la nueva
  marca).
- **RF-1605 — Validación de las marcas: análogo del RF-1305 con desmarcado automático.**
  EL SISTEMA SHALL repoblar las opciones del grupo **provincia** cada vez que cambie la selección
  del **grupo tipo** y tras cada **alta, edición, borrado e importación**. SI una provincia
  marcada **deja de existir entre las opciones** —porque cambió la selección de tipos o porque
  cambiaron los datos—, ENTONCES EL SISTEMA SHALL **desmarcarla sola** (análogo del «volver a
  «Todas las provincias»» del RF-1305): **nunca** un filtro imposible ni una marca sin efecto
  visible. La forma **visible** de cada provincia SHALL alinearse a la **primera forma guardada**
  (como ya hacía el `<select>` de la 015 con «Cádiz»/«CÁDIZ»); el filtrado no cambia porque
  normaliza. El grupo **tipo** SHALL no depender de nada: sus cinco casillas **nunca se
  desmarcan solas por validación ni desaparecen** por cambios de datos (el reset **explícito** de
  marcas que aplican el alta y la importación del RF-1609 es **otro caso**, no un desmarcado
  automático). La casilla **fija «Sin provincia»** del grupo
  provincia SHALL seguir **la misma regla que las del grupo tipo**: como no es una provincia real
  (no nace de los datos), **nunca** se desmarca sola por repueblado; si con ella marcada **no
  queda ningún cliente sin provincia** (dentro de los tipos marcados), la marca **se queda como
  está** y, si el resultado queda vacío, la lista muestra el estado vacío correspondiente del
  RF-1607, **nunca** un desmarcado automático. MIENTRAS un panel esté abierto, los cambios de
  marcas y los repueblos SHALL refrescarse **en el propio panel y en la etiqueta** sin cerrarlo.
  **Evidencia (MCP Chrome):** con el acta A–I: tipo {Espuma} → visibles B, C e I → opciones
  {Valencia, Castellón, CÁDIZ}; marcar «Castellón» (se ve solo B); añadir «Tela» —quedando
  {Tela, Espuma}, solo C visible— → opciones {Valencia} y «Castellón» **se desmarca sola**,
  repintando lista y etiqueta con el panel **sin cerrarse**; quitar «Tela» → {Espuma} recupera
  las tres opciones, pero «Castellón» **no** se vuelve a marcar sola (solo se desmarcan marcas,
  nunca se crean); borrando al único cliente de una provincia marcada (p. ej. I con «CÁDIZ»
  marcada), esa casilla **desaparece desmarcada**; y con «Sin provincia» (la fija) marcada, **no
  se desmarca sola** al repoblar ni aunque desaparezcan los clientes sin provincia vacía
  (borrando a F: la marca sigue presente en el panel y, sin resultados, sale el estado vacío del
  RF-1607); con un forzado de estado (igual
  que en el acta de la 015) se constata la rama defensiva sin dejar restos.
- **RF-1606 — Interfaz de los desplegables: patrón de casillas del formulario, foco, scroll y
  375 px.** Los dos paneles SHALL usar el **mismo patrón visual de casillas** que el campo
  «Tipo de cliente» del formulario (casillas de la revisión de 2026-10-20): casilla de
  verificación de 20 px dentro de un objetivo **≥ 44 px**, borde/redondeado/tinta del proyecto
  (retro-memphis, spec 003, **sin sombras**), **foco visible en la casilla entera** y textos **100 %
  en español**. El trigger SHALL ser operable con teclado (Tabulador para alcanzarlo; Intro o
  Espacio para abrirlo) y su estado SHALL ser **texto visible** (legible también para lectores de
  pantalla). CUANDO el panel esté abierto, EL SISTEMA SHALL: permitir marcar y desmarcar
  **sin cerrarse**; cerrarse con **Escape**, con un clic **fuera** del panel o volviendo a pulsar
  el trigger; **mantener la posición de scroll de la página y devolver el foco al trigger** al
  cerrar (no SHALL perderse el foco ni saltar la posición de lectura); y **cerrar el otro panel**
  si estuviera abierto (nunca dos a la vez). Dentro de cada panel SHALL haber un botón
  **«Limpiar»** que desmarque **todas** las casillas de **ese** grupo (equivalente a «sin filtro»)
  **sin cerrar** el panel. CUANDO la app esté a **375 px**, la barra con los dos controles y sus
  paneles SHALL apilarse **sin desbordamiento horizontal** (con muchas provincias, el panel SHALL
  desplazarse **dentro de sí mismo**, sin estirar la página). El panel abierto SHALL ser
  **chrome**: **no** SHALL aparecer en la impresión, en la vista previa ni en el PDF (013/017
  intactas). **Evidencia (MCP Chrome):** teclado real (Tab, Intro, Escape, foco de vuelta al
  trigger con `document.activeElement`), clic fuera, «Limpiar», dos paneles nunca abiertos a la
  vez, **375 px con 15+ provincias marcadas sin desborde** (`document.documentElement.scrollWidth`
  = ancho del viewport), panel abierto + Ctrl+P (no aparece en la hoja) y consola limpia.
- **RF-1607 — Contador y estados vacíos contextuales.** El contador SHALL reflejar el resultado
  de **tipo + provincia + búsqueda** (los tres a la vez; misma función de siempre). CUANDO la
  lista quede vacía, el mensaje SHALL respetar la prioridad **búsqueda → filtros → lista
  realmente vacía** y usar estos literales:
  1. Con búsqueda activa: **«No hay coincidencias para «X». Prueba con otras palabras o desmarca
     alguna casilla.»**; y SI **ninguno** de los dos grupos tiene marcas, ENTONCES la variante
     sin la segunda parte: **«No hay coincidencias para «X». Prueba con otras palabras.»** (el
     «…o con la pestaña «Todos»» actual desaparece con las pestañas);
  2. Sin búsqueda y con casillas marcadas: **«No hay clientes con estos filtros (Tipo: Tela,
     Espuma · Provincia: Valencia). Desmarca alguna casilla.»**, mostrando **solo las piezas
     activas** unidas por « · » (solo tipo → «(Tipo: …)»; solo provincia → «(Provincia: …)»);
  3. Sin filtros ni búsqueda: el literal actual **«Aún no hay clientes. Rellena el formulario de
     arriba para añadir el primero.»** **intacto**, con el **mensaje de migración en 2 clics**
     de la 011 cuando corresponda (escritorio sin archivo inicial).
  Los literales del RF-1306 de la 015 que nombran **«la pestaña «Todos»»** y **««Todas las
  provincias»»**, junto con **toda su mecánica de mensajes** (la prioridad búsqueda → filtros →
  vacío), SHALL quedar **derogados** y sustituidos por la estructura de este RF (derogación
  ampliada en la cabecera). Con el grupo tipo en «y», las combinaciones imposibles —p. ej.
  **«Sin tipo» + «Tela»** (RF-1602)— son **alcanzables marcando casillas**: la lista queda vacía
  y se muestra la **rama 2** con las marcas **tal cual** (p. ej. «(Tipo: Tela, Sin tipo)»),
  **sin** desmarcar nada. **Evidencia:** `node --test` (prioridad y
  juntado de piezas en lógica) + MCP Chrome forzando cada rama con datos reales (incluida la rama
  defensiva de filtros imposibles, verificada forzando el estado **y restaurándolo** después,
  como en la 015, y la combinación imposible «Sin tipo»+«Tela» alcanzable con el panel) y leyendo
  los literales **tal cual**.
- **RF-1608 — Impresión: cabecera de contexto con los filtros múltiples.** CUANDO se imprima
  —vista previa (017) y su botón «Imprimir», Ctrl+P/menú del navegador y el PDF de escritorio—,
  EL SISTEMA SHALL rellenar **fresco** (al abrir la vista previa y en `beforeprint`) la cabecera
  de contexto con **todas** las piezas activas, uniendo las marcas de cada grupo con «, »:
  p. ej. **`Gestor de Clientes · Filtro: Tela, Espuma · Provincia: Valencia, Castellón ·
  Búsqueda: «vega»`**, con las **piezas vacías omitidas** (grupo sin marcas → sin pieza; sin
  búsqueda → sin pieza) y el **mismo orden de piezas de hoy**: **Filtro · Provincia ·
  Búsqueda**. La marca **«Sin provincia»** SHALL imprimirse **tal cual** dentro de la pieza
  «Provincia» (p. ej. `Provincia: Valencia, Sin provincia`), como cualquier otra provincia.
  `textoContextoImpresion` SHALL aceptar los dos grupos como **listas** de marcas (hoy
  recibe un único tipo y una única provincia); seguirá devolviendo **texto plano sin HTML**
  (pintado con `textContent`, acentos y comillas tal cual). **Solo** ese literal SHALL cambiar de
  las 013/015/017: hoja limpia, guardia de cero visibles, vista previa, barra, PDF y `beforeprint`
  con Ctrl+P sin pasar por la vista previa SHALL quedar **intactos**. **Evidencia:**
  `node --test` (casos: ambos grupos vacíos → piezas omitidas; 1 y N marcas por grupo, incluida
  «Sin provincia» en la pieza Provincia; comillas y acentos; orden Filtro · Provincia ·
  Búsqueda) + MCP Chrome leyendo el literal de
  `#cabecera-impresion` tras abrir la vista previa y tras simular `beforeprint` + checklist manual
  del PDF en `npm start` (abrirlo y leer la cabecera).
- **RF-1609 — Conservación integral: datos, claves y resto de la app.** EL SISTEMA SHALL tratar
  los filtros como **estado de sesión**: filtrar, abrir o cerrar paneles y limpiar **no** SHALL
  crear, modificar ni borrar clientes ni escribir **ninguna** clave (`gestorClientes` y
  `clientes.json` SHALL quedar **byte a byte** intactos y **no** SHALL existir claves nuevas).
  SHALL permanecer **sin cambios**: el buscador (005), el mapa (004), el listado y su selector de
  campos (012), el formulario con sus casillas y el modelo de datos (014/016), los 14 campos del
  esquema (015), exportar e importar (011, incluido su «estado limpio» al importar: **ambos grupos
  sin marcas** y búsqueda vacía — **nota de cambio explícita**: hoy la importación solo **revalida**
  la provincia con el repueblado y una provincia marcada que siga existiendo **sobrevive** a la
  importación; a partir de esta spec, importar deja **ambos grupos sin marcas**, cambio pequeño,
  coherente con el alta—), la guardia de «Imprimir», la vista previa y el PDF (013/017),
  el orden de la lista (más reciente primero), los toasts, el mapa y el diseño retro. **Alta
  (010/015):** CUANDO se guarde un cliente nuevo, EL SISTEMA SHALL dejar **ambos grupos sin
  marcas** y el buscador limpio (equivalente a lo que hoy es volver a «Todos»/«Todas las
  provincias»). **Edición y borrado (002):** CUANDO el usuario cambie de filtro o abra/cierre un
  panel, la edición en curso y la confirmación de borrado en curso **NO** SHALL cancelarse
  (RF-013 intacto). La web SHALL seguir funcionando con **doble clic (`file://`)**, **sin
  dependencias nuevas**, **sin cambiar el orden de los `<script>`** y con el **mismo
  comportamiento en web y escritorio** (011/017). SI cualquiera de estos puntos cambiase,
  ENTONCES esta spec SHALL considerarse **incumplida**. **Evidencia (MCP Chrome + checklist):**
  hash/comparación de `localStorage` y de `clientes.json` **antes y después** de filtrar, abrir y
  cerrar paneles (idénticos); regresiones: alta, edición (persiste tras cambiar filtros),
  borrado con «¿Seguro?», exportar/importar, imprimir y vista previa; app borrada al final para
  dejar arranque vacío; checklist en `npm start`.
- **RF-1610 — Cierre: lógica pura con tests, documentación e instalador.** Toda la lógica nueva
  de filtrado multi SHALL vivir en lógica **pura con tests** (`node --test`), con estos grupos de
  pruebas como mínimo: (a) filtrado de tipo por **lista** de marcas —vacía = todos; «y»
  (intersección) con 1 y con N marcas; multi-tipo que pasa con **todos** los marcados y **no** con
  menos; «Otros» solo y «Otros»∩fijo; «Sin tipo» solo = sin tipos; imposibles «Sin tipo»+fijo y
  «Sin tipo»+«Otros» = lista vacía; cliente sintético `[Tela, Espuma, Estructuras]` que pasa con
  `{Tela, Espuma}` y con `{Tela, Espuma, Estructuras}` y **no** con `{Tela, Estructuras, Otros}`—;
  (b) filtrado de provincia por
  **lista** —vacía = todos; «o»; normalización de acentos/mayúsculas; los sin provincia pasan con
  la lista vacía o con **«Sin provincia» en la lista**, y **no** pasan si hay provincias marcadas
  sin ella—; (c) **validación** de provincias marcadas contra las opciones (desmarcado
  automático, análogo de `provinciaValida`; la casilla fija **«Sin provincia»** nunca se
  desmarca sola); (d) `textoContextoImpresion` con **listas** de
  ambos grupos (piezas omitidas, orden, juntado «, »). Los **141 tests existentes** SHALL
  **adaptarse** donde cambie la entrada (los que hoy pasan **un** tipo o **una** provincia pasarán
  **listas**) y los que no tocan esta lógica (buscador, importación, saneado, fechas, catálogo,
  casillas del formulario…) SHALL quedar **intactos**; al cierre `node --test` SHALL estar **en
  verde** con un total **≥ 141**. La interfaz SHALL verificarse con **MCP Chrome** en web (consola
  limpia, 375 px sin desbordes, teclado) y con **checklist manual** en `npm start`/exe. Al
  cierre, `AGENTS.md` (sección de funcionalidades: barra de filtros) y `MEMORY.md` SHALL
  actualizarse, y el **instalador NSIS SHALL regenerarse** con el cambio dentro
  (`cd escritorio && npm run build`).

## 3. Criterios de aceptación

- **Given** la lista del acta A–I, **when** se marcan «Tela» y «Espuma», **then** solo se ve C
  (los clientes de un solo tipo no salen: A y B caen; I, aunque es multi-tipo, no lleva Tela; H
  es de Estructuras); **when** se desmarca «Espuma», **then** se ven A y C; **when** se marcan
  «Tela» y «Sin tipo»,
  **then** 0 resultados con el estado vacío del RF-1607 **y ninguna** casilla se desmarca sola;
  **when** se desmarca todo, **then** se ven los nueve.
- **Given** tipo {Tela, Espuma} (solo C visible), **when** se marca provincia {Valencia}, **then**
  solo se ve C (tipos en «y» ∩ provincias en «o», en Y); **when** se filtra tipo {Espuma} +
  provincia {CÁDIZ} y se busca «vega» encima, **then** solo se ve I y el contador dice «1
  cliente».
- **Given** grupo provincia, **when** se marca **solo** «Sin provincia», **then** se ven
  **únicamente** los clientes con `provincia` vacía o ausente; **when** se marca además
  «Valencia», **then** se ven los de Valencia **más** los sin provincia; **when** se desmarca
  «Sin provincia» quedando «Valencia» marcada, **then** los sin provincia **desaparecen** de la
  lista y del contador; **when** se desmarca todo, **then** se ve la lista completa.
- **Given** tipo {Tela} (opciones de provincia = {Valencia}), **when** se intenta filtrar por
  Castellón, **then** **no existe** esa opción (las opciones son espejo de los tipos marcados,
  RF-1603) y la lista nunca queda en un filtro imposible.
- **Given** cualquier panel abierto, **when** se marca o desmarca una casilla, **then** la lista,
  el contador y la etiqueta del trigger se actualizan **al instante** y el panel **sigue abierto**.
- **Given** provincia «Castellón» marcada con tipo {Espuma}, **when** se añade «Tela» (quedando
  {Tela, Espuma}, solo C visible), **then** «Castellón» **se desmarca sola** (no está entre las
  nuevas opciones: solo {Valencia})
  y la etiqueta pasa a reflejar lo que queda; la lista nunca muestra un filtro imposible.
- **Given** el trigger «Tipo: Tela, Espuma (2)», **when** se abre el panel y se pulsa «Limpiar»,
  **then** las cinco casillas quedan desmarcadas, la etiqueta pasa a «Tipo: Todos» y la lista
  muestra todo; el panel **no** se cierra.
- **Given** los desplegables en 375 px y 15 provincias, **then** no hay desbordamiento horizontal
  (el panel desplaza dentro de sí), los objetivos táctiles son ≥ 44 px, el foco visible va en la
  casilla entera y todo está **en español**; **when** se cierra con Escape, **then** el foco vuelve
  al trigger (`document.activeElement`) y la posición de scroll de la página **no cambia**.
- **Given** filtros {Espuma} + {CÁDIZ} y búsqueda «vega» (alcanzable con el acta A–I: queda solo
  I), **when** se abre
  la vista previa (o se usa Ctrl+P), **then** la cabecera es literal
  `Gestor de Clientes · Filtro: Espuma · Provincia: CÁDIZ · Búsqueda:
  «vega»` (piezas vacías omitidas, mismo orden de siempre; el juntado «, » de varias marcas por
  pieza lo cubre `node --test` en el RF-1608) y la hoja no contiene ningún panel,
  trigger ni casilla.
- **Given** tipo {Tela, Estructuras} (imposible: ningún cliente del acta tiene ambos tipos),
  **then** el contador es «0
  clientes» y el estado vacío es «No hay clientes con estos filtros (Tipo: Tela, Estructuras).
  Desmarca alguna casilla.»; **given** sin marcas y búsqueda «zzzz», **then** «No hay
  coincidencias para «zzzz». Prueba con otras palabras.»; **given** lista realmente vacía,
  **then** «Aún no hay clientes. Rellena el formulario de arriba para añadir el primero.».
- **Given** la app con datos reales, **when** se filtra, se abren/cierran paneles y se limpia,
  **then** `gestorClientes` y `clientes.json` **no cambian** y no aparece ninguna clave nueva;
  **when** se recarga la página, **then** los filtros vuelven **vacíos** (no se persisten).
- **Given** la app, **when** se da de alta un cliente, **then** ambos grupos quedan sin marcas y
  el buscador limpio (como hoy); **when** se importa un JSON, **then** mismo estado limpio;
  **given** una edición en curso, **when** se cambia el filtro, **then** la edición **sigue**
  activa con sus datos.
- `node --test`: total **≥ 141** en verde, con los tests nuevos de las cuatro áreas del RF-1610 y
  los existentes adaptados a listas; consola del navegador **limpia** en web y escritorio; datos
  de prueba borrados al terminar.

## 4. Casos límite

- **Ninguna casilla marcada en ninguno de los dos grupos**: la lista completa (con o sin búsqueda);
  es el equivalente exacto a la antigua pestaña «Todos» + «Todas las provincias».
- **Los cinco tipos marcados**: con la semántica «y» es una **combinación imposible** («Sin tipo»
  exige no tener tipos y el resto exige tenerlos) → **0 resultados** con el estado vacío del
  RF-1607; **ninguna** casilla se desmarca sola (RF-1605). Ya **no** equivale al filtro vacío:
  eso solo lo es **cero marcas**.
- **Cliente multi-tipo** (`["Tela","Espuma"]`): pasa con {Tela}, con {Espuma} y con {Tela,
  Espuma} (pertenencia de la 014, ahora en «y»); **no** pasa con {Tela, Estructuras} ni con
  ninguna marca que no todos sus tipos cubran; y **nunca** pasa con «Sin tipo» marcado.
- **Cliente sin tipos**: solo pasa con la casilla **«Sin tipo»** marcada **en solitario** o con el
  grupo tipo **vacío** (los sin tipos nunca se esconden del filtro vacío); «Sin tipo» marcada
  junto a **cualquier** otra casilla es **imposible lógico → 0 resultados** (decidido en el
  RF-1602), incluido «Sin tipo» + «Otros».
- **Cliente con fijos y libres** (`["Tela","Toldos"]`): pasa con {Tela}, con {Otros} y con {Tela,
  Otros} (Decisión 7 de la 014 intacta: «Otros» no excluye a quien también tenga fijos; con un
  fijo es **intersección normal**: exige el fijo y además un tipo libre); **no** pasa con {Tela,
  Espuma}.
- **Cliente con tres tipos** (`["Tela","Espuma","Estructuras"]`): pasa con {Tela, Espuma} y con
  {Tela, Espuma, Estructuras}, y **no** pasa con {Tela, Estructuras, Otros} (cada marca debe
  cumplirse; tener «más tipos» que los marcados no basta si falta alguno).
- **Variantes homófonas de provincia** («CÁDIZ», «Cádiz», «cadiz»): **una sola** casilla, con la
  **primera forma guardada**; el filtrado normaliza (igual que la 015).
- **Provincia con texto fuera de las 52 sugeridas** (p. ej. «Gandía», «París»): aparece como
  opción si algún cliente la tiene (Decisión 4); el desplegable **no** es un catálogo cerrado.
- **Cliente sin provincia**: pasa con el grupo provincia **vacío** (sin filtro) o cuando está
  marcada la casilla fija **«Sin provincia»** (sola o junto a provincias reales); **no** pasa si
  hay alguna provincia real marcada y «Sin provincia» está **desmarcada**.
- **«Sin provincia» marcada y ningún cliente sin provincia restante** (se le escribió una
  provincia al último, o los tipos marcados los dejan fuera): la casilla **se queda marcada**
  (es opción fija, RF-1605, Decisión 11) y la lista puede quedar vacía, mostrando el estado vacío
  del RF-1607; **nunca** se desmarca sola.
- **Provincia escrita literalmente «Sin provincia»** (colisión de etiqueta, texto libre del campo):
  hay **dos casillas distintas** en el panel — la provincia normal, listada en su posición
  alfabética con la **primera forma guardada**, que filtra por **coincidencia de texto** con los
  clientes que la tengan escrita, y la casilla **fija** «Sin provincia», **anclada al final**,
  cuya semántica sigue siendo `provincia` vacía o ausente—. El cliente con la provincia escrita
  «Sin provincia» **no** pasa por la casilla fija (su provincia no está vacía), y la validación
  del RF-1605 puede **desmarcar sola** a la opción normal si desaparece de los datos pero
  **nunca** a la fija. Sin clientes con esa provincia escrita, solo existe la fija (como siempre).
- **Cambio de tipos que deja opciones huérfanas**: la provincia marcada que deja de existir entre
  las opciones **se desmarca sola** (RF-1605); si además no queda ningún filtro que pueda dar
  resultados, sale el estado «sin resultados con estos filtros», nunca un panel con marcas sin
  efecto.
- **Último cliente de una provincia marcada se borra o le cambian la provincia**: esa opción
  desaparece del repueblado y la casilla **se desmarca sola**.
- **Alta, edición, borrado e importación**: repueblan las opciones (RF-1605); alta e importación
  dejan **ambos grupos sin marcas** y el buscador limpio (en el alta es el comportamiento actual
  **conservado**; en la importación es un **cambio pequeño** sobre hoy, donde la provincia marcada
  que sigue existiendo **sobrevivía** — RF-1609—); la edición/confirmación en curso **sobrevive**
  a cambios de filtro (RF-013).
- **Etiquetas y paneles largos** (cinco tipos marcados, provincias muy largas, muchas provincias):
  sin desbordamiento a 375 px ni a 1280 px — el trigger **corta** el texto con «…» + `title`
  cuando no cabe (obligatorio, RF-1601) y el panel desplaza dentro de sí; **ningún** elemento de
  la barra amplía el ancho del documento.
- **Panel abierto al imprimir** (botón, Ctrl+P, vista previa o PDF): el panel es chrome y **no
  viaja a la hoja**; la cabecera de contexto describe los filtros con texto (RF-1608).
- **Escape, clic fuera o segundo clic en el trigger con el panel abierto**: cierra el panel
  **devolviendo el foco al trigger** y **sin mover** la posición de scroll de la página; nunca dos
  paneles abiertos a la vez.
- **Búsqueda con acentos, mayúsculas o multi-palabra** combinada con ambos grupos: reglas 005
  intactas (AND de palabras) en Y con los dos grupos.
- **Cero visibles con cualquier combinación**: la guardia del botón «Imprimir» («No hay clientes
  para imprimir», 013/017) sigue intacta y **solo** afecta al botón; Ctrl+P imprime el estado
  vacío sin avisos.
- **Sin conexión a internet**: los filtros son locales; el mapa (004) sigue degradándose solo al
  enlace como siempre.
- **Datos reales del padre del usuario**: filtrar, repueblados y desmarcados automáticos son
  **solo en memoria**: ni `localStorage` ni `clientes.json` se tocan (comparar por hash antes y
  después).

## 5. Fuera de alcance

- **El buscador de texto (spec 005)**: ni su interfaz, ni su semántica, ni sus textos de ayuda
  salvo el literal de «no hay coincidencias» que menciona la ya inexistente pestaña «Todos»
  (RF-1607, derogación acotada).
- **Persistir los filtros entre sesiones** (recuerda entre visitas o al recargar): siguen solo en
  memoria, igual que la vista y la selección de campos (RF-1006).
- **Cambiar el esquema de datos, las claves de almacenamiento o los formatos** de
  `localStorage`/`clientes.json` (ninguna migración, ninguna clave nueva).
- **El mapa (004), el listado y el selector de campos (012), el formulario con sus casillas
  (016→2026-10-20), la ficha, los toasts, la confirmación de borrado y la de importación**: sin
  cambios.
- **La hoja de impresión, la vista previa y el PDF (013/015/017)**: sin cambios **salvo** el
  literal de la cabecera de contexto (RF-1608); la barra de la vista previa, el «Guardar como
  PDF» y la guardia de cero visibles quedan intactos.
- **Añadir más grupos de filtro** (contacto, provincia de otra forma, fechas…) o filtros
  guardados/favoritos.
- **Deshacer/reenumerar acciones de filtro, «seleccionar todo» en los paneles o exportar el
  resultado del filtro a un fichero propio** (exportar sigue siendo la copia completa de la 011).

## 6. Decisiones

1. **Dos desplegables con casillas y pestañas fuera (decisión literal del usuario: «que salgan
   varios desplegables en los que se puedan seleccionar con casillas»).** Es la forma pedida de
   no sobrecargar la barra: dos triggers cortos en lugar de cinco pestañas + un desplegable, con
   toda la capacidad multi dentro. *Alternativas descartadas:* **mantener las pestañas y añadir
   multi-selección** (dos mecanismos para lo mismo, la barra no cabría ni a 375 px), **chips de
   selección múltiple en la barra** (ya se sustituyeron por casillas en el formulario por el mismo
   motivo de sobrecarga) y **una sola casilla por provincia/tipo en línea** (escala mal: 50+
   provincias romperían la vista).
2. **Semántica «y» dentro del grupo tipo, «o» dentro del grupo provincia, y «y» entre grupos
   (enmienda 2026-10-21).** El usuario quiere «ver el filtro exacto»: con «Tela» y «Espuma»
   marcadas quiere **solo** los clientes que tengan **los dos** tipos, no la unión; las
   provincias siguen en «o» porque un cliente **no puede** estar en dos provincias a la vez;
   entre grupos y con la búsqueda, «y». Es la lectura que el usuario confirmó: «(Tela y Espuma) y
   (Valencia o Castellón) y búsqueda». *Alternativas descartadas:* **«o» dentro del grupo tipo**
   (era la semántica original de esta spec, **cambiada el 2026-10-21** a petición suya: mezcla
   tipos distintos cuando pide «filtro exacto») y **«y» entre tipos y provincias con selección
   única** (es exactamente lo que ya existe y no resuelve nada).
3. **Cero marcas = sin filtro; por eso el grupo tipo lleva una casilla «Sin tipo» explícita.** En
   el formulario «nada marcado» ya significa «sin tipo» (RF-1403), pero en un filtro «nada
   marcado» debe significar **sin filtro** (el «Todos» de siempre), o no se podría ver la lista
   completa. Como ambos significados conviven, el filtro necesita una casilla **«Sin tipo»**
   para poder elegir a propósito a los clientes sin tipos. *Alternativas descartadas:*
   **«nada marcado = no se ve nada»** (trampa: la lista quedaría siempre vacía al empezar),
   **casilla «Todos» que desmarca el resto** (ambigua y redundante con «Limpiar») y **no ofrecer
   «Sin tipo»** (imposible ver a los sin tipos sin desmarcar todo lo demás).
4. **Las opciones de provincia son espejo de los datos: cualquier provincia escrita (texto
   libre) aparece si algún cliente la tiene.** El campo `provincia` de la 015 es texto libre
   opcional con sugerencias de 52, y el filtro de la 015 ya operaba sobre las provincias reales
   de los clientes; cerrar el desplegable a un catálogo ocultaría clientes filtrables y rompería
   «mantener lo que ya hay». *Alternativas descartadas:* **catálogo fijo de las 52** (un cliente
   con «Gandía» quedaría inalcanzable por el filtro), **añadir provincias manualmente al filtro**
   (no tiene sentido: el filtro no crea datos) y **ignorar las provincias «raras»** (pérdida
   silenciosa de clientes).
5. **Las opciones de provincia se calculan sobre los tipos marcados (análogo del RF-1305) y una
   marca que deja de existir se desmarca sola.** Es la regla vigente de la 015 —el usuario la
   conoce y no la ha cuestionado— y la pidió explícitamente el encargo (RF-1605): las opciones
   responden a «qué puedes ver ahora». Además, al estar escopadas, cada provincia listada tiene
   garantizado al menos un cliente con los tipos marcados: la combinación tipo+provincia **no**
   puede quedar en un «sin resultados» inesperado (salvo las combinaciones imposibles de tipos
   del RF-1602 —p. ej. «Sin tipo» + «Tela»—, que se resuelven con el estado vacío del RF-1607).
   *Alternativas descartadas:* **lista global con
   todas las provincias de la app** (dejaría opciones que con los tipos marcados no pueden verse
   y obligaría a descubrir el «sin resultados con estos filtros» a ciegas, además de romper el
   análogo del RF-1305 pedido) y **no validar las marcas** (marcas sin efecto visible, el
   «filtro imposible» que la 015 ya evitaba).
6. **«Limpiar» dentro de cada panel, no un marco «Todas/Todos».** «Limpiar» dice exactamente lo
   que hace (desmarcar todo = sin filtro) y no se confunde con «marcar todas». *Alternativas
   descartadas:* **casilla «Todas/Todos» arriba del panel** (se lee como «marcar todo» cuando su
   efecto es lo contrario: desmarcar), **botón «Limpiar» en la barra** (dos grupos requieren dos
   limpiezas independientes; en la barra ocuparía el sitio de los triggers).
7. **Etiqueta del trigger con el listado de marcas y su recuento («Tipo: Tela, Espuma (2)»).**
   Es lo pedido («una etiqueta que muestre el estado») y evita tener que abrir el panel para
   saber qué hay filtrado; con cero marcas muestra **«Tipo: Todos»** (el mismo concepto que la
   pestaña «Todos» de hoy; el de provincia mantiene «Provincia: Todas», con el «Todas las
   provincias» de hoy). *Descartadas:* **solo el número («Tipo: 2»)** (no dice qué),
   **mostrar todas las marcas sin límite** (a 375 px desbordaría; cuando el texto no quepa se
   **corta** con «…» + `title`, **obligatorio** y coherente con los badges y las celdas del
   listado — RF-1601—).
8. **La cabecera de impresión se adapta EN la misma función de siempre, con listas y el mismo
   orden de piezas (Filtro · Provincia · Búsqueda).** Mantener la función y su orden es «mantener
   en la medida de lo posible lo que ya hay» y evita dos fuentes de verdad para la cabecera — el
   fantasma de la divergencia vista previa/papel que la 017 (Decisión 2) conjuró. *Descartadas:*
   **función nueva paralela para la cabecera multi** (doble mantenimiento y riesgo de divergencia)
   y **cambiar el orden de las piezas** (roto sin motivo; los lectores ya conocen el literal).
9. **Los estados vacíos ganan literales nuevos que nombran lo activo; los viejos que nombraban
   pestañas mueren con ellas.** Decir «(Tipo: Tela · Provincia: Valencia)» y «desmarca alguna
   casilla» le da al usuario la salida exacta; conservar textos que mandan a «la pestaña
   «Todos»» sería mentir (esa pestaña ya no existe). *Descartados:* **mensaje único genérico
   («No hay resultados»)** (no dice nada útil para salir del atasco) y **mantener los literales
   viejos literalmente** (mencionan pestañas inexistentes).
10. **Tests: los mismos 141 se adaptan a las listas; la interfaz se verifica en navegador.**
    Mismo criterio de todas las specs del proyecto: lógica pura en `logica.js` con `node --test`,
    capa DOM con MCP Chrome y checklist manual. *Descartados:* **dejar las firmas antiguas de un
    solo valor y crear funciones paralelas** (dos rutas de filtrado que divergirían) y **tests de
    interfaz con framework** (dependencias prohibidas).

11. **Casilla fija «Sin provincia» dentro del grupo provincia (decisión del usuario,
    2026-10-21).** El usuario ha confirmado que **sí** la quiere (análoga a «Sin tipo»): poder
    ver **a propósito** a los clientes sin provincia escrita (p. ej. los datos antiguos) sin
    tener que desmarcar todo lo demás. Al ser una opción **fija**, no depende de los datos ni
    del grupo tipo: está **siempre** al final del panel y **nunca** se desmarca sola por
    repueblado; si con ella marcada **ya no queda ningún cliente sin provincia**, **se queda
    marcada sin más** y, si el resultado queda vacío, sale el estado vacío del RF-1607 (un
    filtro que se edita a espaldas del usuario sería peor que un «sin resultados» honesto).
    *Alternativas descartadas:* **no incluirla** (los sin provincia serían invisibles a propósito
    salvo vaciando el grupo entero: era justo lo que el usuario pide evitar), **tratar la
    provincia vacía como una provincia real más del espejo** (no hay texto que mostrar ni que
    normalizar, y la opción se iría con los tipos escopados, perdiendo la garantía de verla
    siempre) y **desmarcarla sola cuando no queden sin-provincia** (inconsistente con su
    carácter de opción fija análoga a «Sin tipo»: allí tampoco se desmarca).

12. **Cambio de semántica del grupo tipo: «o» → «y» (petición explícita del usuario,
    2026-10-21; historial de la enmienda).** Tras aprobar la spec, el usuario pidió: *«Cuando
    filtre, quiero poder ver el filtro exacto: si filtro tela solo tela, si filtro espuma solo
    espuma, si filtro TELA + ESPUMA quiero ver solo los clientes de TELA + ESPUMA, no los
    clientes de tela y los clientes de espuma, y los clientes de ambas cosas a la vez»*. Al
    preguntarle la semántica, **respondió: tipos en «y» (intersección), provincias en «o»
    (unión)**, confirmando la lectura: *«Tela+Espuma → solo clientes con LOS DOS tipos (los de un
    solo tipo no salen); Varias provincias → cualquiera de las elegidas (imposible estar en dos);
    Entre grupos se mantiene la «y»: (Tela y Espuma) y (Valencia o Castellón) y búsqueda»*. El
    usuario llegó a proponer añadir opciones literales de combinación («Tela + Espuma», «Tela +
    Estructuras»…) y **decidió al final: «Casillas en «y»»** — el desplegable se queda con las
    mismas cinco casillas, ahora en intersección; marcar tres = combinación triple. Las
    provincias se quedan en «o». *Alternativas descartadas por el usuario:* **lista literal de
    combinaciones** (crece con cada combinación posible y obliga a mantenerla al añadir tipos) y
    **apartado de «combinaciones rápidas»** (redundante con las propias casillas en «y»).
    *Consecuencias decididas en esta enmienda:* «Sin tipo» + cualquier otra casilla = 0
    resultados (RF-1602), los cinco tipos marcados ya **no** equivalen al filtro vacío, y las
    opciones de provincia espejo se estrechan con la intersección (RF-1603/1605 con sus reglas
    intactas).

**Dudas abiertas:** ninguna.

*(Resolución 2026-10-21: el usuario ha confirmado que quiere la casilla **«Sin provincia»** en el
desplegable de provincia —análoga a «Sin tipo»— para ver a propósito a los clientes sin provincia
escrita. Incorporada al RF-1603, RF-1604, RF-1605, RF-1608 y RF-1610, a la HU-7, a los criterios
de aceptación y a los casos límite, y documentada en la Decisión 11.)*

*(Resolución 2026-10-21 (tarde): a petición del usuario, la semántica del **grupo tipo** pasa de
«o» a **«y» (intersección)** —cita verbatim en «Contexto y objetivo» y en la Decisión 12—; las
provincias siguen en «o» y la combinación entre grupos y con la búsqueda sigue en «y». El
usuario descartó su propuesta intermedia de lista literal de combinaciones: la decisión final
fue **«Casillas en «y»»**. Actualizados RF-1602 (semántica e imposibles), RF-1603 (solo
evidencia), RF-1604, RF-1605 (evidencia), RF-1607 (imposibles alcanzables), RF-1610 (área (a)),
HU-1/HU-2, criterios de aceptación, casos límite y decisiones 2, 5 y 12; dataset canónico A–I
fijado en las definiciones. El cambio está **propuesto** sobre la spec ya aprobada (2026-10-21):
pendiente de aprobación de este diff y de su reflejo posterior en `plan.md` y `tasks.md`.)*
