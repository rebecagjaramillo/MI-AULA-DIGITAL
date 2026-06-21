import './globals.css'
import { Toaster } from 'sonner'
import { SessionProviderWrapper } from '@/components/providers/SessionProviderWrapper'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'

export const metadata = {
  title: 'MI AULA DIGITAL',
  description: 'Plataforma integral para docentes: grupos, asistencia, planeaciones y más.',
  openGraph: {
    title: 'MI AULA DIGITAL',
    description: 'Plataforma integral para docentes: gestiona tus grupos, calificaciones, y asistencia con facilidad.',
    url: 'https://miauladigital.com',
    siteName: 'MI AULA DIGITAL',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MI AULA DIGITAL - Dashboard',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MI AULA DIGITAL',
    description: 'Gestión escolar inteligente y moderna para docentes.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
        <SessionProviderWrapper>
          <ReactQueryProvider>
            <GlobalErrorBoundary>
              {children}
            </GlobalErrorBoundary>
            <Toaster position="top-right" richColors />
          </ReactQueryProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
