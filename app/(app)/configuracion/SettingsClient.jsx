'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageLayout } from '@/components/layout/PageLayout'
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
const TITLES_BY_GENDER = {
  M: ['Prof.', 'Mtro.', 'Dr.', 'Ing.', 'Lic.'],
  F: ['Profa.', 'Mtra.', 'Dra.', 'Ing.', 'Lic.'],
  O: ['Prof/a.', 'Mtro/a.', 'Dr/a.', 'Ing.', 'Lic.']
}

export function SettingsClient({ serverProfile }) {
  const router = useRouter()
  const { profile, updateProfile } = useProfile()
  
  // Use context profile if available, otherwise fallback to serverProfile
  const activeProfile = profile || serverProfile || {}
  
  const [form, setForm] = useState(activeProfile)
  const [newLevel, setNewLevel] = useState('')
  const levels = Array.isArray(activeProfile.education_levels) ? activeProfile.education_levels : []

  const addLevel = async () => {
    if (!newLevel.trim()) return
    const n = newLevel.trim()
    if (levels.includes(n)) return
    const newList = [...levels, n]
    try {
      const p = await api('profile', { method: 'POST', body: JSON.stringify({ education_levels: newList }) })
      updateProfile(p)
      setNewLevel('')
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const removeLevel = async (lv) => {
    if (!confirm(`¿Eliminar nivel "${lv}"?`)) return
    const newList = levels.filter(l => l !== lv)
    try {
      const p = await api('profile', { method: 'POST', body: JSON.stringify({ education_levels: newList }) })
      updateProfile(p)
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }

  useEffect(() => { 
    setForm(activeProfile) 
  }, [activeProfile])

  const td = form.term_dates || DEFAULT_TERM_DATES
  const setTD = (k, field, val) => setForm({ ...form, term_dates: { ...td, [k]: { ...td[k], [field]: Number(val) } } })
  const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  const save = async () => {
    try {
      const p = await api('profile', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Configuración guardada')
      updateProfile(p)
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }

  const wipeAll = async () => {
    if (!confirm('⚠️ ¿Borrar TODOS tus datos? (Grupos, alumnos, actividades, etc.) Esta acción no se puede deshacer.')) return
    try {
      await api('profile/delete', { method: 'POST' })
      toast.success('Datos borrados. Recargando...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <PageLayout title="Configuración" subtitle="Personaliza tu perfil y los trimestres del ciclo escolar">
      <div className="max-w-3xl mx-auto space-y-5">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader><CardTitle className="text-base">Perfil del docente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label htmlFor="full_name" className="text-xs font-semibold">Nombre completo</Label><Input id="full_name" className="mt-1" value={form.full_name || ''} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
              <div><Label htmlFor="display_name" className="text-xs font-semibold">Nombre a mostrar</Label><Input id="display_name" className="mt-1" value={form.display_name || ''} onChange={e => setForm({...form, display_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label htmlFor="gender" className="text-xs font-semibold">Género</Label>
                <Select value={form.gender || ''} onValueChange={v => setForm({...form, gender: v})}>
                  <SelectTrigger id="gender" className="mt-1"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="O">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="title" className="text-xs font-semibold">Título Profesional</Label>
                <Select value={form.title || ''} onValueChange={v => setForm({...form, title: v})} disabled={!form.gender}>
                  <SelectTrigger id="title" className="mt-1"><SelectValue placeholder={form.gender ? "Selecciona..." : "Elige un género"} /></SelectTrigger>
                  <SelectContent>
                    {form.gender && TITLES_BY_GENDER[form.gender]?.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label htmlFor="school_name" className="text-xs font-semibold">Escuela</Label><Input id="school_name" className="mt-1" value={form.school_name || ''} onChange={e => setForm({...form, school_name: e.target.value})} /></div>
              <div><Label htmlFor="shift" className="text-xs font-semibold">Turno</Label>
                <Select value={form.shift || 'Matutino'} onValueChange={v => setForm({...form, shift: v})}>
                  <SelectTrigger id="shift" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label htmlFor="subjects" className="text-xs font-semibold">Materias que impartes</Label><Input id="subjects" className="mt-1" value={form.subjects || ''} onChange={e => setForm({...form, subjects: e.target.value})} /></div>

            <div>
              <Label htmlFor="newLevel" className="text-xs font-semibold">Niveles escolares</Label>
              <p className="text-xs text-slate-500 mt-1 mb-2">Agrega los niveles educativos correspondientes a tu actividad docente.</p>
              <div className="space-y-2">
                {levels.length === 0 ? (
                  <div className="text-sm text-slate-500 py-2">Sin niveles configurados.</div>
                ) : levels.map(lv => (
                  <div key={lv} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-sm font-medium">{lv}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-100" onClick={() => removeLevel(lv)} aria-label={`Eliminar nivel ${lv}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <Input id="newLevel" placeholder="Ej. 2do Primaria" value={newLevel} onChange={e => setNewLevel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLevel() }} />
                <Button onClick={addLevel} className="bg-sky-500 hover:bg-sky-600 px-3"><Plus className="w-4 h-4 mr-1.5" /> Agregar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`start_${t.key}`} className="text-2xs uppercase tracking-wide text-slate-500">Mes inicio</Label>
                    <Select value={String(td[t.key].start_month)} onValueChange={v => setTD(t.key, 'start_month', v)}>
                      <SelectTrigger id={`start_${t.key}`} className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`end_${t.key}`} className="text-2xs uppercase tracking-wide text-slate-500">Mes fin</Label>
                    <Select value={String(td[t.key].end_month)} onValueChange={v => setTD(t.key, 'end_month', v)}>
                      <SelectTrigger id={`end_${t.key}`} className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
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

        <Card className="border-rose-100 bg-rose-50/30">
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-rose-700"><AlertTriangle className="w-5 h-5" /> Zona de Peligro</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 mb-4">Esta acción eliminará de forma permanente tu cuenta, grupos, alumnos y actividades. No se puede deshacer.</p>
            <Button onClick={wipeAll} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 w-full md:w-auto"><Trash2 className="w-4 h-4 mr-1.5" /> Borrar todos mis datos</Button>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 border-t border-slate-100 pb-8">
          <Button onClick={save} className="bg-sky-500 hover:bg-sky-600 shadow-sm w-full md:w-auto px-8"><Save className="w-4 h-4 mr-1.5" /> Guardar configuración</Button>
        </div>
      </div>
    </PageLayout>
  )
}
