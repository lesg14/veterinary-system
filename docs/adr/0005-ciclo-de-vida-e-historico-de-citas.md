# ADR 005: Ciclo de vida e histórico de citas

## Fecha
2026-09-20

## Estado
Aceptado

## Contexto

La clínica necesita conservar la trazabilidad completa de las citas. Una cita puede programarse, atenderse, cancelarse o convertirse en inasistencia, pero ninguno de esos cambios debe borrar el registro original ni impedir consultas posteriores.

El registro de atención clínica debe quedar relacionado con la cita y la mascota. Además, el personal necesita consultar todas las citas históricas y filtrarlas por estado, mascota, profesional, texto y rango de fechas.

## Decisión

Se establece un ciclo de vida controlado para `Appointment`:

* `SCHEDULED`: cita programada y activa.
* `ATTENDED`: cita cumplida mediante el registro de una atención clínica.
* `CANCELED`: cita cancelada con al menos dos horas de anticipación.
* `NO_SHOW`: cita cancelada con menos de dos horas de anticipación o registrada como inasistencia.

Las citas no se eliminan al cambiar de estado. El histórico se consulta mediante `GET /api/appointments/history/` y la pantalla `/historial`, que permite filtrar por estado, mascota, profesional, texto y fechas.

El registro de una atención se realiza desde el detalle de la cita, sin redirección obligatoria. Al guardar una visita vinculada a una cita programada, el backend cambia automáticamente su estado a `ATTENDED`.

## Justificación

* Mantener la entidad `Appointment` evita perder trazabilidad operativa y clínica.
* Los estados representan decisiones de negocio explícitas y consultables.
* La regla de cancelación se centraliza en el backend y no depende del reloj ni de la interfaz.
* El histórico permite auditar inasistencias y cancelaciones, además de consultar la actividad completa de una mascota.
* La relación entre `Visit`, `Appointment` y `Pet` conserva el contexto clínico de cada atención.

## Alternativas consideradas

### Eliminar las citas canceladas

**Descartada.** Ocultaría información necesaria para auditoría, análisis de inasistencias y seguimiento de la agenda.

### Crear una tabla separada para cada estado

**Descartada.** Duplicaría datos y dificultaría las transiciones. Un único modelo con estados controlados mantiene la trazabilidad y simplifica los filtros.

### Registrar la atención solo desde una pantalla independiente

**Descartada.** El registro debe poder iniciarse desde el detalle de la cita para mantener el contexto de mascota, profesional, consulta y horario.

### Resolver los estados únicamente en el frontend

**Descartada.** Otra integración podría modificar una cita sin respetar la ventana de cancelación o marcarla como atendida sin una visita asociada.

## Consecuencias

### Positivas

* Todas las citas permanecen disponibles para consulta histórica.
* El estado de una cita es visible en la agenda y en `/historial`.
* Las atenciones clínicas actualizan automáticamente la cita relacionada.
* Las cancelaciones e inasistencias pueden filtrarse y auditarse.

### Negativas y riesgos

* El histórico crecerá continuamente y posteriormente puede requerir paginación o archivado.
* Las transiciones de estado deben mantenerse restringidas para evitar cambios inconsistentes.
* Actualmente no existen autenticación ni permisos por rol para controlar quién puede cambiar estados.

## Verificación

La decisión se verificó mediante:

* Pruebas de cancelación dentro y fuera del límite de dos horas.
* Pruebas de registro de atención y transición automática a `ATTENDED`.
* Pruebas del endpoint histórico con filtros.
* `py -3.12 manage.py check`.
* Suite backend con 23 pruebas exitosas.
* Build exitoso de Next.js con la ruta `/historial`.
