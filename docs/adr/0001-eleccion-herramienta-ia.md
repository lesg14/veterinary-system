# ADR 001: Elección de GitHub Copilot como Herramienta Única de Inteligencia Artificial

## Fecha
2026-09-18

## Contexto
Se requiere construir un sistema de agendamiento para una clínica veterinaria en un plazo de una semana, haciendo uso obligatorio de herramientas de IA. El flujo de trabajo exige alta velocidad de desarrollo, integración fluida con la estructura del proyecto y disponibilidad garantizada para evitar cuellos de botella durante las jornadas de programación.

## Decisión
Se elige **GitHub Copilot** como herramienta de Inteligencia Artificial para todo el ciclo de desarrollo del proyecto.

## Justificación y Alternativas Descartadas

La elección de GitHub Copilot como herramienta exclusiva se basa en su integración nativa con el entorno de desarrollo (IDE) y el acceso sin restricciones de costo mediante el beneficio académico (GitHub Student Developer Pack). Se descartan las demás alternativas por los siguientes motivos:

*   **Claude (Web Chat):** Descartado debido al costo de fricción. Trabajar en la interfaz web implica copiar y pasar código manualmente entre el navegador y el editor de código, dado que su agente de terminal requiere un plan de pago . Además, la capa gratuita del chat web impone límites de mensajes estrictos que corren el riesgo de agotarse en sesiones largas de depuración.
*   **Gemini (Chat Web):** Descartado para la generación de código por la falta de conciencia nativa del espacio de trabajo. Aunque es útil para ideación conceptual, no puede inspeccionar de forma automática la estructura de modelos ni los componentes directamente en el editor.
*   **Codex (ChatGPT Free):** Descartado por limitaciones de cuota. El acceso en la cuenta gratuita de ChatGPT está diseñado para uso ocasional , lo que representa un alto riesgo de suspensión del servicio a mitad de la semana por superar el límite de peticiones.

**¿Por qué GitHub Copilot supera a los demás en este proyecto?**
Copilot permite cargar directamente los archivos del repositorio (como los modelos del backend y los componentes del frontend) en su panel de chat y agente dentro de VS Code. Al contar con la verificación del beneficio de estudiante, se asegura autocompletado ilimitado en tiempo real y capacidad agéntica dentro del editor sin costo económico, optimizando el tiempo de entrega de la prueba.

## Consecuencias

*   **Positivas:**
    *   **Flujo continuo:** Toda la generación, refactorización y solución de errores ocurren dentro del IDE sin cambiar de ventana.
    *   **Comprensión del repositorio:** Copilot lee automáticamente archivos clave como `AGENTS.md` e inyecta las reglas del proyecto directamente en las sugerencias de código.
    *   **Sostenibilidad de cuota:** Se elimina la incertidumbre de quedar bloqueado a mitad de semana por agotamiento de créditos .

*   **Negativas y Riesgos (Mitigación):**
    *   **Punto único de falla:** Al depender de una sola herramienta, un fallo masivo en los servidores de GitHub interrumpiría el flujo de trabajo asistido.
    *   **Aceptación pasiva de código:** La inmediatez del autocompletado puede inducir a aceptar lógica defectuosa. Se mitigará aplicando revisión manual obligatoria a cada método generado, especialmente en la validación de solapamiento de horarios y bloqueo de mascotas fallecidas .