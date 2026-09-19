# Sistema de Agendamiento - Clínica Veterinaria

Este repositorio contiene la prueba técnica para el sistema de agendamiento de una clínica veterinaria. El sistema resuelve el problema de cruce de citas y pérdida de historiales mediante reglas de negocio estrictas y una visualización clara de la agenda diaria.

## Arquitectura
El proyecto está dividido en dos partes principales para separar la lógica de negocio de la interfaz de usuario:
*   **Backend:** Django con PostgreSQL (API REST).
*   **Frontend:** Next.js con Tailwind CSS (Interfaz de usuario reactiva).

## Requisitos Previos
*   Python 3.10+
*   Node.js 18+
*   PostgreSQL 14+

## Instrucciones de Ejecución Local
*(Nota: Estas instrucciones se detallarán con los comandos exactos una vez finalizada la configuración de los entornos).*

### 1. Levantar el Backend (Django)
1. Clonar el repositorio.
2. Crear un entorno virtual e instalar dependencias: `pip install -r backend/requirements.txt`
3. Configurar variables de entorno (base de datos).
4. Ejecutar migraciones: `python manage.py migrate`
5. Iniciar servidor: `python manage.py runserver`

### 2. Levantar el Frontend (Next.js)
1. Navegar a la carpeta `frontend`.
2. Instalar dependencias: `npm install`
3. Iniciar el servidor de desarrollo: `npm run dev`