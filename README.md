🏫 MI AULA DIGITAL

MI AULA DIGITAL es una plataforma integral diseñada para facilitar la labor diaria de los docentes. Centraliza la gestión de grupos, alumnos, calificaciones, reportes, comportamiento y planeaciones didácticas en una interfaz moderna y eficiente.

Una de las características más destacadas de este proyecto es su capacidad para generar planeaciones didácticas automatizadas conectándose a flujos de inteligencia artificial (n8n + Gemini/OpenAI), tomando en cuenta los temarios específicos de cada grado y materia.

✨ Características Principales

Gestión de Grupos y Alumnos: Crea grupos, inscribe alumnos y lleva un control detallado de su asistencia y progreso.

Calificaciones y Rúbricas: Asigna calificaciones fácilmente y utiliza rúbricas personalizadas para una evaluación transparente.

Gestor de Comportamiento: Registra incidencias, reportes y envía notificaciones automáticas o pre-formateadas a padres de familia.

Planeaciones Didácticas (IA): Generador de planeaciones paso a paso, automatizado mediante Webhooks (n8n) para crear guiones de clase detallados basados en el temario del grupo.

Temarios (Curriculum): Módulo para que los docentes suban los temarios por materia y grado, los cuales alimentan al generador de planeaciones de IA.

🛠️ Tecnologías Utilizadas

Frontend: Next.js (React), Tailwind CSS.

Backend: API Routes de Next.js.

Base de Datos: MongoDB.

Automatización/IA: Webhooks conectados a n8n procesando prompts con Gemini Flash.

🚀 Instalación y Configuración Local

Sigue estos pasos para correr el proyecto en tu máquina local.

1. Clonar el repositorio

git clone [URL_DE_TU_REPOSITORIO]
cd mi-aula-digital


2. Instalar dependencias

npm install


3. Configurar Variables de Entorno

Crea un archivo .env o .env.local en la raíz del proyecto. Deberás configurar las siguientes variables:

# URL de conexión a tu base de datos MongoDB
MONGODB_URI="mongodb://mi_aula_user:NiwGVaH0Lnar1ZoD@ac-xmsztqg-shard-00-00.wcbts3d.mongodb.net:27017,ac-xmsztqg-shard-00-01.wcbts3d.mongoMONGODB_URI: db.net:27017,ac-xmsztqg-shard-00-02.wcbts3d.mongodb.net:27017/?ssl=true&replicaSet=atlas-8ysv1n-shard-0&authSource=admin&appName=Cluster0"

# URL de tu Webhook en n8n para la generación de planeaciones
N8N_WEBHOOK_URL="[https://rebecagjaramillo.app.n8n.cloud/webhook-test/generar-planeacion]"

# Otras variables necesarias para tu proyecto (ej. JWT, Auth)


4. Levantar el servidor de desarrollo

npm run dev


El proyecto estará disponible en http://localhost:3000.

🤖 Configuración del Flujo de IA (n8n)

Para que el botón de "Generar con IA" en el módulo de planeaciones funcione:

Asegúrate de tener un flujo en n8n escuchando en la URL configurada en N8N_WEBHOOK_URL.

El Webhook de n8n debe ser de tipo POST.

El flujo debe procesar el JSON recibido (que incluye materia, grado, tema y temario) y enviarlo a un nodo HTTP Request hacia Gemini (o un nodo de OpenAI).

El flujo debe terminar con un nodo Respond to Webhook devolviendo la planeación en formato JSON estricto (objective, learning_goal, start_activity, etc.).

📝 Próximos Pasos (Roadmap)

[ ] Perfeccionamiento de las plantillas de PDF para reportes de alumnos.

[ ] Exportación avanzada de planeaciones generadas por IA.

[ ] Integración de módulos de mensajería directa con padres.

Desarrollado con pasión para mejorar la educación.