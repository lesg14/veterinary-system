# Sistema de Agendamiento - Clínica Veterinaria

Este repositorio contiene la prueba técnica para el sistema de agendamiento de una clínica veterinaria. El backend resuelve el problema de cruce de citas y pérdida de historiales mediante reglas de negocio estrictas y una API REST. El frontend Next.js permite operar la agenda y administrar los catálogos principales de la clínica.

## Arquitectura
El proyecto está dividido en dos partes principales para separar la lógica de negocio de la interfaz de usuario:
*   **Backend:** Django con PostgreSQL (API REST).
*   **Frontend:** Next.js con CSS Modules y `lucide-react`.

## Requisitos Previos
*   Python 3.10+
*   Node.js 18+
*   PostgreSQL 14+

## Instrucciones de Ejecución Local
### 1. Levantar el Backend (Django)
1. Instalar dependencias: `py -3.12 -m pip install -r backend/requirements.txt`
2. Copiar `backend/.env.example` como `backend/.env` y completar las credenciales de PostgreSQL.
3. Ejecutar migraciones desde `backend`: `py -3.12 manage.py migrate`
4. Ejecutar pruebas: `py -3.12 manage.py test veterinary`
5. Verificar la configuración: `py -3.12 manage.py check`
6. Iniciar servidor desde `backend`: `py -3.12 manage.py runserver`

Endpoints disponibles:

* `POST /api/appointments/`: crear una cita.
* `POST /api/appointments/{id}/cancel/`: cancelar una cita o marcarla como inasistencia.
* `GET /api/agenda/?date=YYYY-MM-DD`: consultar la agenda diaria y espacios libres.
* `GET /api/agenda/?date=YYYY-MM-DD&professional_id={id}`: filtrar la agenda por profesional.
* `GET /api/pets/{id}/history/`: consultar el historial de una mascota.
* `GET|POST /api/owners/`: listar y crear propietarios.
* `GET|PUT|DELETE /api/owners/{id}/`: consultar, actualizar y eliminar un propietario.
* `GET|POST /api/pets/`: listar y crear mascotas.
* `GET|PUT|DELETE /api/pets/{id}/`: consultar, actualizar y eliminar una mascota.
* `GET|POST /api/professionals/`: listar y crear profesionales.
* `GET|PUT|DELETE /api/professionals/{id}/`: consultar, actualizar y eliminar un profesional.
* `GET|POST /api/consultation-types/`: listar y crear tipos de consulta.
* `GET|PUT|DELETE /api/consultation-types/{id}/`: consultar, actualizar y eliminar un tipo de consulta.

La agenda usa el horario asumido de 08:00 a 18:00 y devuelve los espacios libres por profesional. La base de datos debe ser PostgreSQL porque la restricción de solapamiento utiliza `btree_gist` y rangos `tstzrange`.

### 2. Levantar el Frontend (Next.js)
1. Abrir otra terminal y navegar a la carpeta `frontend`.
2. Instalar dependencias: `npm install`
3. Copiar `frontend/.env.example` como `frontend/.env.local` si se necesita cambiar la URL del backend.
4. Iniciar el servidor de desarrollo: `npm run dev`
5. Abrir `http://localhost:3000`.

El frontend incluye la agenda diaria, filtros por fecha y profesional, espacios libres, resumen de citas, formulario de nueva cita y la pantalla `/gestion` para administrar propietarios, mascotas y profesionales. Utiliza un rewrite de Next.js para reenviar `/api/*` a Django y evitar CORS durante el desarrollo.

Para ejecutar el sistema completo, mantener dos terminales abiertas:

* Terminal 1: `cd backend` y `py -3.12 manage.py runserver 8000`.
* Terminal 2: `cd frontend` y `npm run dev`.

## Estado actual

* Modelos y migraciones Django: implementados.
* Servicios de citas y agenda diaria: implementados.
* API REST y pruebas automatizadas: implementadas.
* Interfaz Next.js: implementada para agenda, creación de citas, historial y administración CRUD.
* CRUD de propietarios, mascotas y profesionales: implementado en la API y en la pantalla `/gestion`.
* CRUD de tipos de consulta: implementado en la API y en la pantalla `/gestion`. El tipo `Otro` exige una descripción del motivo.

## Decisiones arquitectónicas

Las decisiones principales se encuentran en [docs/adr](docs/adr/). El ADR 003 documenta la validación en capas de las reglas de agenda y el ADR 004 documenta la decisión de implementar el CRUD mediante API REST y una pantalla administrativa dedicada.