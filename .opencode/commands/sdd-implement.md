---
description: SDD · Implementa UNA tarea, tests primero (uso - /sdd-implement 002-nombre T3)
agent: build
---
Implementa SOLO la tarea $2 de docs/specs/$1/tasks.md, siguiendo docs/specs/$1/plan.md, docs/constitution.md
y la skill sdd.
1. Si la tarea toca lógica pura (`logica.js`), escribe primero los tests y comprueba que fallan;
si solo toca la interfaz, prepárate para verificarla con Chrome DevTools.
2. Escribe el código hasta que los tests pasen (o hasta que la interfaz esté verificada).
3. Ejecuta node --test y muéstrame el resultado; si hay cambios visuales, verifica con Chrome DevTools
(incluida la vista móvil de 375 px).
4. Marca $2 como hecha en tasks.md e indica qué RF cubre.

Después PÁRATE. No empieces la siguiente tarea. 