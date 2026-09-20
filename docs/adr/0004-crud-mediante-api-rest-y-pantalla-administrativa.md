# ADR 004: CRUD mediante API REST y pantalla administrativa

## Fecha
2026-09-19

## Estado
Aceptado

## Contexto

La clínica necesita mantener actualizados los datos de propietarios, mascotas y profesionales. Estas entidades se relacionan con citas e historiales, por lo que sus operaciones no deben depender únicamente de formularios del frontend ni permitir cambios que ignoren las restricciones del backend.

## Decisión

Se implementa el CRUD en dos partes coordinadas:

1. Django REST Framework expone endpoints para listar, crear, consultar, actualizar y eliminar propietarios, mascotas y profesionales.
2. Next.js ofrece la pantalla `/gestion` con búsqueda, tablas, formularios de alta y edición, y acciones de eliminación.

El frontend funciona como cliente de la API. Las relaciones, estados y restricciones siguen siendo responsabilidad de Django y PostgreSQL. La pantalla de mascotas exige seleccionar un propietario y permite marcar el estado vital; el backend conserva la última palabra sobre la validez del registro.

## Justificación

* La API permite que el frontend y futuras aplicaciones utilicen el mismo contrato.
* Las reglas no se duplican en React, reduciendo inconsistencias entre clientes.
* La pantalla `/gestion` separa la administración de catálogos de la agenda diaria.
* Los registros relacionados permanecen protegidos por las reglas `PROTECT` del modelo, evitando borrar información necesaria para el historial.
* La búsqueda y las tablas facilitan el trabajo operativo de la clínica sin convertir la agenda en una pantalla sobrecargada.

## Alternativas consideradas

### Crear y modificar datos únicamente desde Django Admin

**Descartada.** El administrador es útil durante el desarrollo, pero no constituye la experiencia operativa final para el personal de la clínica.

### Implementar el CRUD únicamente en Next.js

**Descartada.** Permitiría una interfaz rápida, pero dejaría las validaciones expuestas a clientes que no usen esa interfaz.

### Crear una pantalla independiente para cada entidad

**Descartada para esta versión.** Se eligió una pantalla administrativa con pestañas para reducir navegación repetida y mantener un único patrón de búsqueda, tabla y formulario.

## Consecuencias

### Positivas

* Los catálogos principales pueden administrarse desde la aplicación.
* La API queda preparada para integraciones futuras.
* Los errores de integridad regresan al formulario y se muestran al usuario.
* El historial mantiene sus protecciones aunque se intente eliminar una entidad relacionada.

### Negativas y riesgos

* Todavía no existen autenticación ni permisos por rol.
* Los formularios trabajan con los catálogos actuales y deberán ampliarse cuando se incorporen paginación, filtros avanzados o notificaciones.
* La eliminación depende de la protección referencial del backend y puede ser rechazada cuando existen relaciones históricas.

## Verificación

La decisión se verificó mediante:

* 10 pruebas automatizadas del backend.
* Prueba de los endpoints `/api/owners/`, `/api/pets/` y `/api/professionals/`.
* Prueba funcional desde `/gestion` creando y eliminando un propietario.
* Compilación exitosa de Next.js, incluyendo la ruta `/gestion`.