import React, { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { WidgetContainer } from './WidgetContainer'

const VALUES_BY_MONTH = [
  { name: 'Respeto',        emoji: '🤝', desc: 'Trato digno a todos' },         // Enero
  { name: 'Amor y amistad', emoji: '💖', desc: 'Cuidar de los demás' },         // Febrero
  { name: 'Igualdad',       emoji: '⚖️', desc: 'Mismos derechos para todos' },  // Marzo
  { name: 'Limpieza',       emoji: '🌿', desc: 'Cuido mi entorno' },            // Abril
  { name: 'Gratitud',       emoji: '🙏', desc: 'Agradezco lo que tengo' },      // Mayo
  { name: 'Honestidad',     emoji: '✨', desc: 'Digo siempre la verdad' },      // Junio
  { name: 'Esfuerzo',       emoji: '💪', desc: 'Doy lo mejor de mí' },          // Julio
  { name: 'Responsabilidad',emoji: '🎯', desc: 'Cumplo mis compromisos' },      // Agosto
  { name: 'Identidad',      emoji: '🌎', desc: 'Reconozco quien soy' },         // Septiembre
  { name: 'Tolerancia',     emoji: '🕊️', desc: 'Acepto las diferencias' },     // Octubre
  { name: 'Solidaridad',    emoji: '🤲', desc: 'Ayudo a los demás' },           // Noviembre
  { name: 'Paz',            emoji: '☮️', desc: 'Convivencia armónica' },       // Diciembre
]

export function ClockWidget({ isDark }) {
  const [now, setNow] = useState(new Date())
  
  const defaultMonthValue = VALUES_BY_MONTH[new Date().getMonth()]
  const [monthValue, setMonthValue] = useState(defaultMonthValue)
  const [editingValue, setEditingValue] = useState(false)
  const [valueDraft, setValueDraft] = useState({ name: defaultMonthValue.name, emoji: defaultMonthValue.emoji, desc: defaultMonthValue.desc })

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-slate-500'} text-center capitalize`}>
        {now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="text-5xl md:text-6xl xl:text-7xl font-bold tabular-nums tracking-tight leading-none" style={{ fontFeatureSettings: '"tnum"' }}>
          {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className={`text-lg tabular-nums ${isDark ? 'text-white/50' : 'text-slate-400'} mt-1`}>{String(now.getSeconds()).padStart(2,'0')}s</div>
      </div>
      <div className={`mt-2 w-full rounded-xl px-3 py-2 ${isDark ? 'bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-300/30' : 'bg-gradient-to-r from-amber-100 to-pink-100 border border-amber-200'} flex items-center gap-2 group`}>
        <div className="text-2xl flex-shrink-0">{monthValue.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>Valor del mes</div>
          <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{monthValue.name}</div>
          <div className={`text-[10px] ${isDark ? 'text-white/70' : 'text-slate-600'} truncate`}>{monthValue.desc}</div>
        </div>
        <Button size="icon" variant="ghost" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setValueDraft({ name: monthValue.name, emoji: monthValue.emoji, desc: monthValue.desc }); setEditingValue(true) }} className={`h-7 w-7 flex-shrink-0 ${isDark ? 'hover:bg-white/10 text-white' : ''}`} title="Cambiar valor">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Dialog open={editingValue} onOpenChange={setEditingValue}>
        <DialogContent className="sm:max-w-[480px]" onPointerDownCapture={e => e.stopPropagation()} onKeyDownCapture={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>✨ Valor del mes</DialogTitle>
            <DialogDescription>Elige un valor predefinido o personaliza el tuyo</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-2 block">Valores sugeridos</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {VALUES_BY_MONTH.map((v, i) => {
                  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
                  return (
                    <button key={i} onClick={() => setValueDraft(v)} className={`p-2.5 rounded-xl border text-left transition-all ${valueDraft.name === v.name ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/30'}`}>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{v.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] uppercase font-semibold text-slate-400">{months[i]}</div>
                          <div className="font-semibold text-slate-900 text-sm">{v.name}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Label className="text-xs font-semibold mb-2 block">O crea uno personalizado</Label>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <Input className="text-center text-2xl" value={valueDraft.emoji} onChange={e => setValueDraft({...valueDraft, emoji: e.target.value})} placeholder="✨" />
                <Input value={valueDraft.name} onChange={e => setValueDraft({...valueDraft, name: e.target.value})} placeholder="Valor (ej. Empatía)" />
              </div>
              <Input className="mt-2" value={valueDraft.desc} onChange={e => setValueDraft({...valueDraft, desc: e.target.value})} placeholder="Descripción breve" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingValue(false)}>Cancelar</Button>
            <Button onClick={() => { setMonthValue(valueDraft); setEditingValue(false); toast.success('Valor actualizado ✓') }} className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white">Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
