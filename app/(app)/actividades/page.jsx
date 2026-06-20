'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ListChecks, Plus, Pencil, Trash2, Calendar as CalendarIcon, Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { todayISO, getTrimestre } from '@/lib/helpers'
import { ACTIVITY_TYPES } from '@/lib/constants'
import { TopBar } from '@/components/layout/TopBar'
import { FilterBar } from '@/components/shared/FilterBar'
import { useGroups } from '@/contexts/GroupsContext'

function ActivitiesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramGroupId = searchParams.get('groupId')
  
  const { groups, subjects } = useGroups()
  const groupId = paramGroupId || (groups.length > 0 ? groups[0].id : '')
  const setGroupId = (newId) => router.push(`/actividades?groupId=${newId}`)

  const [activities, setActivities] = useState([])
  const [filter, setFilter] = useState({})
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', activity_type: 'tarea', due_date: todayISO(), max_score: 10, weight: 1, subject_id: null })

  const load = () => {
    if (!groupId) { setActivities([]); return }
    api('activities?groupId=' + groupId).then(setActivities).catch(e => toast.error(e.message))
  }
  useEffect(() => { load() }, [groupId])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', activity_type: 'tarea', due_date: todayISO(), max_score: 10, weight: 1, subject_id: null })
    setOpen(true)
  }
  const openEdit = (a) => {
    setEditing(a)
    setForm({ title: a.title, description: a.description || '', activity_type: a.activity_type, due_date: a.due_date, max_score: a.max_score, weight: a.weight, subject_id: a.subject_id || null })
    setOpen(true)
  }
  const save = async () => {
    if (!form.title.trim()) return toast.error('Pon un título')
    try {
      if (editing) {
        await api('activities/' + editing.id, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Actividad actualizada')
      } else {
        await api('activities', { method: 'POST', body: JSON.stringify({ ...form, group_id: groupId }) })
        toast.success('Actividad creada')
      }
      setOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (a) => {
    if (!confirm(`¿Eliminar "${a.title}"? También se eliminaran sus calificaciones.`)) return
    try { await api('activities/' + a.id, { method: 'DELETE' }); toast.success('Eliminada'); load() }
    catch (e) { toast.error(e.message) }
  }

  const activeGroup = groups.find(g => g.id === groupId)

  return (
    <div>
      <TopBar
        title="Actividades"
        subtitle={activeGroup ? `${activeGroup.grade} ${activeGroup.group_name} ${activeGroup.subject ? `· ${activeGroup.subject}` : ''}` : 'Selecciona un grupo'}
        action={
          <Button onClick={openCreate} disabled={!groupId} className="bg-sky-500 hover:bg-sky-600 shadow-md">
            <Plus className="w-4 h-4 mr-1.5" /> Nueva actividad
          </Button>
        }
      />

      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <h3 className="font-bold text-slate-900 text-lg">Primero crea un grupo</h3>
          <p className="text-sm text-slate-500 mt-1">Ve a "Mis grupos" para crear tu primer grupo.</p>
        </div>
      ) : (
        <>
          <FilterBar
            value={{ ...filter, group_id: groupId }}
            onChange={(v) => { setFilter(v); if (v.group_id !== undefined) setGroupId(v.group_id || '') }}
            groups={groups} subjects={subjects}
            show={['level','grade','group','subject','trimestre']}
          />

          {(() => {
            // Apply client-side filters by subject_id and trimestre
            const filtered = activities.filter(a => {
              if (filter.subject_id && a.subject_id !== filter.subject_id) return false
              if (filter.trimestre && a.trimestre !== filter.trimestre) return false
              return true
            })
            if (filtered.length === 0) {
              return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ListChecks className="w-8 h-8 text-sky-500" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{activities.length === 0 ? 'Aún no hay actividades' : 'Sin resultados con esos filtros'}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">{activities.length === 0 ? 'Crea tu primera tarea, examen o proyecto' : 'Ajusta los filtros o crea una nueva'}</p>
              <Button onClick={openCreate} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-1.5" /> Nueva actividad</Button>
            </div>
              )
            }
            return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(a => {
                const type = ACTIVITY_TYPES.find(t => t.value === a.activity_type) || ACTIVITY_TYPES[0]
                const pct = a.students_count ? Math.round((a.graded_count / a.students_count) * 100) : 0
                const overdue = a.due_date < todayISO() && a.pending > 0
                const subj = subjects.find(s => s.id === a.subject_id)
                return (
                  <Card key={a.id} className="border-slate-100 hover:shadow-md transition-shadow group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <Badge className={`${type.color} hover:${type.color}`}>{type.label}</Badge>
                            {a.trimestre && <Badge variant="outline" className="text-[10px] border-violet-300 text-violet-700 bg-violet-50">T{a.trimestre}</Badge>}
                            {subj && <Badge variant="outline" className="text-[10px]" style={{ borderColor: subj.color, color: subj.color }}>{subj.name}</Badge>}
                          </div>
                          <h3 className="font-bold text-slate-900 leading-tight">{a.title}</h3>
                          {a.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-50" onClick={() => remove(a)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(a.due_date).toLocaleDateString('es-MX')}</span>
                        <span>•</span>
                        <span>Máx. {a.max_score} pts</span>
                        {overdue && <Badge variant="destructive" className="text-[10px]">Vencida</Badge>}
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-medium">{a.graded_count}/{a.students_count} calificados</span>
                          <span className="text-slate-500">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                      <Button onClick={() => router.push(`/actividades/${a.id}/calificar`)} size="sm" className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 border border-sky-200 shadow-none">
                        <Award className="w-4 h-4 mr-1.5" />
                        {a.pending > 0 ? `Calificar (${a.pending} pendientes)` : 'Ver calificaciones'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            )
          })()}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar actividad' : 'Nueva actividad'}</DialogTitle>
            <DialogDescription>Define la actividad que vas a registrar</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Título *</Label>
              <Input className="mt-1" placeholder="Ej. Tarea de fracciones" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Descripción</Label>
              <Textarea className="mt-1 resize-none" rows={2} placeholder="Detalles, instrucciones..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Materia</Label>
                <Select value={form.subject_id || 'none'} onValueChange={v => setForm({...form, subject_id: v === 'none' ? null : v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin materia —</SelectItem>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Tipo</Label>
                <Select value={form.activity_type} onValueChange={v => setForm({...form, activity_type: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Fecha de entrega</Label>
                <Input type="date" className="mt-1" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Trimestre (auto)</Label>
                <Input className="mt-1 bg-slate-50" readOnly value={getTrimestre(form.due_date) ? `T${getTrimestre(form.due_date)}` : '—'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Puntaje máximo</Label>
                <Input type="number" className="mt-1" value={form.max_score} onChange={e => setForm({...form, max_score: Number(e.target.value)})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Ponderación</Label>
                <Input type="number" step="0.1" className="mt-1" value={form.weight} onChange={e => setForm({...form, weight: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Cargando actividades...</div>}>
      <ActivitiesContent />
    </Suspense>
  )
}
