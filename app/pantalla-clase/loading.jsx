import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-900 text-slate-400 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
      <p className="text-sm font-medium tracking-wide">Cargando Pantalla de Clase...</p>
    </div>
  )
}
