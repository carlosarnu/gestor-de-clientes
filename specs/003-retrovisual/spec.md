# Spec 003 — Rediseño visual (retroactiva)

| Campo | Valor |
|---|---|
| **ID** | `003-retrovisual` |
| **Título** | Rediseño visual de la interfaz con identidad de materiales |
| **Estado** | Aprobada retroactivamente (petición directa del usuario, 2026-10-12; documentada el 2026-10-13) |
| **Fecha** | 2026-10-12 |

---

## 1. Contexto y objetivo

El usuario pidió explícitamente: «con lo que sabes, mejora el diseño de la web». El cambio se
implementó directamente (solo presentación, cero cambio funcional o de datos) y esta spec queda como
registro para cumplir la regla 2 de la constitución.

**Objetivo:** dar a la interfaz una identidad visual propia del mundo del comercial de materiales
(tela, foam, estructuras) sin romper nada de la funcionalidad existente.

## 2. Requisitos funcionales (EARS)

- **RF-101** — El sistema SHALL usar una paleta derivada de los tres materiales: índigo (Tela),
  mostacia (FOAM) y acero (Estructuras) sobre fondo gris-verdoso, sin el azul genérico de la v1.
- **RF-102** — Cada tarjeta de cliente SHALL llevar un canto izquierdo del color de su material, de
  modo que la lista se pueda escanear por material de un vistazo.
- **RF-103** — La cabecera SHALL mostrar una cinta tricolor (índigo/mostacia/acero) como marca de
  la tira de muestras.
- **RF-104** — Las pestañas de filtro activas SHALL tomar el color de su material («Todos» en tinta).
- **RF-105** — Las acciones principales SHALL usar fondo de tinta oscura; la interfaz SHALL prescindir
  de sombras de tarjeta, usando líneas de 1px.
- **RF-106** — La interfaz SHALL mantener: foco visible con teclado, respeto de
  `prefers-reduced-motion`, `lang="es"`, textos de lista vacía accionables y objetivos táctiles de
  al menos 44 px de alto.
- **RF-107** — El rediseño NO SHALL alterar el HTML semántico, el `localStorage`, ni ninguna
  funcionalidad de la spec 002 (verificación obligatoria tras el cambio).

## 3. Criterios de aceptación

- **Given** la lista con clientes de los tres tipos, **when** se mira en móvil y escritorio, **then**
  cada tarjeta muestra su canto de color, la cabecera su cinta y no hay sombras.
- **Given** la app funcional, **when** se repiten los flujos de alta, edición, borrado y filtros,
  **then** todo sigue funcionando con la consola limpia (RF-107).

## 4. Fuera de alcance

- Cambios de funcionalidad, de datos o de estructura de archivos.
- Fuentes web externas (prohibidas por la constitución): la tipografía se trabaja con la familia del
  sistema (pesos 700/800 y tracking cerrado).

## 5. Decisiones

- Paleta: fondo `#eef0ea`, tinta `#1d241f`, tela `#33548c`, foam `#8a6210`, estructuras `#525f68`,
  peligro `#9b2c2c`.
- Sin degradados decorativos: el único "efecto" es la cinta tricolor funcional (RF-103).
