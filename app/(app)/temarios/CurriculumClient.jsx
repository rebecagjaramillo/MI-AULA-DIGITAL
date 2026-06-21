'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { PageLayout } from '@/components/layout/PageLayout'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useProfile } from '@/contexts/ProfileContext'
import { LEVELS_NEW } from '@/lib/constants'

const TOPIC_STATUSES = [
  { value: 'no_iniciado', label: 'No iniciado', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'en_curso',    label: 'En curso',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'visto',       label: 'Visto',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'reforzar',    label: 'Reforzar',    color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'evaluado',    label: 'Evaluado',    color: 'bg-sky-100 text-sky-700 border-sky-200' },
]

export function CurriculumClient({ serverUnits }) {
  const router = useRouter()
  const { activeSubject, profile } = useProfile()
  const customLevels = Array.isArray(profile?.education_levels) && profile.education_levels.length > 0 ? profile.education_levels : []
  
  const [filterGrade, setFilterGrade] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [unitOpen, setUnitOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [unitForm, setUnitForm] = useState({ title: '', description: '', subject: '', grade: '', level: '' })

  const allUnits = serverUnits || []
  const units = allUnits.filter(u => {
    if (activeSubject && u.subject !== activeSubject) return false
    if (filterGrade && u.grade && u.grade.toLowerCase() !== filterGrade.toLowerCase()) return false
    if (filterLevel && u.level && u.level !== filterLevel) return false
    return true
  })

  const openCreateUnit = () => { setEditingUnit(null); setUnitForm({ title: '', description: '', subject: activeSubject || '', grade: filterGrade, level: filterLevel }); setUnitOpen(true) }
  const openEditUnit = (u) => { setEditingUnit(u); setUnitForm({ title: u.title, description: u.description, subject: u.subject, grade: u.grade, level: u.level }); setUnitOpen(true) }
  
  const saveUnit = async () => {
    if (!unitForm.title.trim()) return toast.error('Pon un título')
    try {
      if (editingUnit) await api('curriculum/units/' + editingUnit.id, { method: 'PUT', body: JSON.stringify(unitForm) })
      else await api('curriculum/units', { method: 'POST', body: JSON.stringify(unitForm) })
      toast.success(editingUnit ? 'Unidad actualizada' : 'Unidad creada')
      setUnitOpen(false)
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const removeUnit = async (u) => { 
    if (!confirm('¿Eliminar unidad y sus temas?')) return
    try {
      await api('curriculum/units/' + u.id, { method: 'DELETE' })
      toast.success('Unidad eliminada')
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const addTopic = async (unit_id) => {
    const title = prompt('Título del tema:')
    if (!title) return
    try {
      await api('curriculum/topics', { method: 'POST', body: JSON.stringify({ unit_id, title }) })
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const updateTopic = async (id, patch) => { 
    try {
      await api('curriculum/topics/' + id, { method: 'PUT', body: JSON.stringify(patch) })
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const removeTopic = async (id) => { 
    if (!confirm('¿Eliminar tema?')) return
    try {
      await api('curriculum/topics/' + id, { method: 'DELETE' })
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }

  const allTopics = units.flatMap(u => u.topics || [])
  const totalTopics = allTopics.length
  const seenTopics = allTopics.filter(t => t.status === 'visto' || t.status === 'evaluado').length
  const progress = totalTopics ? Math.round(seenTopics / totalTopics * 100) : 0

  return (
    <PageLayout
      title="Temarios"
      subtitle="Organiza unidades y temas por materia y grado. Marca tu avance."
      action={<Button onClick={openCreateUnit} className="bg-sky-500 hover:bg-sky-600 shadow-md"><Plus className="w-4 h-4 mr-1.5" /> Nueva unidad</Button>}
    >

      <Card className="border-slate-100 mb-4">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center border border-sky-200/50 shadow-sm">
              <BookOpen className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">Temario actual</div>
              <div className="text-xl font-black text-slate-800 leading-tight">{activeSubject || 'Todas las materias'}</div>
            </div>
          </div>
          <div className="min-w-[140px]">
            <Label className="text-xs font-semibold">Nivel</Label>
            <Select value={filterLevel || 'all'} onValueChange={v => setFilterLevel(v === 'all' ? '' : v)}>
              <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {customLevels.length > 0 
                  ? customLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)
                  : LEVELS_NEW.map(l => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <Label className="text-xs font-semibold">Grado</Label>
            <Input className="mt-1 h-10" placeholder="Ej. 5°" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} />
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 min-w-[200px]">
            <div className="text-xs font-semibold text-emerald-700">Avance general</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-sm font-bold text-emerald-700">{progress}%</span>
            </div>
            <div className="text-2xs text-emerald-600 mt-0.5">{seenTopics} de {totalTopics} temas vistos</div>
          </div>
        </CardContent>
      </Card>

      {units.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Sin unidades aún</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">Crea tu primera unidad temática</p>
          <Button onClick={openCreateUnit} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-1.5" /> Nueva unidad</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {units.map(u => {
            const total = u.topics?.length || 0
            const seen = u.topics?.filter(t => t.status === 'visto' || t.status === 'evaluado').length || 0
            const pct = total ? Math.round(seen/total*100) : 0
            return (
              <Card key={u.id} className="border-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{u.title}</h3>
                        {u.subject && <Badge variant="outline">{u.subject}</Badge>}
                        {u.level && <Badge variant="outline">{u.level}</Badge>}
                        {u.grade && <Badge variant="outline">{u.grade}</Badge>}
                      </div>
                      {u.description && <p className="text-xs text-slate-500">{u.description}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">{seen}/{total} temas</div>
                      <Progress value={pct} className="h-1.5 w-24 mt-1" />
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditUnit(u)} aria-label="Editar unidad"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => removeUnit(u)} aria-label="Eliminar unidad"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {(u.topics || []).map(t => {
                      const status = TOPIC_STATUSES.find(s => s.value === t.status) || TOPIC_STATUSES[0]
                      return (
                        <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 group">
                          <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]?.replace('bg-','bg-')}`} style={{ background: t.status === 'visto' ? '#10b981' : t.status === 'reforzar' ? '#ef4444' : t.status === 'en_curso' ? '#f59e0b' : t.status === 'evaluado' ? '#3b82f6' : '#94a3b8' }} />
                          <span className={`flex-1 text-sm ${t.status === 'visto' || t.status === 'evaluado' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{t.title}</span>
                          <Select value={t.status} onValueChange={(v) => updateTopic(t.id, { status: v })}>
                            <SelectTrigger className={`h-7 text-xs w-[120px] border ${status.color}`}><SelectValue /></SelectTrigger>
                            <SelectContent>{TOPIC_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-rose-500" onClick={() => removeTopic(t.id)} aria-label="Eliminar tema"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      )
                    })}
                    <Button onClick={() => addTopic(u.id)} size="sm" variant="ghost" className="text-sky-600 hover:text-sky-700 h-8">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Agregar tema
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUnit ? 'Editar unidad' : 'Nueva unidad'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="title" className="text-xs font-semibold">Título *</Label>
              <Input id="title" className="mt-1" value={unitForm.title} onChange={e => setUnitForm({...unitForm, title: e.target.value})} placeholder="Ej. Unidad 1: Números naturales" />
            </div>
            <div>
              <Label htmlFor="description" className="text-xs font-semibold">Descripción</Label>
              <Textarea id="description" className="mt-1 resize-none" rows={2} value={unitForm.description} onChange={e => setUnitForm({...unitForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="subject" className="text-xs font-semibold">Materia</Label>
                <Input id="subject" className="mt-1" value={unitForm.subject || ''} onChange={e => setUnitForm({...unitForm, subject: e.target.value})} placeholder="Ej. Matemáticas" />
              </div>
              <div>
                <Label htmlFor="level" className="text-xs font-semibold">Nivel</Label>
                <Select value={unitForm.level || 'none'} onValueChange={v => setUnitForm({...unitForm, level: v === 'none' ? '' : v})}>
                  <SelectTrigger id="level" className="mt-1"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin Nivel</SelectItem>
                    {customLevels.length > 0 
                      ? customLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)
                      : LEVELS_NEW.map(l => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="grade" className="text-xs font-semibold">Grado</Label>
                <Input id="grade" className="mt-1" value={unitForm.grade || ''} onChange={e => setUnitForm({...unitForm, grade: e.target.value})} placeholder="Ej. 5°" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitOpen(false)}>Cancelar</Button>
            <Button onClick={saveUnit} className="bg-sky-500 hover:bg-sky-600">{editingUnit ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
