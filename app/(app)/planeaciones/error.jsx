'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PlansError({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-12 text-slate-700">
      <AlertTriangle className="w-12 h-12 mb-4 text-rose-500" />
      <h2 className="text-xl font-bold mb-2">Error al cargar las planeaciones</h2>
      <p className="text-sm text-slate-500 mb-6">{error?.message || 'Ha ocurrido un error inesperado.'}</p>
      <Button onClick={() => reset()} variant="outline">
        Intentar de nuevo
      </Button>
    </div>
  )
}
