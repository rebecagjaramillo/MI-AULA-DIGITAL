'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de repuesto
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Registra el error en la consola para depuración
    console.error("🔥 ErrorBoundary atrapó un error:", error, errorInfo)
    
    // Captura el error y lo envía a Sentry
    Sentry.captureException(error, {
      extra: errorInfo
    })
  }

  resetError = () => {
    // Intenta limpiar el error y volver a renderizar los children
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Si se pasa una interfaz de repuesto personalizada, úsala
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Interfaz por defecto amigable
      return (
        <div className="flex flex-col items-center justify-center p-8 h-full min-h-[300px] w-full text-center bg-slate-50/50 rounded-3xl border border-rose-100">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Algo no salió como esperábamos</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Ha ocurrido un error inesperado al cargar esta sección. No te preocupes, tus datos están a salvo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => window.location.reload()} className="bg-sky-500 hover:bg-sky-600">
              <RefreshCcw className="w-4 h-4 mr-1.5" /> Recargar página
            </Button>
            <Button variant="outline" onClick={this.resetError} className="border-slate-200">
              Intentar continuar
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-6 p-4 bg-rose-50 rounded-xl text-left w-full max-w-2xl overflow-auto text-xs font-mono text-rose-800 border border-rose-200">
              <p className="font-bold mb-1">{this.state.error.toString()}</p>
              <p className="whitespace-pre-wrap opacity-70">{this.state.error.stack}</p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
