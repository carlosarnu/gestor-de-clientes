# Spec 008 — Tipo «Otros» con texto libre y su filtro

| Campo | Valor |
|---|---|
| **ID** | `008-otros` |
| **Título** | Nueva opción «Otros» en Tipo de cliente (con campo para escribir el tipo) y pestaña de filtro «Otros» |
| **Estado** | **Aprobada** (pedido directo del usuario, 2026-10-14) |
| **Fecha** | 2026-10-14 |

---

## 1. Contexto y objetivo

Hoy el desplegable «Tipo de cliente» solo admite Tela / Espuma / Estructuras, y el
cliente puede no tener tipo («Sin tipo», spec 007). El usuario pide una **cuarta opción
«Otros»**: al elegirla aparece un campo para **escribir** el tipo («Toldos», «Cortinas»…),
y además esa opción debe existir en el **filtro** de la lista.

**Objetivo:** tipos personalizados sin cambiar el esquema (`tipo` pasa a ser un texto
libre dentro de un conjunto de valores conocidos), con su pestaña y su color.

## 2. Requisitos funcionales (EARS)

- **RF-601** — El desplegable «Tipo de cliente» SHALL incluir la opción **«Otros»**
  además de Tela / Espuma / Estructuras.
- **RF-602** — CUANDO se seleccione «Otros», EL SISTEMA SHALL mostrar un campo de texto
  «Escribe el tipo de cliente»; y SHALL guardar como `tipo` ese texto tal cual (espacios
  recortados), o **«Otros»** si el campo queda vacío.
- **RF-603** — La lista SHALL incluir la pestaña de filtro **«Otros»**: mostrará los
  clientes cuyo `tipo` **no** esté entre Tela/Espuma/Estructuras **y** no esté vacío (los
  «Sin tipo» siguen apareciendo solo en «Todos», RF-504).
- **RF-604** — Los clientes con tipo «Otros»/personalizado SHALL mostrar la etiqueta y la
  espina de color **violeta** (nuevo material) en la ficha, con la etiqueta = el texto
  escrito (o «Otros»).
- **RF-605** — Al editar un cliente con tipo personalizado, el desplegable SHALL mostrar
  «Otros» con el texto cargado en el campo; los tres tipos fijos y el vacío se cargan
  igual que antes.
- **RF-606** — El buscador SHALL encontrar por el tipo escrito; y se SHALL conservar la
  compatibilidad: clientes existentes no cambian (mismo `tipo` guardado, sin migración).

## 3. Criterios de aceptación

- **Given** el formulario, **when** se elige «Otros» y se guarda con texto «Toldos»,
  **then** la ficha muestra la etiqueta «Toldos» en violeta y la pestaña «Otros» la lista.
- **Given** «Otros» sin escribir nada, **when** se guarda, **then** `tipo = "Otros"`.
- **Given** un cliente sin tipo, **when** se filtra «Otros», **then** NO aparece (solo en
  «Todos»).
- **Given** un cliente «Cortinas», **when** se edita, **then** el desplegable está en
  «Otros» y el campo muestra «Cortinas».
- **Given** clientes Tela/Espuma/Estructuras, **when** se filtra «Otros», **then** no
  aparecen; y al revés.
- **Given** `node --test` y el navegador, **then** todo verde, móvil 375 sin desbordes y
  consola limpia.

## 4. Casos límite

- «Otros» + texto = uno de los tres fijos escrito a mano (p. ej. «Tela»): se guarda tal
  cual y **se comporta como el tipo fijo** — aparece en la pestaña Tela y con su color, y
  queda fuera de «Otros». (Texto corregido el 2026-10-14 en la spec 009: el original
  decía lo contrario de lo que hace el código.)
- Texto solo con espacios → se recorta; vacío → «Otros».
- Editar tras borrar el texto de «Otros» → vuelve a «Otros».

## 5. Fuera de alcance

- Renombrar/borrar tipos guardados, colores por tipo personalizado (comparten violeta),
  migraciones de datos.

## 6. Decisiones

1. **El tipo personalizado se guarda en el propio `tipo`** (texto libre): cero cambios de
   esquema y el buscador/exportación funcionan sin tocar nada.
2. **«Otros» en el filtro excluye los «Sin tipo»** (siguen solo en «Todos», RF-504).
3. Nuevo material **violeta** (`--otros: #6b4f8a`) para filtro activo, espina y etiqueta
   de todos los tipos no fijos.
4. El campo de texto lleva `maxlength="40"` y aparece justo debajo del desplegable.
