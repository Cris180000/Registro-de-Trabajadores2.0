# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Descripción General del Proyecto

**Registro de Trabajadores** es una aplicación web HTML/CSS/JavaScript de un único archivo para gestionar trabajadores agrícolas y registrar sus horas trabajadas. Es una aplicación solo del lado del cliente que almacena todos los datos en localStorage del navegador sin dependencia de servidor.

## Contexto de Negocio

La aplicación está dirigida a **empresarios del sector agrícola** que gestionan trabajadores de campo. El modelo de trabajo habitual es:

- Los trabajadores cobran **por horas**, pero las horas trabajadas son **variables cada jornada** (no hay una jornada fija diaria)
- El empresario necesita registrar a sus trabajadores para darlos de alta en la **Seguridad Social**
- El sueldo de cada trabajador se calcula en función de las **horas reales invertidas**, no de un salario fijo mensual

La aplicación nace como **alternativa al uso de Excel**, simplificando el registro de trabajadores y el cálculo de sueldos variables.

## Arquitectura

### Organización Modular

La aplicación está organizada como módulos JavaScript separados cargados en este orden en `Registro-trabajadores.html`:

1. **utils.js** — Funciones de utilidad para formateo de fechas, moneda, números, debouncing y helpers de localStorage
2. **validations.js** — Lógica de validación de entrada (DNI/cédula único, sin registros duplicados, validación de campos)
3. **modals.js** — Componentes UI de modales/diálogos para agregar, editar y eliminar trabajadores
4. **export.js** — Funcionalidad de importación/exportación de datos (respaldos JSON, exportación CSV, generación PDF) vía objeto `ExportManager`
5. **charts.js** — Visualización de datos y gráficos vía objeto `ChartsManager`
6. **app.js** — Lógica principal de la aplicación vía objeto `AppGestion` (CRUD de trabajadores, registro de horas, dashboard, filtrado, ordenamiento)

Cada módulo expone un único objeto global (Utils, Validaciones, ModalsUI, ExportManager, ChartsManager, AppGestion) con métodos. No se utiliza ningún sistema de módulos ni bundler.

### Modelo de Datos

Todos los datos persisten en localStorage con estas claves:

- `trabajadores` — Array de objetos trabajador: `{id, nombre, cedula, email, telefono, puesto, departamento, salario, tarifaHora, horasPorMes, fechaIngreso, observaciones}`
- `registrosHoras` — Array de registros de horas: `{id, trabajadorId, fecha, horas, tipoTrabajo, observaciones}`
- `tiposTrabajo` — Array de strings de tipos de trabajo (por defecto cultivos como "Aceitunas", "Tomates", etc.)
- `historialCambios` — Registro de auditoría de cambios
- `configuracion` — Configuración del usuario (modo oscuro, recordatorios, alertas)
- `tema` — Tema actual (claro/oscuro)

### Patrones Clave

**Generación de ID del trabajador**: Cada trabajador obtiene un ID numérico generado mediante timestamp + Math.random().
**Registro de horas**: Las horas se rastrean por separado de los trabajadores y se vinculan mediante `trabajadorId` + `fecha`.
**Filtrado/Ordenamiento**: `AppGestion.trabajadoresFiltrados` mantiene una copia filtrada del array principal; los datos reales en `AppGestion.trabajadores` no se alteran.
**Cálculos del dashboard**: Los totales mensuales (horas, salario) se calculan sobre la marcha a partir de los registros de horas, no se almacenan.

## Ejecutar la Aplicación

**Para ejecutar**: Abre `Registro-trabajadores.html` en cualquier navegador moderno (Chrome, Firefox, Safari, Edge). No se requiere servidor ni paso de compilación. El archivo `index.html` redirige al archivo principal.

**Flujo de desarrollo**:
1. Edita los módulos JavaScript (app.js, utils.js, etc.) o styles.css
2. Actualiza el navegador para ver los cambios (sin hot reload, requiere actualización manual)
3. Prueba en el navegador — usa la consola de DevTools del navegador para inspeccionar el estado (`AppGestion.trabajadores`, `localStorage.getItem()`)

## Tareas Comunes

### Agregar un nuevo campo a los registros de trabajadores

1. Actualiza la asunción del modelo de datos (lista anterior)
2. Agrega al formulario de trabajador en `Registro-trabajadores.html` (busca `form-group`)
3. Actualiza `AppGestion.crearTrabajador()` o `AppGestion.editarTrabajador()` para capturar y guardar el campo
4. Actualiza la visualización de tabla en `AppGestion.actualizarInterfaz()` si es necesario
5. Actualiza cualquier lógica de exportación en `ExportManager` si el campo debe aparecer en CSV/JSON

### Agregar validación para un campo

Agrega lógica al objeto `Validaciones` en validations.js, luego llámalo desde el controlador de envío del modal/formulario.

### Cambiar el comportamiento de localStorage

Todos los reads/writes de localStorage pasan por `AppGestion.cargarDatos()`, `AppGestion.guardarDatos()` y utils. Esto está centralizado para minimizar efectos secundarios.

### Exportar datos en un nuevo formato

Agrega un método de exportación a `ExportManager` en export.js (sigue el patrón de `exportarJSON()`, `exportarCSV()`, `exportarPDF()`).

## Estilos

Todos los CSS están en `styles.css`. Usa propiedades personalizadas de CSS (variables) para temas:
- `--verde-oscuro`, `--verde-medio`, `--verde-claro`, `--verde-fondo-claro` para tema verde
- `--texto-claro`, `--fondo-claro`, `--fondo-oscuro`, etc. para modos claro/oscuro

El cambio de modo oscuro cambia el tema vía `AppGestion.toggleTema()`.

## Notas de Prueba

- Sin suite de pruebas automatizadas; prueba manualmente en el navegador
- Usa la consola del navegador para inspeccionar el estado: `AppGestion.trabajadores`, `AppGestion.registrosHoras`
- localStorage persiste entre actualizaciones de página (intencional); usa DevTools del navegador > Storage > Local Storage para limpiar si es necesario
- Los iconos de Font Awesome (v6.4) y Chart.js se cargan vía CDN

## Despliegue

La aplicación está contenida en `Registro-trabajadores.html` y archivos estáticos relacionados. Para desplegar:
- Copia todos los archivos `.html`, `.js`, `.css` a cualquier host estático
- O abre localmente sin ningún servidor

No se requieren variables de entorno, proceso de compilación ni secretos.

## Reglas de Colaboración (IMPORTANTE)

### 1. Commits Automáticos
**Siempre que hagas una reforma/cambio del proyecto, haz commit automáticamente en GitHub** en la rama en la que estoy trabajando. No esperes a que lo pida.

### 2. Explicación de Cambios
**Siempre que hagas un cambio de código, explica qué has hecho**. Soy un programador principiante y estoy aprendiendo. Las explicaciones deben ser:
- Claras y comprensibles
- Con detalles técnicos pero sin jerga innecesaria
- Indicando QUÉ cambió y POR QUÉ se cambió
- Mostrando el antes y después si es relevante

### 3. Corrección de Errores
**Cuando corrijas un error, proporciona**:
1. **DÓNDE está el error**: nombre del archivo y número(s) de línea
2. **QUÉ error es**: descripción del problema/fallo
3. **CÓMO lo has corregido**: explicación detallada de la solución
4. **POR QUÉ funciona**: el razonamiento detrás de la corrección

**Formato recomendado**:
```
**Error encontrado**: [Descripción del error]
**Ubicación**: archivo.js:línea número
**El problema**: [Explicación técnica]
**La solución**: [Cómo se corrigió]
**Resultado**: [Qué cambió y por qué funciona ahora]
```

### 4. Idioma
**Siempre comunica en español**. Sin excepciones. Los comentarios en código pueden estar en español o inglés, pero toda la comunicación conmigo debe ser en español.

### 5. Nivel de Detalle
Como eres un programador principiante:
- No asumo conocimiento previo
- Explico conceptos mientras trabajo
- Muestro cómo verificar que los cambios funcionan
- Sugiero mejoras educativas cuando sea apropiado
