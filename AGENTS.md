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

## Regla de ajuste actual (2026-09-20)
Se reconoce explícitamente que la agenda debe medirse por bloques de 30 minutos y no por huecos contiguos. Los espacios libres se computan como unidades discretas dentro del horario clínico (08:00-18:00), de modo que una jornada sin citas tiene 20 bloques disponibles.

## Reglas de validación que deben mantenerse
1. La validación de solapamiento y horario laboral debe vivir en backend y no depender del frontend.
2. El catálogo de tipos de consulta debe ser administrable y debe poder incluir la opción `Otro` con descripción obligatoria.
3. La actualización de una cita debe recalcular `ends_at` en función de la duración del tipo de consulta y volver a verificar solapamiento antes de guardar.
4. El detalle de la cita debe presentarse con nombres de mascota, profesional y tipo de consulta, no con IDs crudos.
5. La vista de agenda debe reflejar la real disponibilidad del profesional y no una cuenta por hueco general.
6. Especie y raza son catálogos persistentes administrables; las razas deben pertenecer a una especie activa.
7. El formulario de mascotas consume los catálogos desde la API, permite búsqueda por texto y filtra las razas según la especie seleccionada.
8. Los nombres de propietarios y mascotas se normalizan con la primera letra de cada palabra en mayúscula.
9. El propietario debe registrar tipo de identificación, identificación numérica de 7 a 10 dígitos, teléfono numérico de 10 dígitos y correo válido.
10. El sexo de la mascota se limita a `Macho` o `Hembra` desde el formulario.

## Estado técnico verificado (2026-09-20)

- Migraciones `0003_species_breed_catalogs`, `0004_seed_canine_feline_breeds` y `0005_owner_identification_type` aplicadas.
- Catálogos cargados: 82 razas caninas y 46 razas felinas.
- CRUD REST disponible para especies y razas, con filtros por búsqueda y especie.
- Las validaciones existen en frontend y backend; el backend continúa siendo la fuente de verdad.