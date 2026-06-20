'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users, LayoutGrid, Search, ChevronRight, Pencil, Trash2,
  UserPlus, SmartphoneNfc, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { initials } from '@/lib/helpers'
import { TopBar } from '@/components/layout/TopBar'
import { FilterBar } from '@/components/shared/FilterBar'
import { useGroups } from '@/contexts/GroupsContext'

function StudentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramGroupId = searchParams.get('groupId')
  
  const { groups } = useGroups()
  const groupId = paramGroupId || (groups.length > 0 ? groups[0].id : '')
  const setGroupId = (newId) => router.push(`/alumnos?groupId=${newId}`)

  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', student_number: '', guardian_name: '', guardian_contact: '', notes: '', nfc_uid: '' })
  const [bulkText, setBulkText] = useState('')

  useEffect(() => {
    if (groupId) api('students?groupId=' + groupId).then(setStudents).catch(e => toast.error(e.message))
    else setStudents([])
  }, [groupId])

  const activeGroup = groups.find(g => g.id === groupId)
  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return !q || (s.first_name + ' ' + s.last_name).toLowerCase().includes(q) || String(s.student_number || '').includes(q)
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ first_name: '', last_name: '', student_number: students.length + 1, guardian_name: '', guardian_contact: '', notes: '', nfc_uid: '' })
    setOpen(true)
  }
  const openEdit = (s) => {
    setEditing(s)
    setForm({ first_name: s.first_name, last_name: s.last_name, student_number: s.student_number || '', guardian_name: s.guardian_name, guardian_contact: s.guardian_contact, notes: s.notes, nfc_uid: s.nfc_uid || '' })
    setOpen(true)
  }

  const scanNfcForStudent = async () => {
    if (!('NDEFReader' in window)) return toast.error('NFC no soportado en este navegador.')
    
    try {
      const ndef = new window.NDEFReader()
      await ndef.scan()
      toast.info('Acerca la tarjeta que quieres asignar a este alumno...', { duration: 5000 })
      
      ndef.onreading = (event) => {
        setForm(f => ({ ...f, nfc_uid: event.serialNumber }))
        toast.success('¡Tarjeta vinculada correctamente! No olvides guardar.')
      }
      
      ndef.onreadingerror = () => toast.error('Error al leer la tarjeta.')
    } catch (e) { 
      toast.error('Error al iniciar NFC: ' + e.message) 
    }
  }

  const reload = () => api('students?groupId=' + groupId).then(setStudents)

  const save = async () => {
    if (!form.first_name.trim()) return toast.error('Ingresa el nombre')
    try {
      if (editing) {
        await api('students/' + editing.id, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Alumno actualizado')
      } else {
        await api('students', { method: 'POST', body: JSON.stringify({ ...form, group_id: groupId }) })
        toast.success('Alumno agregado')
      }
      setOpen(false); reload()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (s) => {
    if (!confirm(`¿Eliminar a ${s.first_name} ${s.last_name}?`)) return
    try { await api('students/' + s.id, { method: 'DELETE' }); toast.success('Alumno eliminado'); reload() }
    catch (e) { toast.error(e.message) }
  }
  const saveBulk = async () => {
    try {
      const res = await api('students/bulk', { method: 'POST', body: JSON.stringify({ group_id: groupId, names: bulkText, start_number: students.length + 1 }) })
      toast.success(`${res.inserted} alumnos agregados`)
      setBulkOpen(false); setBulkText(''); reload()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <TopBar
        title="Alumnos"
        subtitle={activeGroup ? `${activeGroup.grade} ${activeGroup.group_name} ${activeGroup.subject ? `· ${activeGroup.subject}` : ''}` : 'Selecciona un grupo'}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)} disabled={!groupId}>
              <Users className="w-4 h-4 mr-1.5" /> Lista rápida
            </Button>
            <Button onClick={openCreate} disabled={!groupId} className="bg-sky-500 hover:bg-sky-600 shadow-md">
              <UserPlus className="w-4 h-4 mr-1.5" /> Agregar alumno
            </Button>
          </div>
        }
      />

      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Primero crea un grupo</h3>
          <p className="text-sm text-slate-500 mt-1">Ve a "Mis grupos" para crear tu primer grupo.</p>
        </div>
      ) : (
        <>
          <FilterBar
            value={{ group_id: groupId }}
            onChange={(v) => { if (v.group_id !== undefined) setGroupId(v.group_id) }}
            groups={groups} subjects={[]}
            show={['level','grade','group']}
          />

          <Card className="border-slate-100 mb-4">
            <CardContent className="p-4">
              <Label className="text-xs font-semibold">Buscar</Label>
              <div className="relative mt-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-9" placeholder="Nombre o número de lista..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Sin alumnos en este grupo</h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">Agrega alumnos uno por uno o pega una lista completa</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setBulkOpen(true)}><Users className="w-4 h-4 mr-1.5" /> Pegar lista</Button>
                <Button onClick={openCreate} className="bg-sky-500 hover:bg-sky-600"><UserPlus className="w-4 h-4 mr-1.5" /> Agregar alumno</Button>
              </div>
            </div>
          ) : (
            <Card className="border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filtered.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {s.student_number || initials(s.first_name + ' ' + s.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{s.first_name} {s.last_name}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 mt-0.5">
                        {s.student_number && <span>N° {s.student_number}</span>}
                        {s.guardian_name && <span>Tutor: {s.guardian_name}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500" />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(s) }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); remove(s) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Add/Edit Student Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar alumno' : 'Nuevo alumno'}</DialogTitle>
            <DialogDescription>Ficha del alumno</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Nombre(s) *</Label>
                <Input className="mt-1" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Apellido(s)</Label>
                <Input className="mt-1" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">N° lista</Label>
                <Input type="number" className="mt-1" value={form.student_number} onChange={e => setForm({...form, student_number: e.target.value ? Number(e.target.value) : ''})} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Tutor / Contacto</Label>
                <Input className="mt-1" placeholder="Opcional" value={form.guardian_name} onChange={e => setForm({...form, guardian_name: e.target.value})} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Teléfono del tutor</Label>
              <Input className="mt-1" placeholder="Opcional" value={form.guardian_contact} onChange={e => setForm({...form, guardian_contact: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Tarjeta NFC asignada</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  className="flex-1 bg-slate-50 font-mono text-xs" 
                  readOnly 
                  placeholder="Sin tarjeta..." 
                  value={form.nfc_uid || ''} 
                />
                <Button variant="outline" type="button" onClick={scanNfcForStudent}>
                  <SmartphoneNfc className="w-4 h-4 mr-1.5 text-indigo-500" /> Leer
                </Button>
                {form.nfc_uid && (
                  <Button variant="ghost" type="button" onClick={() => setForm({...form, nfc_uid: ''})} className="text-rose-500 px-2" title="Quitar tarjeta">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Notas del docente</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Agregar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pegar lista de alumnos</DialogTitle>
            <DialogDescription>Pega los nombres, un alumno por línea. El primer nombre es el nombre, el resto el apellido.</DialogDescription>
          </DialogHeader>
          <Textarea rows={10} placeholder={"Ana López García\nLuis Pérez\nMaría Sánchez Rivera\n..."} value={bulkText} onChange={e => setBulkText(e.target.value)} className="font-mono text-sm" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button onClick={saveBulk} className="bg-sky-500 hover:bg-sky-600">Agregar {bulkText.split('\n').filter(s => s.trim()).length} alumnos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Cargando alumnos...</div>}>
      <StudentsContent />
    </Suspense>
  )
}
