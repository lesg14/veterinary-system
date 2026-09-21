# Bitácora de uso de IA

Esta bitácora registra las interacciones con los agentes de IA durante el desarrollo del proyecto, detallando las decisiones tomadas sobre el código generado.

## Sesión 1: 2026-09-18
*   **Qué pedí:** Estructuración de la arquitectura inicial y redacción de los documentos obligatorios (ADR 1, ADR 2, README, ASSUMPTIONS, AGENTS).
*   **Qué propuso el agente:** Utilizar una arquitectura desacoplada (Django + Next.js) y plantillas Markdown estructuradas para cumplir con los criterios de evaluación de la prueba.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Se revisaron los argumentos técnicos (descarte de Spring Boot y Angular) y se incorporaron a los ADRs por alinearse con el límite de tiempo de una semana.
*   **Qué quedó sin verificar:** Aún no se ha generado código ejecutable, por lo que no hay validación de compilación en esta sesión.


## Sesión 2: 2026-09-19
*   **Qué pedí:** Analiza los requisitos del sistema veterinario. Propón entidades, estados, relaciones y casos de uso. No escribas código todavía. Identifica ambigüedades y supuestos.

## Sesión 3: 2026-09-19
*   **Qué pedí:** Crear los modelos de base de datos aplicando las restricciones y reglas del negocio.
*   **Qué propuso el agente:** Crear los modelos `Owner`, `Pet`, `Professional`, `ConsultationType`, `Appointment` y `Visit`, junto con migraciones PostgreSQL.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Se aplicaron estados controlados, protección del historial, cálculo de duración, horario laboral, bloqueo de mascotas fallecidas y restricción de solapamiento.
*   **Qué quedó verificado:** `manage.py check`, migraciones aplicadas y conexión con PostgreSQL.

## Sesión 4: 2026-09-19
*   **Qué pedí:** Continuar la construcción en el orden recomendado.
*   **Qué propuso el agente:** Centralizar las operaciones de citas y agenda en servicios Django, exponerlas mediante API REST y cubrirlas con pruebas de dominio e integración.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Se implementaron creación y cancelación de citas, agenda diaria, espacios libres, historial y endpoints REST.
*   **Qué quedó verificado:** `manage.py check` y 9 pruebas automatizadas exitosas.

## Sesión 5: 2026-09-19
*   **Qué pedí:** Actualizar la documentación antes de construir el frontend.
*   **Qué decidió el agente:** Actualizar README, supuestos y bitácora, y crear el ADR 003 para registrar la validación en capas de las reglas de agenda.
*   **Decisión (Aceptado/Rechazado):** Aceptado. La documentación fue actualizada y el ADR 003 quedó incorporado al repositorio.

## Sesión 6: 2026-09-19
*   **Qué pedí:** Crear el frontend completo y el CRUD de propietarios, mascotas y profesionales.
*   **Qué propuso el agente:** Implementar una interfaz Next.js con agenda diaria, historial y pantalla `/gestion`, además de endpoints REST CRUD en Django.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Se decidió mantener las validaciones en el backend y usar el frontend como cliente de la API, evitando duplicar reglas de integridad en React.
*   **Qué quedó verificado:** Build de Next.js exitoso, `manage.py check`, 10 pruebas automatizadas exitosas y prueba funcional de creación y eliminación de un propietario desde la interfaz.

## Sesión 7: 2026-09-19
*   **Qué pedí:** Actualizar los archivos Markdown y registrar la decisión tomada.
*   **Qué decidió el agente:** Actualizar el estado real del README, cerrar la bitácora y crear el ADR 004 sobre el CRUD administrativo.
*   **Decisión (Aceptado/Rechazado):** Aceptado parcialmente. Se consolidó la documentación del proyecto y se cerró la validación de la capa de negocio de la agenda.

## Sesión 8: 2026-09-19
*   **Qué pedí:** Corregir la representación del tiempo libre y completar el módulo de tipos de consulta, además de habilitar el reagendamiento desde la cita.
*   **Qué propuso el agente:** Calcular los espacios libres como intervalos continuos dentro de la jornada laboral de cada profesional, descontando sus citas programadas y el descanso del mediodía. También exponer `ConsultationType` con CRUD y un campo obligatorio para `Otro`, y reutilizar la API de citas para actualizar `starts_at` sin romper validaciones.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Un espacio libre representa el horario real en el que el profesional puede atender; no representa bloques fijos de 30 minutos ni un conteo artificial de huecos.
*   **Qué quedó verificado:** `manage.py check`, pruebas de backend y build de Next.js exitosos. La agenda devuelve intervalos disponibles respetando jornada, descanso y citas existentes.

## Sesión 9: 2026-09-20
*   **Qué pedí:** Dejar registrado el estado real del proyecto en la documentación autorizada.
*   **Qué decidió el agente:** Actualizar los documentos de contexto (`AGENTS.md`, `ASSUMPTIONS.md` y esta bitácora) con el estado verificado del sistema en producción local.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Los archivos quedaron alineados con la implementación real, no con la intención inicial del proyecto.

## Sesión 10: 2026-09-20
*   **Qué pedí:** Crear catálogos persistentes de especies y razas, permitir búsqueda y filtros, y dejar de utilizar datos estáticos en el formulario de mascotas.
*   **Qué propuso el agente:** Crear las entidades `Species` y `Breed`, relacionarlas con `Pet`, exponer CRUD REST, cargar un catálogo inicial y agregar búsqueda por texto y filtro por especie en la configuración.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Se aplicaron las migraciones `0003` y `0004`, se cargaron 82 razas caninas y 46 felinas, y se validó que una raza solo pueda utilizarse con su especie.
*   **Qué quedó verificado:** Los endpoints de especies, razas y mascotas responden correctamente; 16 pruebas backend y el build frontend pasaron.

## Sesión 11: 2026-09-20
*   **Qué pedí:** Validar los formularios de propietario y mascota, incluyendo identificación, teléfono, correo, nombres, sexo y búsqueda de razas.
*   **Qué propuso el agente:** Agregar tipo de identificación, restricciones numéricas, validación de correo, capitalización automática de nombres, selector de sexo y combobox buscable para especies y razas.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Se implementó la migración `0005_owner_identification_type`, validación en backend y controles equivalentes en frontend.
*   **Qué quedó verificado:** La identificación admite 7-10 dígitos, el teléfono exactamente 10, el backend rechaza combinaciones inválidas y el build de Next.js es exitoso.

## Sesión 12: 2026-09-20
*   **Qué pedí:** Separar los cambios en commits de backend y frontend.
*   **Qué decidió el agente:** Crear `91755a5` para backend y `3646085` para frontend, manteniendo separados modelos, migraciones, API, pruebas y componentes de interfaz.
*   **Decisión (Aceptado/Rechazado):** Aceptado. El repositorio quedó limpio después de validar 16 pruebas backend y el build frontend.

## Sesión 13: 2026-09-20
*   **Qué pedí:** Ajustar el dilema de la agenda: eliminar la dependencia de bloques de 30 minutos, evitar solapamientos por duración real, usar un horario común, cerrar fines de semana, definir horario de festivos y respetar el descanso del mediodía.
*   **Qué decidió el agente:** Cambiar la disponibilidad a intervalos continuos, mantener el cálculo de `ends_at` según el tipo de consulta y centralizar las franjas laborales en el backend.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Se configuró lunes a viernes de 08:00-12:00 y 13:00-18:00, festivos de 10:00-12:00 y 13:00-16:00, y fines de semana cerrados.
*   **Qué quedó verificado:** 10 pruebas específicas de agenda pasan; se cubren duración de 60 minutos, almuerzo, fin de semana y festivo.

## Sesión 14: 2026-09-20
*   **Qué pedí:** Impedir que una mascota tenga citas solapadas el mismo día aunque sean con profesionales diferentes.
*   **Qué decidió el agente:** Agregar validación de dominio, restricción PostgreSQL y filtrado de disponibilidad por profesional y mascota.
*   **Decisión (Aceptado/Rechazado):** Aceptado. La migración `0007_pet_appointment_overlap_constraint` resolvió conflictos históricos sin eliminar registros.
*   **Qué quedó verificado:** La regla quedó cubierta por pruebas de servicio y API.

## Sesión 15: 2026-09-20
*   **Qué pedí:** Crear el submenú Historial y retirar Atenciones como submenú independiente.
*   **Qué decidió el agente:** Crear `/historial` y `/api/appointments/history/` con filtros por estado, texto, mascota, profesional y rango de fechas. El registro de atención permanece disponible desde el detalle de la cita.
*   **Decisión (Aceptado/Rechazado):** Aceptado. El histórico conserva todas las citas, incluidas canceladas e inasistencias; Atenciones dejó de aparecer en la navegación principal.
*   **Qué quedó verificado:** La ruta `/historial` compila y el frontend genera siete rutas correctamente.

## Sesión 16: 2026-09-20
*   **Qué pedí:** Hacer visibles los espacios libres como horarios reales del profesional y validar los horarios disponibles antes de crear una cita.
*   **Qué decidió el agente:** Mostrar cada intervalo continuo disponible en la agenda y conectar el formulario de nueva cita con `/api/appointments/availability/`, considerando jornada, descanso, duración, profesional, mascota y citas existentes.
*   **Decisión (Aceptado/Rechazado):** Aceptado. Los espacios libres dejaron de ser un contador abstracto y pasaron a mostrarse como rangos horarios que pueden utilizarse para atender.
*   **Qué quedó verificado:** La suite backend alcanzó 23 pruebas y el build frontend continúa exitoso.
