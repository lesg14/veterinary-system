# ADR 002: Arquitectura Desacoplada con Django (PostgreSQL) y Next.js

## Fecha
2026-09-18

## Estado
Aceptado

## Contexto
El sistema de la clínica veterinaria requiere manejar reglas de negocio transaccionales estrictas (cálculo de tiempos, prevención de solapamientos, restricciones por estado de la mascota) y presentar una interfaz interactiva para visualizar la agenda diaria. Con un límite estricto de una semana, la prioridad arquitectónica es minimizar el código repetitivo y maximizar el tiempo dedicado a la lógica de negocio.

## Decisión
Se establece una arquitectura cliente-servidor desacoplada utilizando **Django con PostgreSQL** para el backend y **Next.js** para el frontend. 

## Justificación Técnica y Alternativas Descartadas

### 1. Backend: Django + PostgreSQL vs. Spring Boot / Express
*   **Por qué Django y PostgreSQL:** El ORM de Django permite modelar relaciones complejas y validaciones (como el cruce de horarios y el estado vital de la mascota) directamente en la capa de datos con pocas líneas de código. Además, incluye un panel de administración nativo, lo que permite poblar la base de datos y probar el sistema desde el día 1 sin haber construido el frontend. PostgreSQL garantiza integridad relacional y un manejo robusto de zonas horarias, crítico para el cálculo de bloques de citas.
*   **Spring Boot (Java):** Descartado. Aunque es el estándar para arquitecturas empresariales de gran escala, su alta verbosidad y la necesidad de configurar extensamente repositorios, servicios y DTOs consume demasiado tiempo en una prueba de una semana.
*   **Express.js / Node.js puro:** Descartado. Obliga a tomar demasiadas decisiones manuales (elegir ORM, configurar middleware de seguridad, estructurar validaciones), mientras que Django sigue el principio de "baterías incluidas".

### 2. Frontend: Next.js vs. Angular / Vite (React puro)
*   **Por qué Next.js:** Proporciona un enrutamiento basado en sistema de archivos y configuración lista para usar con herramientas modernas (como Tailwind CSS). Esto permite construir rápidamente el componente de la agenda diaria (un calendario tipo grid), manejando el estado de la UI de manera eficiente gracias al ecosistema de React.
*   **Angular:** Descartado. Su curva de configuración inicial es pesada y es altamente estricto con su estructura. Para una prueba de concepto ágil, su nivel de opinión arquitectónica ralentiza el inicio del desarrollo.
*   **Vite + React Vanilla:** Descartado. Obligaría a configurar manualmente el enrutador (React Router) y otras herramientas base, pasos que Next.js ya resuelve por defecto.

## Consecuencias
*   **Positivas:** 
    *   **Reducción de riesgo:** Aprovechar un stack tecnológico con el que ya se tiene experiencia sólida en la construcción y despliegue de plataformas unificadas garantiza que los problemas de configuración no consumirán el tiempo de la prueba técnica.
    *   Separación clara de responsabilidades: el backend actúa como guardián estricto de las reglas de negocio y el frontend se especializa en el renderizado del calendario.
*   **Negativas (Riesgo):** 
    *   Se deben coordinar dos servidores locales independientes y gestionar las políticas de CORS. Se mitigará documentando los comandos de ejecución exactos en el `README.md`.

## Estado de implementación

Esta decisión está implementada con Django, PostgreSQL, Django REST Framework y Next.js. El backend incluye modelos, migraciones, servicios de citas, agenda diaria, historial, endpoints CRUD y pruebas automatizadas. El frontend consume la API como cliente y contiene la agenda, el historial y la administración de propietarios, mascotas y profesionales.