'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-900 text-slate-400 gap-4">
      <AlertTriangle className="w-12 h-12 text-rose-500" />
      <p className="text-sm font-medium text-slate-300">Error al cargar la pantalla: {error?.message}</p>
      <Button onClick={() => reset()} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
        Reintentar
      </Button>
    </div>
  )
}
