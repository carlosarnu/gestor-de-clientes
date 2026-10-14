# Spec 005 — Buscador de texto y etiqueta «Espuma»

| Campo | Valor |
|---|---|
| **ID** | `005-buscador` |
| **Título** | Buscar clientes por palabras y renombrar FOAM como Espuma en la interfaz |
| **Estado** | **Aprobada** (petición directa del usuario, 2026-10-13) |
| **Fecha** | 2026-10-13 |

---

## 1. Contexto y objetivo

El usuario pidió dos mejoras en la lista: *«cambia la palabra foam por espuma»* (en el filtro) y
*«quiero que añadas un buscador por texto, que pueda buscar el cliente con palabras»*.

**Objetivo:** que el comercial encuentre un cliente escribiendo palabras (empresa, contacto, CIF…)
y que la interfaz hable su idioma («Espuma» en lugar de la sigla «FOAM»), **sin tocar los datos
guardados**.

## 2. Requisitos funcionales (EARS)

- **RF-301** — El sistema SHALL mostrar **«Espuma»** en lugar de «FOAM» en toda la interfaz
  (pestaña de filtro, etiqueta/badge de la tarjeta, opción del desplegable del formulario y
  subtítulo de la cabecera), conservando el valor guardado `"FOAM"` en `localStorage`
  (**sin migración de datos**: los clientes existentes siguen siendo válidos y filtrables).
- **RF-302** — El sistema SHALL mostrar un campo de búsqueda de texto en el panel de la lista que
  filtre **en tiempo real** (al escribir, sin botón) sobre todos los textos del cliente:
  empresa, CIF, contacto, teléfono, correo, dirección, notas y tipo.
- **RF-303** — La búsqueda SHALL ignorar mayúsculas/acentos («constitucion» encuentra
  «Constitución») y SHALL funcionar con varias palabras: **todas** las palabras deben aparecer
  (repartidas entre los campos del cliente).
- **RF-304** — La búsqueda SHALL combinarse en «y» con el filtro de tipo activo; cambiar de
  filtro, editar o borrar clientes NO SHALL borrar la búsqueda escrita.
- **RF-305** — El contador SHALL refleja el número de coincidencias; si no hay coincidencias, el
  sistema SHALL mostrar un mensaje que incluya la consulta (p. ej. «No hay coincidencias para
  «nuria»…»), distinto del mensaje de lista vacía.
- **RF-306** — El campo SHALL ser accesible (label asociado, `type="search"`) y responsive:
  a 375 px ocupa el ancho del panel sin desbordamiento, con objetivo táctil ≥ 44 px.
- **RF-307** — El cambio SHALL ser solo de presentación + lógica de consulta: ni el formulario, ni
  el esquema de `localStorage`, ni la edición/borrado (spec 002) ni el mapa (spec 004) se alteran.

## 3. Criterios de aceptación

- **Given** la lista con «Asientos Vega» (FOAM), **when** se mira el filtro y su tarjeta,
  **then** dicen «Espuma» y el desplegable del formulario también; al guardar, el dato guardado
  sigue siendo `"FOAM"` y el filtro «Espuma» lo sigue encontrando.
- **Given** varios clientes, **when** se escribe «textiles» en el buscador,
  **then** solo quedan los que coinciden y el contador lo refleja.
- **Given** la búsqueda «nuria mad», **when** se evalúa, **then** solo coinciden los clientes en
  los que aparecen las dos palabras (una en un campo y otra en otro, p. ej. contacto «Nuria» y
  dirección en «Madrid»).
- **Given** la búsqueda «constitucion», **when** se evalúa sobre «Avenida de la Constitución 4»,
  **then** hay coincidencia (sin acentos).
- **Given** una búsqueda activa, **when** se cambia de pestaña de filtro o se edita/borra un
  cliente, **then** la búsqueda se conserva y los resultados siguen siendo el «y» de ambos.
- **Given** búsquedas sin resultados, **when** se mira la lista, **then** aparece el mensaje con la
  consulta y no el de «Aún no hay clientes».
- **Given** la app en móvil a 375 px, **when** se usa el buscador, **then** no hay desbordamiento
  y `node --test` sigue en verde.

## 4. Fuera de alcance

- Búsqueda por rangos (fechas), por proximidad o con resaltado de coincidencias.
- Renombrar el valor interno `FOAM` (decisión 1: se conserva por compatibilidad).

## 5. Decisiones

1. **El valor guardado sigue siendo `"FOAM"`**; solo cambia lo que se muestra (función pura
   `nombreTipo`). Cero riesgo para los datos existentes y para los filtros de la spec 002.
2. **Búsqueda «y» multi-palabra** en todos los campos (más potente que «o» para uso concreto).
3. **Normalización** con minúsculas + NFD sin diacríticos (sin librerías, JS puro).
4. La búsqueda es **estado independiente** del filtro: sobrevive a cambios de pestaña y ediciones.
