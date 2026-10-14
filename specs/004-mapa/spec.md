# Spec 004 — Mapa de Google Maps para la dirección

| Campo | Valor |
|---|---|
| **ID** | `004-mapa` |
| **Título** | Cuadro de Google Maps con la ubicación del cliente |
| **Estado** | **Aprobada** (preguntas de clarificación resueltas el 2026-10-13) |
| **Fecha** | 2026-10-13 |

---

## 1. Contexto y objetivo

El comercial introduce la **dirección física** de cada cliente y quiere ver de un vistazo **dónde está**
sin salir de la aplicación. La petición del usuario es: *«cuando introduzcamos la dirección física,
quiero que ponga un cuadro de Google Maps que muestre una imagen de mapas con su ubicación»*.

**Objetivo:** mostrar un mapa embebido de Google Maps de la ubicación del cliente cuando tiene dirección,
sin romper la portabilidad `file://` de la app ni la spec 002 (edición/borrado).

**Restricción heredada de la constitución:** la app no puede depender de librerías externas; el mapa es
un servicio de terceros que requiere internet, por lo que la spec obliga a **degradación elegante**
(si no hay conexión o Google no carga, la app sigue funcionando y se ofrece un enlace alternativo).

## 2. Requisitos funcionales (EARS)

- **RF-201** — Dado que un cliente tiene `direccion` no vacía, cuando se muestra su tarjeta en la lista,
  el sistema SHALL mostrar un cuadro con el mapa de esa ubicación (iframe de Google Maps en modo embed,
  sin API key), junto al resto de sus datos.
- **RF-202** — Dado que la `direccion` del cliente está vacía o es solo espacios, cuando se muestra su
  tarjeta, el sistema SHALL **no** mostrar ningún cuadro de mapa (sin huecos en blanco).
- **RF-203** — Si el mapa no puede cargarse (sin conexión, Google bloqueado o falla), el sistema SHALL
  degradar el cuadro a un enlace «Ver en Google Maps» (`target="_blank" rel="noopener"`) hacia la
  dirección, y la tarjeta y la app SHALL seguir funcionando con la consola sin errores.
- **RF-204** — El iframe del mapa SHALL llevar atributo `title` descriptivo (p. ej. «Mapa de <dirección>»)
  y `loading="lazy"` para no penalizar el rendimiento de la lista.
- **RF-205** — El cuadro de mapa SHALL responder al rediseño responsive (móvil 375 px sin desbordamiento,
  alto razonable, bordes y colores de la paleta de materiales).
- **RF-206** — Al editar y guardar la dirección de un cliente (spec 002), el mapa de su tarjeta SHALL
  actualizarse; si se vacía la dirección, el cuadro SHALL desaparecer.
- **RF-207** — El cambio SHALL ser solo de presentación: ni el formulario, ni `localStorage`
  (clave `gestorClientes`, 10 campos), ni la lógica de `../../logica.js` se alteran; la app seguirá
  abriéndose con doble clic (`file://`).

## 3. Criterios de aceptación

- **Given** un cliente con dirección «Calle Mayor 12», **when** se recarga la lista, **then** su tarjeta
  muestra un mapa embebido de esa ubicación y la consola no tiene errores.
- **Given** un cliente sin dirección, **when** se mira su tarjeta, **then** no hay cuadro de mapa.
- **Given** el equipo sin conexión a internet, **when** se abre la app con doble clic, **then** la lista,
  los filtros, la edición y el borrado siguen funcionando y el cuadro de mapa se sustituye por el enlace
  «Ver en Google Maps».
- **Given** un cliente en edición, **when** se cambia la dirección y se guarda, **then** el mapa nuevo
  aparece en la tarjeta; si se borra la dirección, el cuadro desaparece.
- **Given** la app en móvil a 375 px, **when** se despliega la lista, **then** no hay desbordamiento
  horizontal y los objetivos táctiles siguen midiendo 44 px.

## 4. Fuera de alcance

- Clave de API de Google Static Maps (facturación): descartado en favor del iframe sin clave (ver 5).
- Geolocalización del usuario, rutas, marcadores múltiples o distancias.
- Mostrar el mapa en el formulario de edición: descartado, solo en la tarjeta (ver 5).

## 5. Decisiones (aprobadas por el usuario el 2026-10-13)

1. **Técnica del mapa:** iframe `https://www.google.com/maps?q=<dirección>&output=embed`
   (gratuito, sin API key). Se descarta Static Maps (requiere clave con facturación) y se conserva
   OpenStreetMap como alternativa si algún día se quiere prescindir de Google.
2. **Dónde se muestra:** en la tarjeta de la lista, solo cuando hay dirección (RF-201/RF-202).
3. **Sin internet:** enlace «Ver en Google Maps» (`target="_blank" rel="noopener"`) (RF-203).
4. **Privacidad:** el usuario está conforme con que Google reciba la dirección al cargar cada tarjeta.
