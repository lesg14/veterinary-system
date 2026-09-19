# Sistema de Agendamiento - Clínica Veterinaria

Este repositorio contiene la prueba técnica para el sistema de agendamiento de una clínica veterinaria. El backend ya resuelve el problema de cruce de citas y pérdida de historiales mediante reglas de negocio estrictas y una API REST. La interfaz Next.js queda como siguiente etapa de construcción.

## Arquitectura
El proyecto está dividido en dos partes principales para separar la lógica de negocio de la interfaz de usuario:
*   **Backend:** Django con PostgreSQL (API REST).
*   **Frontend:** Next.js con Tailwind CSS (pendiente de implementación).

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

La agenda usa el horario asumido de 08:00 a 18:00 y devuelve los espacios libres por profesional. La base de datos debe ser PostgreSQL porque la restricción de solapamiento utiliza `btree_gist` y rangos `tstzrange`.

### 2. Frontend (siguiente etapa)
1. Navegar a la carpeta `frontend`.
2. Instalar dependencias: `npm install`
3. Iniciar el servidor de desarrollo: `npm run dev`

La carpeta `frontend` todavía no ha sido creada. La primera vista será la agenda diaria, conectada al endpoint `GET /api/agenda/`.

## Estado actual

* Modelos y migraciones Django: implementados.
* Servicios de citas y agenda diaria: implementados.
* API REST y pruebas automatizadas: implementadas.
* Interfaz Next.js: pendiente.

## Decisiones arquitectónicas

Las decisiones principales se encuentran en [docs/adr](docs/adr/). El ADR 003 documenta la validación en capas de las reglas de agenda.