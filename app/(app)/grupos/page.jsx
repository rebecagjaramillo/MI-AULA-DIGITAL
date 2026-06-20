'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, LayoutGrid, ChevronRight, Pencil, Trash2, Users } from 'lucide-react'
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
import { TopBar } from '@/components/layout/TopBar'
import { FilterBar } from '@/components/shared/FilterBar'
import { LEVELS_NEW, GROUP_COLORS } from '@/lib/constants'
import { useGroups } from '@/contexts/GroupsContext'

export default function GroupsPage() {
  const router = useRouter()
  const { groups, subjects, reload } = useGroups()
  
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [subjOpen, setSubjOpen] = useState(false)
  const emptyForm = { level: 'Primaria', grade: '1°', group_name: 'A', subject: '', primary_subject_id: null, additional_subject_ids: [], school_year: '2024-2025', color: GROUP_COLORS[0], notes: '' }
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState({})
  const [expanded, setExpanded] = useState({}) // level::grade keys

  useEffect(() => {
    // Auto-expand levels that have groups
    const exp = {}
    groups.forEach(g => { exp[`${g.level || 'Primaria'}::${g.grade}`] = true })
    setExpanded(prev => ({ ...exp, ...prev }))
  }, [groups])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, level: filter.level || 'Primaria', grade: filter.grade || '1°' })
    setOpen(true)
  }
  const openEdit = (g) => {
    setEditing(g)
    setForm({
      level: g.level || 'Primaria', grade: g.grade, group_name: g.group_name,
      subject: g.subject || '', primary_subject_id: g.primary_subject_id || null,
      additional_subject_ids: g.additional_subject_ids || [],
      school_year: g.school_year, color: g.color, notes: g.notes || ''
    })
    setOpen(true)
  }
  const save = async () => {
    if (!form.grade || !form.group_name) return toast.error('Grado y grupo son requeridos')
    try {
      if (editing) {
        await api('groups/' + editing.id, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Grupo actualizado')
      } else {
        await api('groups', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Grupo creado')
      }
      setOpen(false)
      reload()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (g) => {
    if (!confirm(`¿Eliminar grupo ${g.level} · ${g.grade} ${g.group_name}? También se eliminarán sus alumnos.`)) return
    try { 
      await api('groups/' + g.id, { method: 'DELETE' })
      toast.success('Grupo eliminado')
      reload() 
    } catch (e) { toast.error(e.message) }
  }
  const addSubject = async (name) => {
    if (!name?.trim()) return null
    const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#14b8a6']
    const s = await api('subjects', { method: 'POST', body: JSON.stringify({ name: name.trim(), color: colors[subjects.length % colors.length] }) })
    reload()
    return s
  }
  const removeSubject = async (s) => {
    if (!confirm(`¿Eliminar materia "${s.name}"?`)) return
    await api('subjects/' + s.id, { method: 'DELETE' })
    reload()
  }

  // Build tree: level -> grade -> [groups]
  const filteredGroups = groups.filter(g => {
    if (filter.level && (g.level || 'Primaria') !== filter.level) return false
    if (filter.grade && g.grade !== filter.grade) return false
    return true
  })
  const tree = {}
  filteredGroups.forEach(g => {
    const lv = g.level || 'Primaria'
    if (!tree[lv]) tree[lv] = {}
    if (!tree[lv][g.grade]) tree[lv][g.grade] = []
    tree[lv][g.grade].push(g)
  })

  return (
    <div>
      <TopBar
        title="Mis grupos"
        subtitle="Organiza por Nivel → Grado → Grupo. Cada grupo puede tener varias materias."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSubjOpen(true)}>
              <BookOpen className="w-4 h-4 mr-1.5" /> Mis materias ({subjects.length})
            </Button>
            <Button onClick={openCreate} className="bg-sky-500 hover:bg-sky-600 shadow-md">
              <Plus className="w-4 h-4 mr-1.5" /> Nuevo grupo
            </Button>
          </div>
        }
      />

      <FilterBar value={filter} onChange={setFilter} groups={groups} subjects={subjects} show={['level','grade']} />

      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Aún no tienes grupos</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">Crea tu primer grupo organizado por Nivel, Grado y Grupo</p>
          <Button onClick={openCreate} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-1.5" /> Crear mi primer grupo</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {LEVELS_NEW.map(levelDef => {
            const gradesObj = tree[levelDef.key]
            if (!gradesObj) return null
            return (
              <div key={levelDef.key}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-6 rounded-full" style={{ background: levelDef.color }} />
                  <h2 className="text-lg font-bold text-slate-900">{levelDef.label}</h2>
                  <Badge variant="secondary" className="text-xs">{Object.values(gradesObj).flat().length} grupos</Badge>
                </div>
                <div className="space-y-2 ml-5">
                  {Object.entries(gradesObj).sort((a,b) => a[0].localeCompare(b[0])).map(([grade, gs]) => {
                    const exKey = `${levelDef.key}::${grade}`
                    const isOpen = expanded[exKey] !== false
                    return (
                      <div key={grade} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <button onClick={() => setExpanded(p => ({ ...p, [exKey]: !isOpen }))} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-slate-50">
                          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          <span className="font-semibold text-slate-800">{grade}</span>
                          <Badge variant="outline" className="text-[10px]">{gs.length} grupo{gs.length !== 1 ? 's' : ''}</Badge>
                        </button>
                        {isOpen && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 pt-0 border-t border-slate-100">
                            {gs.map(g => {
                              const allSubj = [g.primary_subject_id, ...(g.additional_subject_ids || [])].filter(Boolean)
                              const subjNames = allSubj.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean)
                              return (
                                <Card key={g.id} className="overflow-hidden border-slate-100 hover:shadow-md transition-all group cursor-pointer" onClick={() => router.push(`/alumnos?groupId=${g.id}`)}>
                                  <div className="h-1.5" style={{ background: g.color }} />
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm" style={{ background: g.color }}>
                                        {grade.replace('°','').slice(0,2)}{g.group_name}
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(g) }}><Pencil className="w-3.5 h-3.5" /></Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); remove(g) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                      </div>
                                    </div>
                                    <div className="font-bold text-slate-900">{grade} {g.group_name}</div>
                                    {subjNames.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {subjNames.slice(0,3).map((n,i) => <Badge key={i} variant="outline" className="text-[10px] py-0">{n}</Badge>)}
                                        {subjNames.length > 3 && <Badge variant="outline" className="text-[10px] py-0">+{subjNames.length - 3}</Badge>}
                                      </div>
                                    )}
                                    <div className="text-xs text-slate-400 mt-2">Ciclo {g.school_year}</div>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                      <Users className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="text-xs font-semibold text-slate-600">{g.student_count || 0} alumnos</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Group Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar grupo' : 'Nuevo grupo'}</DialogTitle>
            <DialogDescription>Nivel → Grado → Grupo + materias</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Nivel educativo</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {LEVELS_NEW.map(l => (
                  <button key={l.key} onClick={() => setForm({...form, level: l.key, grade: l.grades[0]})} className={`p-2 rounded-xl border text-sm font-medium transition-all ${form.level === l.key ? 'border-sky-400 bg-sky-50 shadow-sm text-sky-700' : 'border-slate-200 hover:border-slate-300'}`} style={{ borderColor: form.level === l.key ? l.color : undefined }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Grado</Label>
                <Select value={form.grade} onValueChange={v => setForm({...form, grade: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{(LEVELS_NEW.find(l => l.key === form.level)?.grades || []).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Grupo</Label>
                <Input className="mt-1" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} placeholder="A, B, C..." />
              </div>
            </div>

            {/* Subjects */}
            <div>
              <Label className="text-xs font-semibold">Materia principal (opcional)</Label>
              <Select value={form.primary_subject_id || 'none'} onValueChange={v => setForm({...form, primary_subject_id: v === 'none' ? null : v})}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sin materia principal —</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <button onClick={async () => { const n = prompt('Nueva materia:'); if (n) { const s = await addSubject(n); if (s) setForm(f => ({...f, primary_subject_id: s.id})) } }} className="text-xs text-sky-600 hover:text-sky-700 mt-1">+ Crear nueva materia</button>
            </div>
            <div>
              <Label className="text-xs font-semibold">Materias adicionales</Label>
              <div className="flex flex-wrap gap-1.5 mt-1 p-2 rounded-lg border border-slate-200 bg-slate-50/50 min-h-[44px]">
                {subjects.filter(s => s.id !== form.primary_subject_id).map(s => {
                  const sel = form.additional_subject_ids.includes(s.id)
                  return (
                    <button key={s.id} onClick={() => setForm(f => ({...f, additional_subject_ids: sel ? f.additional_subject_ids.filter(x => x !== s.id) : [...f.additional_subject_ids, s.id]}))} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${sel ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      {sel && '✓ '}{s.name}
                    </button>
                  )
                })}
                {subjects.filter(s => s.id !== form.primary_subject_id).length === 0 && <span className="text-xs text-slate-400">Crea materias primero ↑</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Ciclo escolar</Label>
                <Input className="mt-1" value={form.school_year} onChange={e => setForm({...form, school_year: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Color</Label>
                <div className="flex gap-1.5 mt-1">
                  {GROUP_COLORS.map(c => (
                    <button key={c} onClick={() => setForm({...form, color: c})} className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'hover:scale-110'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Notas</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Crear grupo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subjects Manager Dialog */}
      <Dialog open={subjOpen} onOpenChange={setSubjOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mis materias</DialogTitle>
            <DialogDescription>Materias que impartes (puedes asignarlas a grupos)</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {subjects.length === 0 ? (
              <div className="text-sm text-slate-500 py-4 text-center">Aún no tienes materias. Agrega la primera ↓</div>
            ) : subjects.map(s => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100">
                <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-sm font-medium">{s.name}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => removeSubject(s)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
            <Button onClick={async () => { const n = prompt('Nombre de la materia:'); if (n) await addSubject(n) }} variant="outline" className="w-full mt-2">
              <Plus className="w-4 h-4 mr-1.5" /> Nueva materia
            </Button>
          </div>
          <DialogFooter><Button onClick={() => setSubjOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
