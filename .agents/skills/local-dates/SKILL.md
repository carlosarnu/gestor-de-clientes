---
name: local-dates
description: Úsala siempre que escribas, modifiques o revises código que trabaje con fechas, días o semanas en el Gestor de Clientes.
---
# Fechas locales en el Gestor de Clientes

Las fechas son la mayor fuente de bugs cuando se tocan. Sigue esta guía siempre que
toques código con fechas.

## Reglas

- Los clientes guardan `fecha` como timestamp de época en milisegundos (`Date.now()`):
  es inmune a zonas horarias. No lo cambies a texto sin actualizar la constitución y los tests.
- Para ordenar (del más reciente al más antiguo) compara el timestamp directamente;
  no lo conviertas a texto intermedio.
- Si muestras la fecha de un cliente en la interfaz, construye el texto con los métodos
  locales de `Date` (getFullYear(), getMonth() + 1 y getDate()), rellenando con ceros.
  Nunca uses `toISOString()` para obtener el día: devuelve la fecha en UTC.
- Para convertir "AAAA-MM-DD" en fecha usa `new Date(año, mes - 1, día)`. Nunca
  `new Date("AAAA-MM-DD")`: se interpreta en UTC.
- Para sumar o restar días, usa `setDate(getDate() ± n)`, nunca milisegundos (24 h no
  siempre es un día por los cambios de hora).
- Reutiliza las funciones de fechas que ya existan en `logica.js` y `app.js` antes de
  crear otras nuevas.

## Checklist de revisión

- [ ] ¿Algún `toISOString()` o `new Date("AAAA-MM-DD")` para obtener el día local?
- [ ] ¿Algún cálculo con 86400000 milisegundos?
- [ ] ¿Al editar un cliente se conserva su `fecha` original (no se regenera)?
- [ ] ¿Qué pasa con un cliente creado justo al cambio de hora (último domingo de marzo y de octubre)?

## Al terminar

Indica qué puntos del checklist has comprobado y cómo.
