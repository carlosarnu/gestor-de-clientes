# Spec 007 — Formulario sin campos obligatorios, «Móvil» y «Código postal» + acceso robusto

| Campo | Valor |
|---|---|
| **ID** | `007-campos-libres` |
| **Título** | Nada obligatorio en el formulario, campos nuevos de móvil/código postal y acceso que funciona en cualquier navegador |
| **Estado** | **Aprobada** (decisiones del usuario tomadas el 2026-10-13) |
| **Fecha** | 2026-10-13 |

---

## 1. Contexto y objetivo

El padre del usuario pide dos cambios y el usuario reporta un fallo:

1. **Nada de campos obligatorios**: «que rellene lo que él considere».
2. **Campos nuevos**: además de *Teléfono*, añadir **Móvil**; y añadir **Código postal**.
3. **Fallo de acceso**: el usuario no puede entrar — la pantalla de clave «no funciona».
   La única dependencia ambiental del login era `crypto.subtle` (WebCrypto): si el
   navegador no lo expone en ese contexto, el manejador asíncrono fallaba **en silencio**
   y no ocurría nada visible al pulsar «Entrar».

**Objetivo:** formulario 100 % opcional con los dos campos nuevos por todas partes
(formulario, ficha, buscador, exportar/importar, mapa), y un acceso con clave sin
dependencias del navegador que además **nunca falla en silencio**.

## 2. Usuarios

- **Usuario (comercial)**: el padre; rellena lo que le convenga, aunque nada.
- **Administrador**: el dueño del proyecto (mismos permisos que en spec 006).

## 3. Historias de usuario

- **HU-1.** Como comercial, quiero guardar un cliente rellenando solo lo que me
  interese, para no bloquearme con campos que no tengo a mano.
- **HU-2.** Como comercial, quiero apuntar el móvil y el código postal de un cliente,
  para localizarlo mejor y que el mapa acierte.
- **HU-3.** Como usuario, quiero entrar con mi clave en cualquier navegador, para no
  quedarme delante de la pantalla sin poder usar la app.

## 4. Requisitos funcionales (EARS)

- **RF-501** — Ningún campo del formulario de cliente SHALL ser obligatorio: el sistema
  SHALL permitir guardar con cualquier combinación de campos, incluidos todos vacíos.
- **RF-502** — El formulario, la ficha, el buscador y la exportación/importación SHALL
  incluir los campos **«Móvil»** y **«Código postal»** (opcionales). SU AUSENCIA en
  datos antiguos SHALL mostrarse como vacío, sin errores ni pérdida de datos.
- **RF-503** — CUANDO el cliente tenga dirección y/o código postal, EL SISTEMA SHALL
  mostrar el mapa con ambos; SI solo hay código postal, ENTONCES SHALL mostrar igual.
- **RF-504** — SI el tipo queda vacío, ENTONCES la ficha SHALL mostrar la etiqueta
  «Sin tipo» y el cliente SHALL aparecer únicamente en la pestaña «Todos».
- **RF-505** — SI la empresa queda vacía, ENTONCES la ficha SHALL mostrar «Sin nombre».
- **RF-506** — El acceso con clave SHALL usar una implementación de **SHA-256 en JavaScript
  puro** (sin `crypto.subtle` ni WebCrypto) con resultados **idénticos** a los hashes ya
  guardados (compatibilidad con claves existentes); y cualquier error inesperado SHALL
  mostrarse en la pantalla de acceso — **nunca en silencio**.
- **RF-507** — El esquema de `gestorClientes` SHALL conservar `id`/`fecha` y añadir
  `movil` y `codigoPostal`; los archivos exportados previos SHALL seguir importándose
  (los campos nuevos quedan vacíos).

## 5. Criterios de aceptación

- **Given** el formulario vacío, **when** se pulsa «Guardar cliente», **then** se crea
  un cliente con la ficha «Sin nombre» y etiqueta «Sin tipo».
- **Given** un cliente con solo móvil o solo código postal, **when** se guarda, **then**
  la ficha muestra esos datos y el buscador los encuentra.
- **Given** dirección + código postal, **when** se pinta la ficha, **then** el mapa
  localiza con ambos (y solo con CP también).
- **Given** datos antiguos sin `movil`/`codigoPostal`, **when** se abren, **then** todo
  funciona y esos huecos aparecen vacíos.
- **Given** un navegador sin WebCrypto, **when** se introduce la clave correcta, **then**
  se entra; si falla algo inesperado, **then** se ve un mensaje (jamás pantalla muda).
- **Given** la app, **when** se ejecuta `node --test`, **then** todo verde y la consola
  del navegador limpia.

## 6. Casos límite

- Guardar con **todo vacío**: permitido («Sin nombre»/«Sin tipo»); es lo pedido.
- Importar un item **sin empresa pero con otro dato** (p. ej. solo `tipo` o `movil`):
  ahora es **válido**. Un item sin **ningún** campo propio → se filtra; 0 válidos → error.
- Archivos exportados antes de esta spec → se importan; campos nuevos = "".
- Tipo vacío: el cliente no sale en ninguna pestaña de tipo, solo en «Todos».
- Email con texto que no sea formato de correo: el navegador lo señala (validación de
  formato, no de obligatoriedad) — se mantiene.

## 7. Fuera de alcance

- Validar formato de teléfonos/códigos postales, recuperación de claves, backend.

## 8. Decisiones

1. **Nada obligatorio** literalmente: hasta un cliente vacío se guarda (no se inventa
   validación oculta que contradiga el pedido).
2. **Móvil** va junto a Teléfono y **Código postal** junto a Dirección (el mapa los usa).
3. El **SHA-256 puro** sustituye a `crypto.subtle`: mismos hashes (los ya guardados
   siguen valiendo), sin dependencias y con errores visibles.
4. `nombreTipo("")` pasa a devolver «Sin tipo» y la empresa vacía se muestra «Sin nombre».
