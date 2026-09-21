# Asunciones del Sistema (Assumptions)

Dado que el requerimiento inicial omite ciertos detalles operativos necesarios para la construcción lógica del sistema, se han tomado las siguientes decisiones y asunciones:

1.  **Horario Operativo:** Todos los profesionales comparten lunes a viernes de **08:00 a 12:00** y de **13:00 a 18:00**. Los fines de semana no tienen servicio y los festivos operan de **10:00 a 12:00** y de **13:00 a 16:00**.
2.  **Límite de Cancelación:** Se asume que el "cierto momento antes de la hora" para cancelar una cita sin penalidad es de **2 horas**. Si se cancela con menos de 2 horas de anticipación a la cita programada, el estado pasará obligatoriamente a "Inasistencia".
3.  **Duración de Consultas:** Se asume que la duración de cada tipo de consulta se medirá en **minutos enteros** (ej. 30, 45 o 60 minutos) para facilitar el cálculo matemático de solapamiento en la base de datos (Hora Inicio + Duración = Hora Fin).
4.  **Invariabilidad del Historial:** Una atención registrada queda vinculada a la mascota, la cita y el profesional. El borrado lógico o el marcado como "fallecida" no altera las atenciones ni las citas históricas.
5.  **Entidad Tipo de Consulta:** El catálogo de `ConsultationType` es administrable. Las duraciones son enteros positivos y pueden variar; 30, 45 y 60 minutos son ejemplos de duraciones soportadas, no bloques obligatorios.
6.  **Zona horaria:** Se utiliza `America/Bogota` para almacenar y presentar las fechas y horas de las citas. Los valores recibidos por la API deben incluir zona horaria.
7.  **Profesionales activos:** Solo los profesionales activos pueden recibir nuevas citas. Los registros históricos se conservan aunque un profesional sea inactivado.
8.  **Citas ocupadas:** La agenda considera como ocupados los estados `PROGRAMADA`, `ATENDIDA` e `INASISTENCIA`. Las citas `CANCELADA` liberan el espacio, pero permanecen en el histórico.
9.  **Disponibilidad continua:** La agenda devuelve intervalos continuos libres separados por citas y por el descanso de 12:00 a 13:00. No se utiliza un conteo de bloques de 30 minutos para decidir si una cita puede registrarse.
10. **Detalle humano de la cita:** Los usuarios no deben ver IDs en la vista de detalle o en la tarjeta de agenda; la interfaz debe mostrar nombre de mascota, nombre del profesional y tipo de consulta con duración legible.
11. **Catálogos de mascotas:** Especies y razas se almacenan como entidades administrables en PostgreSQL. Una raza pertenece a una única especie y no puede utilizarse con otra.
12. **Carga inicial de razas:** El catálogo inicial contiene 82 razas caninas y 46 felinas. La carga se realiza mediante migración idempotente y puede ampliarse desde Configuración.
13. **Búsqueda de catálogos:** Los selectores de especie y raza permiten escribir para filtrar resultados; el selector de raza solo muestra razas activas de la especie seleccionada.
14. **Datos del propietario:** El tipo de identificación se selecciona de opciones controladas (`CC`, `CE`, `PASSPORT` o `NIT`). La identificación es obligatoria, admite entre 7 y 10 dígitos y no acepta símbolos; el teléfono es obligatorio y contiene exactamente 10 dígitos; el correo es obligatorio y debe tener formato válido.
15. **Datos del profesional:** El tipo de identificación se selecciona de las mismas opciones controladas. La identificación admite entre 7 y 10 dígitos, el teléfono exactamente 10 dígitos y el correo debe tener formato válido.
16. **Datos de mascota:** El nombre se normaliza con capitalización por palabra y el sexo es opcional, pero si se registra solo puede ser `Macho` o `Hembra`, regla aplicada también en backend.
17. **Solapamiento de mascota:** Una mascota no puede tener citas que se crucen el mismo día, aunque los profesionales sean distintos.
18. **Disponibilidad de citas:** El formulario consulta al backend horarios válidos cada 15 minutos según duración, jornada, profesional, mascota y citas existentes. Solo se ofrecen horarios donde la consulta puede finalizar dentro de la jornada.
19. **Histórico global:** Todas las citas se conservan y pueden filtrarse por estado, mascota, profesional, texto y rango de fechas desde `/historial`.

## Decisiones aún pendientes

* Configuración administrativa de festivos; actualmente se aplica el calendario de festivos colombianos en común para todos los profesionales.
* Política para citas futuras cuando una mascota es marcada como fallecida.
* Roles y permisos de los usuarios del sistema.
* Notificaciones a propietarios y profesionales.
* Integración con pagos, seguros y agenda multiclínica.