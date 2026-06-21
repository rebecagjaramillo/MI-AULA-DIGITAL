# 🎓 Mi Aula Digital

**Mi Aula Digital** es una plataforma educativa integral diseñada para potenciar la gestión académica. Proporciona a los docentes un entorno unificado y moderno para la gestión de grupos, control de asistencia, seguimiento de actividades y evaluaciones, facilitando la toma de decisiones basada en datos.

---

## 🛠️ Tech Stack

El sistema está construido sobre una arquitectura moderna, garantizando escalabilidad, rendimiento y mantenibilidad:

- **Framework Core:** [Next.js](https://nextjs.org/) (App Router)
- **Database:** [MongoDB](https://www.mongodb.com/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) & [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Validation:** [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)
- **Testing:** [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Observability:** [Sentry](https://sentry.io/)

---

## 🏗️ Key Architectural Decisions

El *'porqué'* detrás del proyecto. Hemos blindado la aplicación tomando las siguientes decisiones de diseño y arquitectura:

### 1. Service Layer
**Desacoplamiento de la lógica de negocio.** Hemos extraído la lógica pesada de los componentes y las rutas de API hacia una capa de servicios (`lib/services`). Esto centraliza la lógica (ej. cálculo de promedios, reglas de trimestres) permitiendo que sea testeable, reutilizable y agnóstica al framework.

### 2. Data Validation
**Zod en toda la API y formularios.** Garantizamos que los datos corruptos nunca toquen nuestra base de datos. Zod valida las solicitudes entrantes en la API y, en paralelo, interactúa sin esfuerzo con React Hook Form usando `zodResolver` para proporcionar un feedback instantáneo al usuario en el frontend.

### 3. State Management
**Zustand para estados globales atómicos y React Query para caché.** Evitamos los *re-renders* innecesarios del *Context API* migrando nuestro estado global (perfil, grupos activos) a Zustand, permitiendo a los componentes suscribirse solo a la porción de datos que necesitan. Para el estado asíncrono y comunicación con el backend, confiamos en React Query, obteniendo caché automática y estados de carga impecables.

### 4. Performance
**Code Splitting y Skeleton Screens.** Implementamos *Lazy Loading* (`next/dynamic`) en rutas secundarias y widgets pesados. Esto optimiza el *Bundle Size* reduciendo drásticamente el tiempo de carga inicial. Además, los Skeleton Screens proporcionan retroalimentación visual continua evitando "saltos" en la interfaz.

### 5. Reliability
**Error Boundaries y Sentry.** Nadie quiere una pantalla en blanco. Construimos un `GlobalErrorBoundary` que atrapa errores de renderizado en React y ofrece al usuario la opción de recargar. Simultáneamente, Sentry nos notifica del error con *Source Maps* en tiempo real, dándonos observabilidad completa para reaccionar antes de que el usuario lo reporte.

### 6. Accessibility & SEO
**Cumplimiento WCAG y Open Graph.** Hemos reemplazado los `<div>` genéricos por HTML Semántico (`<main>`, `<nav>`, `<header>`). Todos nuestros formularios son accesibles para lectores de pantalla mediante `aria-labels` e `aria-invalid`. Adicionalmente, afinamos las paletas de color para cumplir con el contraste WCAG AA/AAA y optimizamos las etiquetas de Open Graph para que la plataforma luzca impecable al compartirse.

---

## 📂 Project Structure

Un vistazo a la anatomía principal de nuestro código:

```text
mi-aula-digital/
├── __tests__/          # Pruebas unitarias y de integración (Vitest)
├── app/                # Rutas y páginas de Next.js App Router (UI & API)
├── components/         # Componentes React reutilizables (UI, Views, Layout)
├── lib/                # Utilidades y configuración core
│   ├── schemas/        # Esquemas de validación de Zod
│   ├── services/       # Lógica de negocio (Service Layer)
│   └── helpers.js      # Funciones puras de ayuda
├── store/              # Estado global de Zustand
└── vitest.config.js    # Configuración del entorno de pruebas
```

---

## 🚀 Getting Started

### Requisitos previos
- **Node.js** (v18 o superior recomendado)
- **MongoDB** (URI de conexión a una instancia local o en la nube, ej. MongoDB Atlas)

### Instrucciones de instalación

1. Clona el repositorio e instala las dependencias:

```bash
npm install
```

2. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto. **NO** compartas los valores reales. Necesitarás las siguientes variables:

```env
# Database
MONGODB_URI=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

---

## 📦 Available Scripts

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de **desarrollo** en `http://localhost:3000`. |
| `npm run build` | Compila la aplicación para **producción**. |
| `npm start` | Inicia el servidor de producción compilado. |
| `npm test` | Ejecuta la suite completa de pruebas unitarias y de interfaz con **Vitest**. |
| `npm run test:watch` | Inicia **Vitest** en modo de observación. |

---

## 🧪 Quality Assurance

La calidad es innegociable. Nuestro sistema cuenta con una batería de pruebas (`npm test`) que valida tanto la lógica de negocio profunda (`activityService`, cálculos de trimestres) como los flujos de interfaz de usuario. 

> **Integración Continua (CI/CD):** Las pruebas están diseñadas para conectarse fácilmente con tu pipeline en GitHub Actions o Vercel. Un commit no debería fusionarse sin que la terminal esté completamente en verde (✅).

---

## 🔮 Future Roadmap

