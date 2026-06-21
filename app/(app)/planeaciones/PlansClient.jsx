'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Pencil, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { todayISO } from '@/lib/helpers'
import { PageLayout } from '@/components/layout/PageLayout'
import { useStore } from '@/store/useStore'
import { useProfile } from '@/contexts/ProfileContext'

const PLAN_STATUSES = [
  { value: 'borrador',          label: 'Borrador',   color: 'bg-slate-100 text-slate-600' },
  { value: 'planeada',          label: 'Planeada',   color: 'bg-sky-100 text-sky-700' },
  { value: 'impartida',         label: 'Impartida',  color: 'bg-emerald-100 text-emerald-700' },
  { value: 'requiere_refuerzo', label: 'Reforzar',   color: 'bg-amber-100 text-amber-700' },
  { value: 'evaluada',          label: 'Evaluada',   color: 'bg-violet-100 text-violet-700' },
]

export function PlansClient({ serverPlans }) {
  const router = useRouter()
  const groups = useStore(s => s.groups)
  const { profile, activeSubject } = useProfile()
  
  const filteredGroups = activeSubject ? groups.filter(g => g.subject === activeSubject) : groups
  
  const plans = serverPlans || []
  const filteredPlans = activeSubject 
    ? plans.filter(p => p.subject === activeSubject || (p.group_id && filteredGroups.some(g => g.id === p.group_id))) 
    : plans
    
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [generating, setGenerating] = useState(false)
  const emptyForm = { group_id: null, subject: '', grade: '', topic: '', title: '', date: todayISO(), duration_minutes: 50, objective: '', learning_goal: '', start_activity: '', development_activity: '', closing_activity: '', materials: '', evaluation: '', accommodations: '', observations: '', status: 'borrador' }
  const [form, setForm] = useState(emptyForm)
  const [levelNotes, setLevelNotes] = useState('')

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, subject: activeSubject || '' }); setLevelNotes(''); setOpen(true) }
  const openEdit = (p) => { setEditing(p); setForm({ ...p, group_id: p.group_id || null }); setOpen(true) }
  
  const save = async () => {
    if (!form.topic && !form.title) return toast.error('Pon un tema o título')
    try {
      const body = { ...form, title: form.title || form.topic }
      if (editing) await api('lesson-plans/' + editing.id, { method: 'PUT', body: JSON.stringify(body) })
      else await api('lesson-plans', { method: 'POST', body: JSON.stringify(body) })
      toast.success(editing ? 'Planeación guardada' : 'Planeación creada')
      setOpen(false)
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const remove = async (p) => { 
    if (!confirm('¿Eliminar planeación?')) return
    try {
      await api('lesson-plans/' + p.id, { method: 'DELETE' })
      toast.success('Planeación eliminada')
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const generateAI = async () => {
    if (!form.subject || !form.topic) return toast.error('Materia y tema son requeridos para la IA')
    setGenerating(true)
    try {
      const res = await api('lesson-plans/generate-ai', { method: 'POST', body: JSON.stringify({
        subject: form.subject, grade: form.grade, topic: form.topic,
        learning_goal: form.learning_goal, duration_minutes: form.duration_minutes,
        level_notes: levelNotes,
      })})
      setForm(f => ({ ...f, ...res.generated, title: f.title || form.topic }))
      toast.success('✨ Planeación generada con IA')
    } catch (e) { toast.error(e.message) }
    finally { setGenerating(false) }
  }
  
  const exportPDF = async (p) => {
    try {
      const mod = await import('@/lib/pdfReports')
      const group = groups.find(g => g.id === p.group_id) || { grade: p.grade, group_name: '', subject: p.subject, school_year: '' }
      const doc = await mod.generateLessonPlanPDF({ profile, plan: p, group })
      doc.save(`Planeacion_${(p.title || p.topic || 'sin_titulo').replace(/\s+/g,'_')}.pdf`)
      toast.success('PDF descargado ✓')
    } catch (e) { toast.error('Error PDF: ' + e.message) }
  }

  const onGroupChange = (gid) => {
    const g = groups.find(gg => gg.id === gid)
    setForm(f => ({ ...f, group_id: gid, subject: g?.subject || f.subject, grade: g?.grade || f.grade }))
  }

  return (
    <PageLayout
      title="Planeaciones de clase"
      subtitle="Crea planeaciones manuales o genéralas con IA en segundos"
      action={<Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 shadow-md text-white"><Sparkles className="w-4 h-4 mr-1.5" /> Nueva planeación</Button>}
    >

      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{plans.length === 0 ? 'Crea tu primera planeación' : 'No hay planeaciones para esta materia'}</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">{plans.length === 0 ? 'Usa IA para generar planeaciones detalladas en segundos' : 'Cambia de materia o crea una nueva planeación'}</p>
          <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white"><Sparkles className="w-4 h-4 mr-1.5" /> Nueva planeación con IA</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map(p => {
            const st = PLAN_STATUSES.find(s => s.value === p.status) || PLAN_STATUSES[0]
            return (
              <Card key={p.id} className="border-slate-100 hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <Badge className={`${st.color} hover:${st.color} mb-2`}>{st.label}</Badge>
                      <h3 className="font-bold text-slate-900 leading-tight">{p.title || p.topic}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {[p.subject, p.grade, new Date(p.date).toLocaleDateString('es-MX'), `${p.duration_minutes} min`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  {p.objective && <p className="text-xs text-slate-600 line-clamp-2 mb-3 italic">"{p.objective}"</p>}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                    <Button onClick={() => openEdit(p)} size="sm" variant="outline" className="flex-1"><Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar</Button>
                    <Button onClick={() => exportPDF(p)} size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600"><FileText className="w-3.5 h-3.5 mr-1.5" /> PDF</Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => remove(p)} aria-label="Eliminar planeación"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              {editing ? 'Editar planeación' : 'Nueva planeación'}
            </DialogTitle>
            <DialogDescription>Completa los datos básicos y genera el resto con IA, o llénala manualmente</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label htmlFor="topic" className="text-xs font-semibold">Tema *</Label>
                <Input id="topic" className="mt-1" placeholder="Ej. Fracciones equivalentes" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="date" className="text-xs font-semibold">Fecha</Label>
                <Input id="date" type="date" className="mt-1" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="duration_minutes" className="text-xs font-semibold">Duración (min)</Label>
                <Input id="duration_minutes" type="number" className="mt-1" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="group_id" className="text-xs font-semibold">Grupo</Label>
                <Select value={form.group_id || 'none'} onValueChange={v => onGroupChange(v === 'none' ? null : v)}>
                  <SelectTrigger id="group_id" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin grupo —</SelectItem>
                    {filteredGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.grade} {g.group_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject" className="text-xs font-semibold">Materia *</Label>
                <Input id="subject" className="mt-1" placeholder="Matemáticas" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="grade" className="text-xs font-semibold">Grado</Label>
                <Input id="grade" className="mt-1" placeholder="5°" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="status" className="text-xs font-semibold">Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger id="status" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLAN_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="levelNotes" className="text-xs font-semibold text-violet-700">✨ Generar con IA</Label>
                  <Input id="levelNotes" className="mt-1 bg-white" placeholder="Notas opcionales del grupo (nivel, contexto...)" value={levelNotes} onChange={e => setLevelNotes(e.target.value)} />
                </div>
                <Button onClick={generateAI} disabled={generating || !form.subject || !form.topic} className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-md self-end">
                  <Sparkles className="w-4 h-4 mr-1.5" /> {generating ? 'Generando...' : 'Generar planeación'}
                </Button>
              </div>
              <div className="text-xs text-violet-700/80 mt-2">Requiere materia y tema. La IA rellenará objetivo, inicio, desarrollo, cierre, materiales, evaluación y adecuaciones.</div>
            </div>

            <div>
              <Label htmlFor="objective" className="text-xs font-semibold">Objetivo</Label>
              <Textarea id="objective" rows={2} className="mt-1 resize-none" value={form.objective} onChange={e => setForm({...form, objective: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="learning_goal" className="text-xs font-semibold">Aprendizaje esperado</Label>
              <Textarea id="learning_goal" rows={2} className="mt-1 resize-none" value={form.learning_goal} onChange={e => setForm({...form, learning_goal: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="start_activity" className="text-xs font-semibold text-sky-700">🟢 Inicio</Label>
                <Textarea id="start_activity" rows={5} className="mt-1 resize-none" value={form.start_activity} onChange={e => setForm({...form, start_activity: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="development_activity" className="text-xs font-semibold text-amber-700">🟡 Desarrollo</Label>
                <Textarea id="development_activity" rows={5} className="mt-1 resize-none" value={form.development_activity} onChange={e => setForm({...form, development_activity: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="closing_activity" className="text-xs font-semibold text-violet-700">🔵 Cierre</Label>
                <Textarea id="closing_activity" rows={5} className="mt-1 resize-none" value={form.closing_activity} onChange={e => setForm({...form, closing_activity: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="materials" className="text-xs font-semibold">Materiales</Label>
                <Textarea id="materials" rows={3} className="mt-1 resize-none" value={form.materials} onChange={e => setForm({...form, materials: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="evaluation" className="text-xs font-semibold">Evaluación</Label>
                <Textarea id="evaluation" rows={3} className="mt-1 resize-none" value={form.evaluation} onChange={e => setForm({...form, evaluation: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="accommodations" className="text-xs font-semibold">Adecuaciones</Label>
                <Textarea id="accommodations" rows={3} className="mt-1 resize-none" value={form.accommodations} onChange={e => setForm({...form, accommodations: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="observations" className="text-xs font-semibold">Observaciones</Label>
                <Textarea id="observations" rows={3} className="mt-1 resize-none" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Crear planeación'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
