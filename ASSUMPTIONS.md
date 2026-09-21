# Asunciones del Sistema (Assumptions)

Dado que el requerimiento inicial omite ciertos detalles operativos necesarios para la construcción lógica del sistema, se han tomado las siguientes decisiones y asunciones:

1.  **Horario Operativo:** Todos los profesionales comparten lunes a viernes de **08:00 a 12:00** y de **13:00 a 18:00**. Los fines de semana no tienen servicio y los festivos operan de **10:00 a 12:00** y de **13:00 a 16:00**.
2.  **Límite de Cancelación:** Se asume que el "cierto momento antes de la hora" para cancelar una cita sin penalidad es de **2 horas**. Si se cancela con menos de 2 horas de anticipación a la cita programada, el estado pasará obligatoriamente a "Inasistencia".
3.  **Duración de Consultas:** Se asume que la duración de cada tipo de consulta se medirá en **minutos enteros** (ej. 30, 45 o 60 minutos) para facilitar el cálculo matemático de solapamiento en la base de datos (Hora Inicio + Duración = Hora Fin).
4.  **Invariabilidad del Historial:** Se asume que una "atención registrada" (historial) está vinculada directamente a la mascota, garantizando que el borrado lógico o el marcado como "fallecida" no altere las atenciones pasadas.
5.  **Entidad Tipo de Consulta:** Se asume que existen 4 tipos de consultas: Consulta general con duración de 30 minutos, Vacunación con 20 minutos, Control Especializado con 45 minutos y Procedimiento con 60 minutos. Estas duraciones pertenecen al catálogo inicial y pueden administrarse mediante la entidad `ConsultationType`.
6.  **Zona horaria:** Se utiliza `America/Bogota` para almacenar y presentar las fechas y horas de las citas. Los valores recibidos por la API deben incluir zona horaria.
7.  **Profesionales activos:** Solo los profesionales activos pueden recibir nuevas citas. Los registros históricos se conservan aunque un profesional sea inactivado.
8.  **Citas ocupadas:** La agenda considera como ocupados los estados `PROGRAMADA`, `ATENDIDA` e `INASISTENCIA`. Las citas `CANCELADA` liberan el espacio, pero permanecen en el histórico.
9.  **Disponibilidad continua:** La agenda devuelve intervalos continuos libres separados por citas y por el descanso de 12:00 a 13:00. No se utiliza un conteo de bloques de 30 minutos para decidir si una cita puede registrarse.
10. **Detalle humano de la cita:** Los usuarios no deben ver IDs en la vista de detalle o en la tarjeta de agenda; la interfaz debe mostrar nombre de mascota, nombre del profesional y tipo de consulta con duración legible.
11. **Catálogos de mascotas:** Especies y razas se almacenan como entidades administrables en PostgreSQL. Una raza pertenece a una única especie y no puede utilizarse con otra.
12. **Carga inicial de razas:** El catálogo inicial contiene 82 razas caninas y 46 felinas. La carga se realiza mediante migración idempotente y puede ampliarse desde Configuración.
13. **Búsqueda de catálogos:** Los selectores de especie y raza permiten escribir para filtrar resultados; el selector de raza solo muestra razas activas de la especie seleccionada.
14. **Datos del propietario:** El tipo de identificación se selecciona de un catálogo controlado. La identificación admite entre 7 y 10 dígitos y el teléfono exactamente 10 dígitos; no se aceptan símbolos.
15. **Datos de mascota:** El nombre se normaliza con capitalización por palabra y el sexo se limita a `Macho` o `Hembra`.
16. **Solapamiento de mascota:** Una mascota no puede tener citas que se crucen el mismo día, aunque los profesionales sean distintos.
17. **Disponibilidad de citas:** El formulario consulta al backend horarios válidos según duración, jornada, profesional, mascota y citas existentes.
18. **Histórico global:** Todas las citas se conservan y pueden filtrarse por estado, mascota, profesional, texto y rango de fechas desde `/historial`.

## Decisiones aún pendientes

* Configuración administrativa de festivos; actualmente se aplica el calendario de festivos colombianos en común para todos los profesionales.
* Política para citas futuras cuando una mascota es marcada como fallecida.
* Roles y permisos de los usuarios del sistema.
* Notificaciones a propietarios y profesionales.
* Integración con pagos, seguros y agenda multiclínica.