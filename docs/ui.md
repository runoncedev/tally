# UI Spec

## Home `/`

- Muestra el saldo total acumulado (suma de todas las transacciones históricas)
- Lista de meses en orden descendente, uno abajo del otro, el usuario scrollea
- Cada mes muestra: ingresos, gastos y balance del mes
- Cada mes es un link a su página de detalle
- Empty state: si no hay datos, muestra un mensaje indicando que no hay transacciones y un link al mes actual

## Month Detail `/:month` (ej: `/2026-04`)

- Tabla de transacciones del mes con columnas: fecha, monto, categoría, recurrente
- Al abrir el mes, se cargan automáticamente las transacciones recurrentes faltantes:
  - Se obtienen todas las tx `recurrent=true` del historial (únicas por `category_id`)
  - Las que no tienen tx en el mes actual aparecen como rows pre-llenadas con `category` y `date` (primer día del mes); `amount` y `recurrent` quedan vacíos
  - No se guardan en la DB hasta que el usuario las completa y confirma
- Siempre hay una row vacía al final para agregar nuevas transacciones
- Guardar una row: presionando Enter o con un botón "Save all" que guarda todas las rows con datos completos
- El campo `date` tiene restricción de `min` y `max` al rango del mes
