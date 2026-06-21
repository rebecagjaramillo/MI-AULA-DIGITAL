'use client'

import { useState } from 'react'
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
import { FilterBar } from '@/components/shared/FilterBar'
import { PageLayout } from '@/components/layout/PageLayout'
import { useStore } from '@/store/useStore'
import { useProfile } from '@/contexts/ProfileContext'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { activitySchema } from '@/lib/schemas/activitySchema'

export function ActivitiesClient({ serverActivities }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramGroupId = searchParams.get('groupId')
  
  const groups = useStore(s => s.groups)
  const subjects = useStore(s => s.subjects)
  const { activeSubject } = useProfile()
  
  const filteredGroups = activeSubject ? groups.filter(g => g.subject === activeSubject) : groups;
  const validGroupIds = new Set(filteredGroups.map(g => g.id));

  const groupId = paramGroupId && validGroupIds.has(paramGroupId) 
    ? paramGroupId 
    : (filteredGroups.length > 0 ? filteredGroups[0].id : '')
    
  const setGroupId = (newId) => router.push(`/actividades?groupId=${newId}`)

  const activities = serverActivities || []
  
  const [filter, setFilter] = useState({})
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: { title: '', description: '', activity_type: 'tarea', due_date: todayISO(), max_score: 10, weight: 1, subject_id: 'none' }
  })

  const openCreate = () => {
    setEditing(null)
    reset({ title: '', description: '', activity_type: 'tarea', due_date: todayISO(), max_score: 10, weight: 1, subject_id: 'none' })
    setOpen(true)
  }
  
  const openEdit = (a) => {
    setEditing(a)
    reset({ title: a.title, description: a.description || '', activity_type: a.activity_type, due_date: a.due_date, max_score: a.max_score, weight: a.weight, subject_id: a.subject_id || 'none' })
    setOpen(true)
  }
  
  const onSubmit = async (data) => {
    const payload = { ...data, subject_id: data.subject_id === 'none' ? null : data.subject_id }
    try {
      if (editing) {
        await api('activities/' + editing.id, { method: 'PUT', body: JSON.stringify(payload) })
        toast.success('Actividad actualizada')
      } else {
        await api('activities', { method: 'POST', body: JSON.stringify({ ...payload, group_id: groupId }) })
        toast.success('Actividad creada')
      }
      setOpen(false)
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const remove = async (a) => {
    if (!confirm(`¿Eliminar "${a.title}"? También se eliminaran sus calificaciones.`)) return
    try { 
      await api('activities/' + a.id, { method: 'DELETE' })
      toast.success('Eliminada')
      router.refresh()
    }
    catch (e) { toast.error(e.message) }
  }

  const activeGroup = groups.find(g => g.id === groupId)

  return (
    <PageLayout
      title="Actividades"
      subtitle={activeGroup ? `${activeGroup.grade} ${activeGroup.group_name} ${activeGroup.subject ? `· ${activeGroup.subject}` : ''}` : 'Selecciona un grupo'}
      action={
        <Button onClick={openCreate} disabled={!groupId} className="bg-sky-500 hover:bg-sky-600 shadow-md">
          <Plus className="w-4 h-4 mr-1.5" /> Nueva actividad
        </Button>
      }
    >

      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <h3 className="font-bold text-slate-900 text-lg">No hay grupos para esta materia</h3>
          <p className="text-sm text-slate-500 mt-1">Ve a "Mis grupos" para crear tu primer grupo o cambia de materia.</p>
        </div>
      ) : (
        <>
          <FilterBar
            value={{ ...filter, group_id: groupId }}
            onChange={(v) => { setFilter(v); if (v.group_id !== undefined) setGroupId(v.group_id || '') }}
            groups={filteredGroups} subjects={subjects}
            show={['level','grade','group','subject','trimestre']}
          />

          {(() => {
            // Apply client-side filters by subject_id, trimestre, and fallback groupId if not filtered strictly by the server
            const filtered = activities.filter(a => {
              if (a.group_id !== groupId) return false
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
              <h3 className="font-bold text-slate-900 text-lg">{activities.filter(a => a.group_id === groupId).length === 0 ? 'Aún no hay actividades' : 'Sin resultados con esos filtros'}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">{activities.filter(a => a.group_id === groupId).length === 0 ? 'Crea tu primera tarea, examen o proyecto' : 'Ajusta los filtros o crea una nueva'}</p>
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
                            {a.trimestre && <Badge variant="outline" className="text-2xs border-violet-300 text-violet-700 bg-violet-50">T{a.trimestre}</Badge>}
                            {subj && <Badge variant="outline" className="text-2xs" style={{ borderColor: subj.color, color: subj.color }}>{subj.name}</Badge>}
                          </div>
                          <h3 className="font-bold text-slate-900 leading-tight">{a.title}</h3>
                          {a.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)} aria-label="Editar actividad"><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-50" onClick={() => remove(a)} aria-label="Eliminar actividad"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(a.due_date).toLocaleDateString('es-MX')}</span>
                        <span>•</span>
                        <span>Máx. {a.max_score} pts</span>
                        {overdue && <Badge variant="destructive" className="text-2xs">Vencida</Badge>}
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <div>
                <Label htmlFor="title" className="text-xs font-semibold">Título *</Label>
                <Input id="title" className="mt-1" aria-invalid={!!errors.title} aria-describedby={errors.title ? "title_error" : undefined} placeholder="Ej. Tarea de fracciones" {...register('title')} />
                {errors.title && <p id="title_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="description" className="text-xs font-semibold">Descripción</Label>
                <Textarea id="description" className="mt-1 resize-none" rows={2} aria-invalid={!!errors.description} aria-describedby={errors.description ? "description_error" : undefined} placeholder="Detalles, instrucciones..." {...register('description')} />
                {errors.description && <p id="description_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="subject_id" className="text-xs font-semibold">Materia</Label>
                  <Controller name="subject_id" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="subject_id" className="mt-1" aria-invalid={!!errors.subject_id} aria-describedby={errors.subject_id ? "subject_id_error" : undefined}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Sin materia —</SelectItem>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.subject_id && <p id="subject_id_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.subject_id.message}</p>}
                </div>
                <div>
                  <Label htmlFor="activity_type" className="text-xs font-semibold">Tipo</Label>
                  <Controller name="activity_type" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="activity_type" className="mt-1" aria-invalid={!!errors.activity_type} aria-describedby={errors.activity_type ? "activity_type_error" : undefined}><SelectValue /></SelectTrigger>
                      <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                  {errors.activity_type && <p id="activity_type_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.activity_type.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="due_date" className="text-xs font-semibold">Fecha de entrega</Label>
                  <Input id="due_date" type="date" className="mt-1" aria-invalid={!!errors.due_date} aria-describedby={errors.due_date ? "due_date_error" : undefined} {...register('due_date')} />
                  {errors.due_date && <p id="due_date_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.due_date.message}</p>}
                </div>
                <div>
                  <Label htmlFor="trimestre_auto" className="text-xs font-semibold">Trimestre (auto)</Label>
                  <Input id="trimestre_auto" className="mt-1 bg-slate-50" readOnly value={getTrimestre(watch('due_date')) ? `T${getTrimestre(watch('due_date'))}` : '—'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="max_score" className="text-xs font-semibold">Puntaje máximo</Label>
                  <Input id="max_score" type="number" className="mt-1" aria-invalid={!!errors.max_score} aria-describedby={errors.max_score ? "max_score_error" : undefined} {...register('max_score', { valueAsNumber: true })} />
                  {errors.max_score && <p id="max_score_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.max_score.message}</p>}
                </div>
                <div>
                  <Label htmlFor="weight" className="text-xs font-semibold">Ponderación</Label>
                  <Input id="weight" type="number" step="0.1" className="mt-1" aria-invalid={!!errors.weight} aria-describedby={errors.weight ? "weight_error" : undefined} {...register('weight', { valueAsNumber: true })} />
                  {errors.weight && <p id="weight_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.weight.message}</p>}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-sky-500 hover:bg-sky-600">
                {isSubmitting ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
