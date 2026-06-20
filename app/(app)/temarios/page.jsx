'use client'

import { useState, useEffect } from 'react'
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
import { TopBar } from '@/components/layout/TopBar'
import { toast } from 'sonner'
import { api } from '@/lib/api'

const TOPIC_STATUSES = [
  { value: 'no_iniciado', label: 'No iniciado', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'en_curso',    label: 'En curso',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'visto',       label: 'Visto',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'reforzar',    label: 'Reforzar',    color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'evaluado',    label: 'Evaluado',    color: 'bg-sky-100 text-sky-700 border-sky-200' },
]

export default function CurriculumPage() {
  const [units, setUnits] = useState([])
  const [filterSubject, setFilterSubject] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [unitOpen, setUnitOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [unitForm, setUnitForm] = useState({ title: '', description: '', subject: '', grade: '' })

  const load = () => {
    let q = ''
    if (filterSubject) q += '?subject=' + encodeURIComponent(filterSubject)
    if (filterGrade) q += (q ? '&' : '?') + 'grade=' + encodeURIComponent(filterGrade)
    api('curriculum/units' + q).then(setUnits).catch(e => toast.error(e.message))
  }
  useEffect(() => { load() }, [filterSubject, filterGrade])

  const openCreateUnit = () => { setEditingUnit(null); setUnitForm({ title: '', description: '', subject: filterSubject, grade: filterGrade }); setUnitOpen(true) }
  const openEditUnit = (u) => { setEditingUnit(u); setUnitForm({ title: u.title, description: u.description, subject: u.subject, grade: u.grade }); setUnitOpen(true) }
  const saveUnit = async () => {
    if (!unitForm.title.trim()) return toast.error('Pon un título')
    try {
      if (editingUnit) await api('curriculum/units/' + editingUnit.id, { method: 'PUT', body: JSON.stringify(unitForm) })
      else await api('curriculum/units', { method: 'POST', body: JSON.stringify(unitForm) })
      toast.success(editingUnit ? 'Unidad actualizada' : 'Unidad creada')
      setUnitOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const removeUnit = async (u) => { if (!confirm('¿Eliminar unidad y sus temas?')) return; await api('curriculum/units/' + u.id, { method: 'DELETE' }); load() }
  const addTopic = async (unit_id) => {
    const title = prompt('Título del tema:')
    if (!title) return
    await api('curriculum/topics', { method: 'POST', body: JSON.stringify({ unit_id, title }) })
    load()
  }
  const updateTopic = async (id, patch) => { await api('curriculum/topics/' + id, { method: 'PUT', body: JSON.stringify(patch) }); load() }
  const removeTopic = async (id) => { if (!confirm('¿Eliminar tema?')) return; await api('curriculum/topics/' + id, { method: 'DELETE' }); load() }

  const allTopics = units.flatMap(u => u.topics || [])
  const totalTopics = allTopics.length
  const seenTopics = allTopics.filter(t => t.status === 'visto' || t.status === 'evaluado').length
  const progress = totalTopics ? Math.round(seenTopics / totalTopics * 100) : 0

  return (
    <div>
      <TopBar
        title="Temarios"
        subtitle="Organiza unidades y temas por materia y grado. Marca tu avance."
        action={<Button onClick={openCreateUnit} className="bg-sky-500 hover:bg-sky-600 shadow-md"><Plus className="w-4 h-4 mr-1.5" /> Nueva unidad</Button>}
      />

      <Card className="border-slate-100 mb-4">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs font-semibold">Filtrar por materia</Label>
            <Input className="mt-1" placeholder="Ej. Matemáticas" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} />
          </div>
          <div className="min-w-[140px]">
            <Label className="text-xs font-semibold">Grado</Label>
            <Input className="mt-1" placeholder="Ej. 5°" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} />
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 min-w-[200px]">
            <div className="text-xs font-semibold text-emerald-700">Avance general</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-sm font-bold text-emerald-700">{progress}%</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{seenTopics} de {totalTopics} temas vistos</div>
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
                        {u.grade && <Badge variant="outline">{u.grade}</Badge>}
                      </div>
                      {u.description && <p className="text-xs text-slate-500">{u.description}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">{seen}/{total} temas</div>
                      <Progress value={pct} className="h-1.5 w-24 mt-1" />
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditUnit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => removeUnit(u)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
                            <SelectTrigger className={`h-7 text-[11px] w-[120px] border ${status.color}`}><SelectValue /></SelectTrigger>
                            <SelectContent>{TOPIC_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-rose-500" onClick={() => removeTopic(t.id)}><Trash2 className="w-3 h-3" /></Button>
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
              <Label className="text-xs font-semibold">Título *</Label>
              <Input className="mt-1" value={unitForm.title} onChange={e => setUnitForm({...unitForm, title: e.target.value})} placeholder="Ej. Unidad 1: Números naturales" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Descripción</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={unitForm.description} onChange={e => setUnitForm({...unitForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Materia</Label>
                <Input className="mt-1" value={unitForm.subject} onChange={e => setUnitForm({...unitForm, subject: e.target.value})} placeholder="Ej. Matemáticas" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Grado</Label>
                <Input className="mt-1" value={unitForm.grade} onChange={e => setUnitForm({...unitForm, grade: e.target.value})} placeholder="Ej. 5°" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitOpen(false)}>Cancelar</Button>
            <Button onClick={saveUnit} className="bg-sky-500 hover:bg-sky-600">{editingUnit ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
