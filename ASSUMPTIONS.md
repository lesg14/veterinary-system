# Asunciones del Sistema (Assumptions)

Dado que el requerimiento inicial omite ciertos detalles operativos necesarios para la construcción lógica del sistema, se han tomado las siguientes decisiones y asunciones:

1.  **Horario Operativo:** Se asume que la clínica veterinaria tiene un horario laboral estándar de **8:00 AM a 6:00 PM**. Este dato es fundamental para que el backend pueda calcular y devolver los "espacios libres" en la agenda del día.
2.  **Límite de Cancelación:** Se asume que el "cierto momento antes de la hora" para cancelar una cita sin penalidad es de **2 horas**. Si se cancela con menos de 2 horas de anticipación a la cita programada, el estado pasará obligatoriamente a "Inasistencia".
3.  **Duración de Consultas:** Se asume que la duración de cada tipo de consulta se medirá en **minutos enteros** (ej. 30, 45 o 60 minutos) para facilitar el cálculo matemático de solapamiento en la base de datos (Hora Inicio + Duración = Hora Fin).
4.  **Invariabilidad del Historial:** Se asume que una "atención registrada" (historial) está vinculada directamente a la mascota, garantizando que el borrado lógico o el marcado como "fallecida" no altere las atenciones pasadas.
5.  **Entidad Tipo de Consulta:** Se asume que existen 4 tipos de consultas: Consulta general con duración de 30 minutos, Vacunación con 20 minutos, Control Especializado con 45 minutos y Procedimiento con 60 minutos. Estas duraciones pertenecen al catálogo inicial y pueden administrarse mediante la entidad `ConsultationType`.
6.  **Zona horaria:** Se utiliza `America/Bogota` para almacenar y presentar las fechas y horas de las citas. Los valores recibidos por la API deben incluir zona horaria.
7.  **Profesionales activos:** Solo los profesionales activos pueden recibir nuevas citas. Los registros históricos se conservan aunque un profesional sea inactivado.
8.  **Citas ocupadas:** La agenda considera como ocupados los estados `PROGRAMADA`, `ATENDIDA` e `INASISTENCIA`. Las citas `CANCELADA` liberan el espacio.
9.  **Bloques de disponibilidad:** La disponibilidad se expresa en bloques de 30 minutos. Un día completo de 10 horas tiene exactamente **20 bloques libres** cuando no hay citas agendadas. El conteo por huecos contiguos se descarta para evitar subreportar la agenda.
10. **Detalle humano de la cita:** Los usuarios no deben ver IDs en la vista de detalle o en la tarjeta de agenda; la interfaz debe mostrar nombre de mascota, nombre del profesional y tipo de consulta con duración legible.

## Decisiones aún pendientes

* Horarios particulares, descansos, fines de semana y días festivos por profesional.
* Política para citas futuras cuando una mascota es marcada como fallecida.
* Roles y permisos de los usuarios del sistema.
* Notificaciones a propietarios y profesionales.
* Integración con pagos, seguros y agenda multiclínica.