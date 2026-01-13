# Registro de Trabajadores

Aplicación web simple en un único archivo (`Registro-trabajadores.html`) para registrar y gestionar trabajadores. No requiere internet ni servidor. Los datos se guardan en el navegador (localStorage).

## Funciones
- Alta, edición y eliminación de trabajadores
- Búsqueda instantánea por cualquier campo
- Ordenación por columnas
 - Exportar a JSON (respaldo) y CSV (abrible con Excel)
- Importar desde JSON exportado previamente
- Borrar todos los registros
- Imprimir listado
  - Gestión por horas: tarifa €/hora, registro de horas por mes, y cálculo de pago mensual

## Campos
- Nombre completo (obligatorio)
- DNI/NIF (obligatorio y único)
- Email, Teléfono
- Puesto, Departamento
- Salario (€)
- Tarifa por hora (€/h) y horas por mes con cálculo de pago mensual
- Fecha de ingreso
- Observaciones

## Cómo usar
1. Abre el archivo `Registro-trabajadores.html` haciendo doble clic, o con tu navegador favorito.
2. Completa el formulario y pulsa Guardar. El registro aparece en el listado.
3. Usa Editar para modificar un registro, o Eliminar para borrarlo.
4. Escribe en "Buscar" para filtrar.
5. Pulsa en los encabezados de la tabla para ordenar.
6. En la barra, selecciona el “Mes” (formato AAAA-MM).
7. En cada fila, pulsa "Horas" para introducir las horas del mes; el pago del mes se calcula como €/hora × horas.
8. Verás el total del mes (de los resultados filtrados) a la derecha.
9. Haz respaldo con "Exportar JSON" y recupéralo con "Importar JSON".
10. "Exportar CSV" genera un archivo separando por punto y coma, e incluye el mes, horas y pago del mes.

## Copias de seguridad
- Los datos se almacenan en el navegador. Si cambias de navegador o borras los datos del navegador, puedes perderlos.
- Por eso se recomienda exportar a JSON de forma periódica, y guardar ese archivo.

## Privacidad
- Toda la información permanece en tu equipo y navegador.
- No hay envío a ningún servidor.

## Problemas comunes
- Si no se guarda: puede ser que el navegador bloquee el almacenamiento local o no haya espacio.
- Si el JSON no importa: asegúrate de usar un archivo exportado por esta misma app.

## Licencia
Uso personal/educativo. Adáptalo a tus necesidades.