'use client'

import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { TopBar } from '@/components/layout/TopBar'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useProfile } from '@/contexts/ProfileContext'

const LEVELS = ['Preescolar','Primaria','Secundaria','Preparatoria','Universidad','Otro']
const SHIFTS = ['Matutino','Vespertino','Mixto']
const DEFAULT_TERM_DATES = {
  t1: { start_month: 8, end_month: 11 },
  t2: { start_month: 12, end_month: 3 },
  t3: { start_month: 4, end_month: 7 }
}

export default function SettingsPage() {
  const { profile, updateProfile } = useProfile()
  const [form, setForm] = useState(profile || {})

  useEffect(() => { setForm(profile || {}) }, [profile])

  const td = form.term_dates || DEFAULT_TERM_DATES
  const setTD = (k, field, val) => setForm({ ...form, term_dates: { ...td, [k]: { ...td[k], [field]: Number(val) } } })
  const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  const save = async () => {
    try {
      const p = await api('profile', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Configuración guardada')
      updateProfile(p)
    } catch (e) { toast.error(e.message) }
  }

  const wipeAll = async () => {
    if (!confirm('⚠️ ¿Borrar TODOS tus datos? (Grupos, alumnos, actividades, etc.) Esta acción no se puede deshacer.')) return
    await api('profile/delete', { method: 'POST' })
    toast.success('Datos borrados. Recargando...')
    setTimeout(() => window.location.reload(), 1000)
  }

  return (
    <div>
      <TopBar title="Configuración" subtitle="Personaliza tu perfil y los trimestres del ciclo escolar" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-slate-100">
          <CardHeader><CardTitle className="text-base">Perfil del docente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Nombre completo</Label><Input className="mt-1" value={form.full_name || ''} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
              <div><Label className="text-xs font-semibold">Nombre a mostrar</Label><Input className="mt-1" value={form.display_name || ''} onChange={e => setForm({...form, display_name: e.target.value})} /></div>
            </div>
            <div><Label className="text-xs font-semibold">Escuela</Label><Input className="mt-1" value={form.school_name || ''} onChange={e => setForm({...form, school_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Nivel educativo</Label>
                <Select value={form.education_level || 'Primaria'} onValueChange={v => setForm({...form, education_level: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs font-semibold">Turno</Label>
                <Select value={form.shift || 'Matutino'} onValueChange={v => setForm({...form, shift: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs font-semibold">Materias que impartes</Label><Input className="mt-1" value={form.subjects || ''} onChange={e => setForm({...form, subjects: e.target.value})} /></div>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader><CardTitle className="text-base flex items-center gap-2">📅 Trimestres del ciclo escolar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">Define el rango de meses de cada trimestre. Se asignará automáticamente a actividades y planeaciones según su fecha.</p>
            {[
              { key: 't1', label: 'Trimestre 1', color: 'sky' },
              { key: 't2', label: 'Trimestre 2', color: 'emerald' },
              { key: 't3', label: 'Trimestre 3', color: 'amber' },
            ].map(t => (
              <div key={t.key} className={`p-3 rounded-xl bg-${t.color}-50 border border-${t.color}-100`}>
                <div className={`text-xs font-bold text-${t.color}-700 mb-2 uppercase tracking-wide`}>{t.label}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-slate-500">Mes inicio</Label>
                    <Select value={String(td[t.key].start_month)} onValueChange={v => setTD(t.key, 'start_month', v)}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-slate-500">Mes fin</Label>
                    <Select value={String(td[t.key].end_month)} onValueChange={v => setTD(t.key, 'end_month', v)}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setForm({...form, term_dates: DEFAULT_TERM_DATES})} className="text-xs">
              ↺ Restablecer a default SEP (T1 Ago-Nov, T2 Dic-Mar, T3 Abr-Jul)
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 flex justify-between items-center">
          <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">Guardar cambios</Button>
          <Button onClick={wipeAll} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Borrar todos mis datos</Button>
        </div>
      </div>
    </div>
  )
}
