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
import { PageLayout } from '@/components/layout/PageLayout'
import { FilterBar } from '@/components/shared/FilterBar'
import { LEVELS_NEW, GROUP_COLORS } from '@/lib/constants'
import { useStore } from '@/store/useStore'
import { useProfile } from '@/contexts/ProfileContext'

export function GroupsClient({ serverGroups }) {
  const router = useRouter()
  // Maintain sync with global store for Sidebar
  const reload = useStore(s => s.reloadGroups)
  const { activeSubject, profile, updateProfile } = useProfile()
  
  const subjectsStr = Array.isArray(profile?.subjects) ? profile.subjects : []
  const subjects = subjectsStr.map((s, i) => ({ id: s, name: s, color: GROUP_COLORS[i % GROUP_COLORS.length] }))
  const levels = Array.isArray(profile?.education_levels) ? profile.education_levels : []
  
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [subjOpen, setSubjOpen] = useState(false)
  const emptyForm = { level: '', group_name: 'A', subject: '', primary_subject_id: null, additional_subject_ids: [], school_year: '2024-2025', color: GROUP_COLORS[0], notes: '' }
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState({})
  const [expanded, setExpanded] = useState({})
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showInlineSubject, setShowInlineSubject] = useState(false)
  const [inlineSubjectName, setInlineSubjectName] = useState('')
  // We use serverGroups as our source of truth for rendering this page
  const groups = serverGroups

  useEffect(() => {
    // Auto-expand levels that have groups
    const exp = {}
    groups.forEach(g => { exp[g.level || 'Primaria'] = true })
    setExpanded(prev => ({ ...exp, ...prev }))
  }, [groups])

  const openCreate = () => {
    if (levels.length === 0) return toast.error('Configura tus niveles en Ajustes para crear grupos')
    setEditing(null)
    setForm({ ...emptyForm, level: filter.level || levels[0], subject: activeSubject || '' })
    setOpen(true)
  }
  
  const openEdit = (g) => {
    setEditing(g)
    setForm({
      level: g.level || 'Primaria', group_name: g.group_name,
      subject: g.subject || '', primary_subject_id: g.primary_subject_id || null,
      additional_subject_ids: g.additional_subject_ids || [],
      school_year: g.school_year, color: g.color, notes: g.notes || ''
    })
    setOpen(true)
  }
  
  const save = async () => {
    if (!form.level || !form.group_name) return toast.error('Nivel/Grado y grupo son requeridos')
    try {
      if (editing) {
        await api('groups/' + editing.id, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Grupo actualizado')
      } else {
        await api('groups', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Grupo creado')
      }
      setOpen(false)
      reload() // sync sidebar
      router.refresh() // refetch server component
    } catch (e) { toast.error(e.message) }
  }
  
  const remove = async (g) => {
    if (!confirm(`¿Eliminar grupo ${g.level} ${g.group_name}? También se eliminarán sus alumnos.`)) return
    try { 
      await api('groups/' + g.id, { method: 'DELETE' })
      toast.success('Grupo eliminado')
      reload() // sync sidebar
      router.refresh() // refetch server component
    } catch (e) { toast.error(e.message) }
  }
  
  const addSubject = async (name) => {
    if (!name?.trim()) return null
    const newName = name.trim()
    if (subjectsStr.includes(newName)) return null
    const newSubjects = [...subjectsStr, newName]
    const p = await api('profile', { method: 'POST', body: JSON.stringify({ subjects: newSubjects }) })
    updateProfile(p)
    router.refresh()
    return { id: newName, name: newName, color: GROUP_COLORS[subjectsStr.length % GROUP_COLORS.length] }
  }
  
  const handleAddSubjectUI = async () => {
    if (!newSubjectName.trim()) return
    await addSubject(newSubjectName)
    setNewSubjectName('')
  }
  
  const removeSubject = async (s) => {
    if (!confirm(`¿Eliminar materia "${s.name}"?`)) return
    const newSubjects = subjectsStr.filter(n => n !== s.name)
    const p = await api('profile', { method: 'POST', body: JSON.stringify({ subjects: newSubjects }) })
    updateProfile(p)
    router.refresh()
  }

  // Build tree: level -> [groups]
  const filteredGroups = groups.filter(g => {
    if (activeSubject && g.subject !== activeSubject) return false
    if (filter.level && g.level !== filter.level) return false
    if (filter.grade && g.grade !== filter.grade) return false
    if (filter.group_id && g.id !== filter.group_id) return false
    return true
  })
  const tree = {}
  filteredGroups.forEach(g => {
    const lv = g.level || 'Primaria'
    if (!tree[lv]) tree[lv] = []
    tree[lv].push(g)
  })

  return (
    <PageLayout
      title="Mis grupos"
      subtitle="Organiza por Nivel → Grado → Grupo."
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
    >

      <FilterBar value={filter} onChange={setFilter} groups={groups} subjects={subjects} show={['level','grade','group']} />

      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Aún no tienes grupos</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">Crea tu primer grupo seleccionando su Nivel/Grado</p>
          <Button onClick={openCreate} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-1.5" /> Crear mi primer grupo</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(tree).sort().map(levelStr => {
            const gs = tree[levelStr]
            if (!gs || gs.length === 0) return null
            const isOpen = expanded[levelStr] !== false
            return (
              <div key={levelStr} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button onClick={() => setExpanded(p => ({ ...p, [levelStr]: !isOpen }))} className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  <div className="w-1 h-6 rounded-full bg-sky-500" />
                  <span className="text-lg font-bold text-slate-900">{levelStr}</span>
                  <Badge variant="secondary" className="text-xs ml-auto bg-slate-100 text-slate-600">{gs.length} grupo{gs.length !== 1 ? 's' : ''}</Badge>
                </button>
                {isOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 pt-0 border-t border-slate-100 bg-slate-50/30">
                    {gs.map(g => {
                      const allSubj = [g.primary_subject_id, ...(g.additional_subject_ids || [])].filter(Boolean)
                      const subjNames = allSubj.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean)
                      return (
                        <Card key={g.id} className="overflow-hidden border-slate-200 hover:border-sky-300 hover:shadow-lg transition-all group cursor-pointer bg-white" onClick={() => router.push(`/alumnos?groupId=${g.id}`)}>
                          <div className="h-1.5" style={{ background: g.color }} />
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-sm" style={{ background: g.color }}>
                                {g.group_name}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-sky-600 hover:bg-sky-50" onClick={(e) => { e.stopPropagation(); openEdit(g) }} aria-label="Editar grupo"><Pencil className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); remove(g) }} aria-label="Eliminar grupo"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                            <div className="font-bold text-slate-900 text-base">{g.level} "{g.group_name}"</div>
                            {subjNames.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {subjNames.slice(0,3).map((n,i) => <Badge key={i} variant="secondary" className="text-2xs py-0.5 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">{n}</Badge>)}
                                {subjNames.length > 3 && <Badge variant="secondary" className="text-2xs py-0.5 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">+{subjNames.length - 3}</Badge>}
                              </div>
                            )}
                            <div className="text-xs text-slate-400 mt-3 font-medium">Ciclo {g.school_year}</div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                              <Users className="w-4 h-4 text-sky-500" />
                              <span className="text-sm font-semibold text-slate-700">{g.student_count || 0} <span className="text-slate-500 font-normal">alumnos</span></span>
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
      )}

      {/* Group Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar grupo' : 'Nuevo grupo'}</DialogTitle>
            <DialogDescription>Asigna Nivel/Grado, Grupo y materias</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level" className="text-xs font-semibold text-slate-700">Nivel / Grado</Label>
                <Select value={form.level} onValueChange={v => setForm({...form, level: v})}>
                  <SelectTrigger id="level" className="mt-1"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="group_name" className="text-xs font-semibold text-slate-700">Grupo / Letra</Label>
                <Input id="group_name" className="mt-1" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} placeholder="Ej. A, B, C..." />
              </div>
            </div>

            {/* Subjects */}
            <div>
              <Label htmlFor="primary_subject_id" className="text-xs font-semibold">Materia principal (opcional)</Label>
              <Select value={form.primary_subject_id || 'none'} onValueChange={v => setForm({...form, primary_subject_id: v === 'none' ? null : v})}>
                <SelectTrigger id="primary_subject_id" className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sin materia principal —</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {showInlineSubject ? (
                <div className="flex gap-2 mt-2">
                  <Input autoFocus placeholder="Nombre de materia..." value={inlineSubjectName} onChange={e => setInlineSubjectName(e.target.value)} className="h-8 text-xs" />
                  <Button type="button" size="sm" className="h-8 px-2" onClick={async () => {
                    if(inlineSubjectName.trim()) {
                      const s = await addSubject(inlineSubjectName);
                      if(s) setForm(f => ({...f, primary_subject_id: s.id}));
                      setShowInlineSubject(false);
                      setInlineSubjectName('');
                    }
                  }}>Crear</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowInlineSubject(false)}>Cancelar</Button>
                </div>
              ) : (
                <button type="button" onClick={(e) => { e.preventDefault(); setShowInlineSubject(true) }} className="text-xs text-sky-600 hover:text-sky-700 mt-1">+ Crear nueva materia</button>
              )}
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
                <Label htmlFor="school_year" className="text-xs font-semibold">Ciclo escolar</Label>
                <Input id="school_year" className="mt-1" value={form.school_year} onChange={e => setForm({...form, school_year: e.target.value})} />
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
              <Label htmlFor="notes" className="text-xs font-semibold">Notas</Label>
              <Textarea id="notes" className="mt-1 resize-none" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
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
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
              <Input 
                placeholder="Nombre de la nueva materia..." 
                value={newSubjectName} 
                onChange={e => setNewSubjectName(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter') handleAddSubjectUI() }}
              />
              <Button onClick={handleAddSubjectUI} className="bg-sky-500 hover:bg-sky-600">
                <Plus className="w-4 h-4 mr-1.5" /> Agregar
              </Button>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setSubjOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
