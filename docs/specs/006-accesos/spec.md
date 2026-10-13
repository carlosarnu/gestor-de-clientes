# Spec 006 — Acceso con clave y permisos (usuario / administrador)

| Campo | Valor |
|---|---|
| **ID** | `006-accesos` |
| **Título** | Pantalla de acceso con dos perfiles: usuario (comercial) y administrador |
| **Estado** | **Aprobada** (decisiones del usuario tomadas el 2026-10-13) |
| **Fecha** | 2026-10-13 |

---

## 1. Contexto y objetivo

El usuario quiere que solo dos personas accedan a la app: **el comercial** (añade y edita
clientes) y **él mismo como administrador** (gestiona el mantenimiento). Cada uno usará la
app en su **propio equipo** (sin servidor), y la seguridad aceptada es **disuasoria**.

**Objetivo:** pantalla de acceso con clave y dos perfiles con permisos distintos, más
exportación/importación para mover datos entre equipos — sin romper el modelo estático
(`file://`, offline, `localStorage`).

## 2. Usuarios

- **Usuario (comercial)**: el padre; cliente a diario en su equipo.
- **Administrador**: el dueño del proyecto; añade/edita además de administrar.

## 3. Historias de usuario

- **HU-1.** Como comercial, quiero abrir la app con mi clave para registrar clientes sin
  que nadie más toque mi lista.
- **HU-2.** Como administrador, quiero una clave propia para acceder a las herramientas de
  mantenimiento (borrar, exportar, importar y cambiar claves).
- **HU-3.** Como administrador, quiero exportar los clientes a un archivo para llevarlos a
  mi equipo o hacer una copia de seguridad.
- **HU-4.** Como administrador, quiero importar un archivo de clientes para restaurar o
  llevar los datos a un equipo nuevo.
- **HU-5.** Como administrador, quiero cambiar las claves por defecto para que no las
  conozca nadie más.

## 4. Requisitos funcionales (EARS)

- **RF-401** — CUANDO se abra la aplicación sin sesión iniciada, EL SISTEMA SHALL mostrar
  únicamente la pantalla de acceso y SHALL impedir el uso del resto de la app.
- **RF-402** — CUANDO se introduzca una clave, EL SISTEMA SHALL iniciar sesión como
  «usuario» o «administrador» según la clave; SI es incorrecta, ENTONCES SHALL mostrar un
  mensaje de error y NO SHALL iniciar sesión.
- **RF-403** — MIENTRAS haya sesión iniciada, EL SISTEMA SHALL ocultar las acciones no
  permitidas: el usuario NO SHALL ver «borrar», «exportar» ni «importar»; el
  administrador SHALL ver todas.
- **RF-404** — Las claves SHALL guardarse únicamente como hash **SHA-256 en hexadecimal**
  (nunca en claro, ni en el código ni en `localStorage`); el administrador SHALL poder
  cambiar ambas claves desde la app.
- **RF-405** — La sesión SHALL vivir en `sessionStorage`; SI el usuario marca «mantener
  sesión iniciada», ENTONCES SHALL persistirse en `localStorage`; el botón «Salir» SHALL
  cerrar la sesión y volver a la pantalla de acceso.
- **RF-406** — CUANDO el administrador pulsa «Exportar», EL SISTEMA SHALL descargar un
  archivo JSON con todos los clientes llamado `clientes-AAAA-MM-DD.json` (fecha **local**
  del equipo, p. ej. `clientes-2026-10-13.json`).
- **RF-407** — CUANDO el administrador elige un archivo para importar, EL SISTEMA SHALL
  validarlo; SI es válido SHALL pedir confirmación mostrando los contadores y, al
  confirmar, reemplazar los clientes actuales; SI no lo es, SHALL mostrar un error sin
  modificar ningún dato.
- **RF-408** — El cambio SHALL conservar la clave `gestorClientes` y su esquema intactos
  (compatibilidad hacia atrás) y la app SHALL seguir funcionando con doble clic
  (`file://`), offline y a 375 px.
- **RF-409** — La pantalla de acceso SHALL indicar que la protección es disuasoria (sin
  servidor) y mostrar «¿Sin clave? Pide al administrador».

## 5. Criterios de aceptación

- **Given** la app cerrada, **when** se abre, **then** solo se ve la pantalla de acceso y
  la lista no es usable (ni visible detrás).
- **Given** la clave de usuario, **when** se introduce, **then** entro como usuario: hay
  alta/edición/buscador/filtros pero **no** hay borrar, exportar ni importar.
- **Given** la clave de administrador, **when** se introduce, **then** hay todo lo anterior
  más el panel «Herramientas» con exportar, importar y cambiar claves, y las tarjetas
  muestran el botón de borrar.
- **Given** una clave incorrecta, **when** se envía, **then** aparece el error y no se abre
  nada.
- **Given** sesión iniciada, **when** se pulsa «Salir», **then** vuelve a pedir clave.
- **Given** el administrador, **when** exporta, **then** se descarga
  `clientes-AAAA-MM-DD.json` con todos los clientes.
- **Given** un archivo válido exportado previamente, **when** se importa y se confirma,
  **then** los clientes del archivo reemplazan a los actuales y el contador lo refleja.
- **Given** un archivo inválido (JSON roto o sin clientes válidos), **when** se importa,
  **then** hay error y los datos actuales no cambian.
- **Given** el administrador, **when** cambia las claves y cierra sesión, **then** las
  claves nuevas abren y las antiguas no.
- **Given** la app en móvil a 375 px, **when** se usa, **then** no hay desbordamiento,
  `node --test` en verde y la consola limpia.

## 6. Casos límite

- Clave vacía o con letras (el campo es numérico): no se envía / error.
- Archivo que no es JSON, no es array, o sus items no tienen `empresa`: se filtran; si
  resulta **0 clientes válidos** → error sin tocar datos.
- Archivo importado con tipos distintos a Tela/FOAM/Estructuras: se conservan tal cual
  (el guardado no valida tipos).
- Cambiar claves y recargar: la sesión persistente (si la había) sigue válida; al «Salir»
  pide la clave nueva.
- Navegador antiguo sin `crypto.subtle`: mensaje de navegador no compatible.
- Exportar sin clientes: archivo con array vacío (permitido, es copia fiel).

## 7. Fuera de alcance

- Recuperación de claves olvidadas, bloqueo por intentos fallidos, cifrado de datos.
- Sincronización en red o multiusuario concurrente (sería backend).

## 8. Decisiones

1. **Claves por defecto** `2468` (usuario) y `9753` (administrador), documentadas en
   `AGENTS.md`/`MEMORY.md`; el administrador debe cambiarlas.
2. **SHA-256 con WebCrypto** (`crypto.subtle`, nativo; `file://` es contexto seguro) —
   en el código solo viven los hashes, jamás el PIN en claro.
3. **Importar reemplaza** (no fusiona) tras confirmación con conteos — predecible y la
   exportación ya es la copia de seguridad.
4. La pantalla de acceso vive en el mismo `index.html` (sin archivos extra).
5. La validación de sesión es **UI disuasoria** (RF-409): quien tenga acceso al archivo
   podrá leer los datos; se acepta explícitamente.
