# Contexto de Agentes de IA

**Herramienta Principal:** GitHub Copilot (Beneficio Estudiante)
**Herramienta de Respaldo:** Claude 3.5 Sonnet (Capa gratuita)

## Contexto Inicial (Día 1 - 2026-09-18)
El siguiente prompt se utilizará para iniciar la interacción con el agente en las sesiones de código:

> "Actúa como un Desarrollador Full-Stack Arquitecto experto en Django y Next.js. Estamos construyendo un sistema de agendamiento para una clínica veterinaria. 
> Reglas de negocio obligatorias que debes respetar en cada sugerencia:
> 1. Un profesional no puede tener dos citas que se solapen en el tiempo.
> 2. Cada tipo de consulta tiene una duración distinta que determina su bloque.
> 3. Una cita se puede cancelar hasta cierto límite de tiempo; de lo contrario, es inasistencia.
> 4. Una mascota fallecida no admite citas nuevas, pero su historial debe ser consultable.
> Prioriza siempre la validación de estas reglas en los modelos y servicios del backend antes que en el frontend."

*(Este archivo se actualizará con nuevas reglas estrictas a medida que el agente requiera más contexto o cometa errores que deban prevenirse).*

## Regla de agenda actual (2026-09-20)
La agenda se calcula por intervalos continuos de disponibilidad y no por bloques artificiales de 30 minutos. La regla principal es impedir solapamientos usando la duración real del tipo de consulta.

También se impide que una misma mascota tenga citas solapadas el mismo día, aunque correspondan a profesionales distintos. La disponibilidad de nuevas citas se calcula según la duración, la jornada, el profesional, la mascota y las citas existentes.

## Reglas de validación que deben mantenerse
1. La validación de solapamiento y horario laboral debe vivir en backend y no depender del frontend.
2. El catálogo de tipos de consulta debe ser administrable y debe poder incluir la opción `Otro` con descripción obligatoria.
3. La actualización de una cita debe recalcular `ends_at` en función de la duración del tipo de consulta y volver a verificar solapamiento antes de guardar.
4. El detalle de la cita debe presentarse con nombres de mascota, profesional y tipo de consulta, no con IDs crudos.
5. La vista de agenda debe reflejar la real disponibilidad del profesional y no una cuenta por hueco general.
6. Todos los profesionales comparten el mismo horario: lunes a viernes de 08:00 a 12:00 y de 13:00 a 18:00.
7. Los sábados y domingos no tienen jornada laboral ni permiten nuevas citas.
8. Los festivos operan de 10:00 a 12:00 y de 13:00 a 16:00.
9. El descanso del mediodía de 12:00 a 13:00 nunca está disponible.
10. Especie y raza son catálogos persistentes administrables; las razas deben pertenecer a una especie activa.
11. El formulario de mascotas consume los catálogos desde la API, permite búsqueda por texto y filtra las razas según la especie seleccionada.
12. Los nombres de propietarios y mascotas se normalizan con la primera letra de cada palabra en mayúscula.
13. El propietario debe registrar tipo de identificación, identificación numérica de 7 a 10 dígitos, teléfono numérico de 10 dígitos y correo válido.
14. El sexo de la mascota se limita a `Macho` o `Hembra` desde el formulario.

## Estado técnico verificado (2026-09-20)

- Migraciones `0003` a `0007` aplicadas, incluyendo identificación profesional y restricción de solapamiento por mascota.
- Catálogos cargados: 82 razas caninas y 46 razas felinas.
- CRUD REST disponible para especies y razas, con filtros por búsqueda y especie.
- Las validaciones existen en frontend y backend; el backend continúa siendo la fuente de verdad.
- El histórico global está disponible en `/api/appointments/history/` y en la pantalla `/historial`.
- La última validación ejecutó 23 pruebas backend y un build exitoso de Next.js.