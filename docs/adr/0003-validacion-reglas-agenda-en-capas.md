# ADR 003: Validación de reglas de agenda en capas

## Fecha
2026-09-19

## Estado
Aceptado

## Contexto

La regla más crítica del sistema es impedir que un profesional tenga dos citas que se solapen. Además, la duración de la consulta, el horario laboral, el estado de la mascota y las reglas de cancelación deben mantenerse aunque la operación provenga de una interfaz diferente al frontend.

Una validación únicamente en Next.js no es suficiente: puede omitirse mediante otra herramienta, una solicitud directa a la API o dos solicitudes concurrentes. Por otra parte, una validación únicamente en la base de datos no proporciona mensajes de negocio claros ni permite centralizar todas las reglas del caso de uso.

## Decisión

Se valida la lógica de agenda en tres capas complementarias:

1. **Servicios Django:** `create_appointment`, `cancel_appointment` y `get_daily_schedule` concentran los casos de uso y calculan la duración, los espacios libres y los estados de cancelación.
2. **Modelos Django:** `clean()` y `save()` protegen invariantes del dominio, como mascotas fallecidas, profesionales inactivos, horario de atención y coherencia de la hora final.
3. **PostgreSQL:** una `ExclusionConstraint` con índice GiST impide solapamientos entre citas programadas del mismo profesional. La extensión `btree_gist` permite combinar la igualdad del profesional con la superposición del rango temporal.

La API REST reutiliza los servicios existentes y no duplica las reglas de negocio en las vistas.

## Justificación

* La lógica no depende de una sola interfaz de usuario.
* Los servicios ofrecen un punto claro para probar los casos de uso.
* Los modelos protegen las entidades aunque sean creadas desde el administrador, una tarea o una futura integración.
* PostgreSQL evita que dos solicitudes concurrentes creen citas incompatibles después de pasar una validación previa al mismo tiempo.
* Las pruebas de dominio e integración verifican tanto las reglas como los endpoints públicos.

## Alternativas consideradas

### Validar únicamente en el frontend

**Descartada.** No protege la API ni evita inconsistencias cuando existen varios clientes o solicitudes concurrentes.

### Validar únicamente en los modelos

**Descartada.** La validación previa del modelo mejora los mensajes, pero no reemplaza una restricción transaccional de base de datos frente a operaciones concurrentes.

### Resolver solapamientos solo desde el servicio

**Descartada.** Permitiría centralizar el caso de uso, pero dejaría la base expuesta a escrituras que no pasen por el servicio.

### Usar SQLite en desarrollo

**Descartada para este proyecto.** SQLite no ofrece la misma integración con rangos temporales y exclusiones GiST requerida por la regla principal. PostgreSQL se utiliza desde el inicio para que desarrollo y producción compartan el comportamiento de integridad.

## Consecuencias

### Positivas

* Las reglas críticas tienen defensa en profundidad.
* La agenda diaria puede reutilizarse desde el frontend, pruebas y futuras integraciones.
* El sistema falla de forma explícita cuando una operación viola una regla.
* Las citas canceladas liberan el intervalo porque la restricción solo aplica a citas `SCHEDULED`.

### Negativas y riesgos

* El backend depende de PostgreSQL y de la extensión `btree_gist`.
* Las reglas deben mantenerse sincronizadas con los estados y los servicios.
* La validación del modelo y la restricción de base de datos pueden producir errores distintos; la API debe traducirlos a respuestas comprensibles.

## Verificación

La decisión se validó con:

* `py -3.12 manage.py check`
* `py -3.12 manage.py test veterinary`
* 9 pruebas automatizadas de dominio e integración.
* Migraciones PostgreSQL `0001_initial` y `0002_remove_appointment_scheduled_appointments_do_not_overlap_and_more` aplicadas correctamente.
