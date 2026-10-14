# Constitución - Gestor de Clientes

Principios innegociables del proyecto. Toda especificación, plan y tarea debe cumplirlos estrictamente.

1. **Simplicidad y Portabilidad absoluta**: HTML5, CSS3 y JavaScript nativos. Sin frameworks, sin
librerías externas de terceros y sin herramientas de compilación (*bundlers*). La aplicación debe
funcionar perfectamente abriendo `index.html` con un doble clic en cualquier navegador. **Excepcion aprobada (spec 011, 2026-10-14)**: el embudo de escritorio de la carpeta `escritorio/` (Electron + electron-builder) se permite unicamente como empaquetado de la misma web; el codigo de la aplicacion sigue siendo JS puro, sin frameworks ni dependencias.
2. **La especificación manda**: Ninguna funcionalidad o cambio de código se implementa si no está
previamente detallado en su archivo `spec.md` aprobado. Ante cualquier duda o ambigüedad, se debe
pausar y consultar.
3. **Persistencia Segura en `localStorage`**: Los datos introducidos por el comercial son sagrados.
Cualquier modificación en la estructura de los datos guardados debe mantener compatibilidad hacia
atrás para evitar la pérdida de clientes.
4. **Enfoque Comercial / Mobile-First**: La interfaz debe ser limpia, rápida e intuitiva, optimizada
para su uso ágil tanto en ordenadores como en teléfonos móviles durante las visitas comerciales.
5. **Idioma**: Identificadores, variables y comentarios en español (decisión del usuario de la v1,
para que el proyecto sea fácil de mantener); interfaz de usuario y documentación también en español.