'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users, LayoutGrid, Search, ChevronRight, Pencil, Trash2,
  UserPlus, SmartphoneNfc, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { initials } from '@/lib/helpers'
import { PageLayout } from '@/components/layout/PageLayout'
import { FilterBar } from '@/components/shared/FilterBar'
import { useStore } from '@/store/useStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const studentSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name: z.string().min(1, 'El apellido es obligatorio'),
  student_number: z.number().nullable().optional(),
  guardian_name: z.string().optional(),
  guardian_contact: z.string().optional(),
  nfc_uid: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional().default(true)
})

export function StudentsClient({ serverStudents, serverFilter }) {
  const router = useRouter()
  const groups = useStore(s => s.groups)
  
  const level = serverFilter?.level || ''
  const grade = serverFilter?.grade || ''
  const groupId = serverFilter?.groupId || ''
  const groupName = serverFilter?.groupName || ''

  const applyFilters = (v) => {
    const params = new URLSearchParams()
    if (v.level) params.set('level', v.level)
    if (v.grade) params.set('grade', v.grade)
    if (v.groupName) params.set('groupName', v.groupName)
    if (v.group_id) params.set('groupId', v.group_id)
    router.push(`/alumnos?${params.toString()}`)
  }

  // Ya no necesitamos useEffect ni useState para "students", usamos los que vienen del Server
  const students = serverStudents || []
  
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [bulkText, setBulkText] = useState('')
  const [modalGroupId, setModalGroupId] = useState('')

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: { first_name: '', last_name: '', student_number: '', guardian_name: '', guardian_contact: '', notes: '', nfc_uid: '' }
  })

  // Deducir groupId si los filtros apuntan a un único grupo
  let effectiveGroupId = groupId
  if (!effectiveGroupId && level && grade && groupName) {
    const matching = groups.filter(g => g.level === level && g.grade === grade && (g.name || g.group_name) === groupName && !g.archived)
    if (matching.length === 1) effectiveGroupId = matching[0].id
  }

  const activeGroup = groups.find(g => g.id === effectiveGroupId)
  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return s.first_name.toLowerCase().includes(q) || 
           s.last_name.toLowerCase().includes(q) || 
           (s.student_number && s.student_number.toString().includes(q))
  })

  const openCreate = () => { reset(); setEditing(null); setModalGroupId(effectiveGroupId || ''); setOpen(true) }
  const openBulk = () => { setBulkText(''); setModalGroupId(effectiveGroupId || ''); setBulkOpen(true) }
  
  const openEdit = (s) => {
    setEditing(s)
    setModalGroupId(s.group_id || effectiveGroupId || '')
    reset({ first_name: s.first_name, last_name: s.last_name, student_number: s.student_number || '', guardian_name: s.guardian_name || '', guardian_contact: s.guardian_contact || '', notes: s.notes || '', nfc_uid: s.nfc_uid || '' })
    setOpen(true)
  }

  const scanNfcForStudent = async () => {
    if (!('NDEFReader' in window)) return toast.error('NFC no soportado en este navegador.')
    
    try {
      const ndef = new window.NDEFReader()
      await ndef.scan()
      toast.info('Acerca la tarjeta que quieres asignar a este alumno...', { duration: 5000 })
      
      ndef.onreading = (event) => {
        setValue('nfc_uid', event.serialNumber)
        toast.success('¡Tarjeta vinculada correctamente! No olvides guardar.')
      }
      
      ndef.onreadingerror = () => toast.error('Error al leer la tarjeta.')
    } catch (e) { 
      toast.error('Error al iniciar NFC: ' + e.message) 
    }
  }

  const onSubmit = async (data) => {
    if (!modalGroupId) return toast.error('Selecciona el grupo destino')
    try {
      const payload = { ...data, group_id: modalGroupId, active: true }
      if (editing) {
        await api(`students/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.success('Alumno actualizado')
      } else {
        await api('students', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Alumno agregado')
      }
      setOpen(false)
      router.refresh() // Refetch en el Server Component
    } catch (e) { toast.error(e.message) }
  }
  
  const remove = async (id) => {
    if (!confirm('¿Eliminar este alumno?')) return
    try {
      await api(`students/${id}`, { method: 'DELETE' })
      toast.success('Alumno eliminado')
      router.refresh() // Refetch en el Server Component
    } catch (e) { toast.error(e.message) }
  }
  
  const saveBulk = async () => {
    if (!bulkText.trim()) return toast.error('Ingresa los nombres')
    if (!modalGroupId) return toast.error('Selecciona el grupo destino')
    try {
      const res = await api('students/bulk', { method: 'POST', body: JSON.stringify({ group_id: modalGroupId, names: bulkText, start_number: students.length + 1 }) })
      toast.success(`${res.inserted} alumnos agregados`)
      setBulkOpen(false)
      setBulkText('')
      router.refresh() // Refetch en el Server Component
    } catch (e) { toast.error(e.message) }
  }

  return (
    <PageLayout
      title="Alumnos"
      subtitle="Gestiona y visualiza a todos tus alumnos"
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={openBulk} disabled={groups.length === 0}>
            <Users className="w-4 h-4 mr-1.5" /> Lista rápida
          </Button>
          <Button onClick={openCreate} disabled={groups.length === 0} className="bg-sky-500 hover:bg-sky-600 shadow-md">
            <UserPlus className="w-4 h-4 mr-1.5" /> Agregar alumno
          </Button>
        </div>
      }
    >

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
            value={{ 
               level: level || (groupId ? activeGroup?.level : ''), 
               grade: grade || (groupId ? activeGroup?.grade : ''), 
               groupName: groupName || (groupId ? (activeGroup?.name || activeGroup?.group_name) : ''), 
               group_id: groupId 
            }}
            onChange={applyFilters}
            groups={groups} subjects={[]}
            show={['level','grade','group']}
          />

          <Card className="border-slate-100 mb-4 mt-4">
            <CardContent className="p-4">
              <Label htmlFor="search" className="text-xs font-semibold">Buscar</Label>
              <div className="relative mt-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input id="search" className="pl-9" placeholder="Nombre o número de lista..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {(!level && !grade && !groupId && !groupName) ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Selecciona un nivel, grado o grupo</h3>
              <p className="text-sm text-slate-500 mt-1">Usa los filtros de arriba para ver la lista de alumnos.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Sin alumnos encontrados</h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">No hay alumnos que coincidan con estos filtros o aún no agregas ninguno al grupo.</p>
              {groups.length > 0 && (
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={openBulk}><Users className="w-4 h-4 mr-1.5" /> Pegar lista</Button>
                  <Button onClick={openCreate} className="bg-sky-500 hover:bg-sky-600"><UserPlus className="w-4 h-4 mr-1.5" /> Agregar alumno</Button>
                </div>
              )}
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
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(s) }} aria-label="Editar alumno"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); remove(s) }} aria-label="Eliminar alumno"><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Grupo destino *</Label>
                <Select value={modalGroupId} onValueChange={setModalGroupId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona el grupo..." /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.level} · {g.grade ? g.grade + ' ' : ''}{g.name || g.group_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first_name" className="text-xs font-semibold">Nombre(s) *</Label>
                  <Input id="first_name" className="mt-1" aria-invalid={!!errors.first_name} aria-describedby={errors.first_name ? "first_name_error" : undefined} {...register('first_name')} />
                  {errors.first_name && <p id="first_name_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.first_name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-xs font-semibold">Apellido(s) *</Label>
                  <Input id="last_name" className="mt-1" aria-invalid={!!errors.last_name} aria-describedby={errors.last_name ? "last_name_error" : undefined} {...register('last_name')} />
                  {errors.last_name && <p id="last_name_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.last_name.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="student_number" className="text-xs font-semibold">N° lista</Label>
                  <Input id="student_number" type="number" className="mt-1" aria-invalid={!!errors.student_number} aria-describedby={errors.student_number ? "student_number_error" : undefined} {...register('student_number', { valueAsNumber: true })} />
                  {errors.student_number && <p id="student_number_error" role="alert" className="text-2xs text-rose-500 mt-1">{errors.student_number.message}</p>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="guardian_name" className="text-xs font-semibold">Tutor / Contacto</Label>
                  <Input id="guardian_name" className="mt-1" placeholder="Opcional" {...register('guardian_name')} />
                </div>
              </div>
              <div>
                <Label htmlFor="guardian_contact" className="text-xs font-semibold">Teléfono del tutor</Label>
                <Input id="guardian_contact" className="mt-1" placeholder="Opcional" {...register('guardian_contact')} />
              </div>
              <div>
                <Label htmlFor="nfc_uid" className="text-xs font-semibold">Tarjeta NFC asignada</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    id="nfc_uid"
                    className="flex-1 bg-slate-50 font-mono text-xs" 
                    readOnly 
                    placeholder="Sin tarjeta..." 
                    {...register('nfc_uid')}
                  />
                  <Button variant="outline" type="button" onClick={scanNfcForStudent} aria-label="Escanear tarjeta NFC">
                    <SmartphoneNfc className="w-4 h-4 mr-1.5 text-indigo-500" aria-hidden="true" /> Leer
                  </Button>
                  {watch('nfc_uid') && (
                    <Button variant="ghost" type="button" onClick={() => setValue('nfc_uid', '')} className="text-rose-500 px-2" title="Quitar tarjeta" aria-label="Quitar tarjeta NFC">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="notes" className="text-xs font-semibold">Notas del docente</Label>
                <Textarea id="notes" className="mt-1 resize-none" rows={2} {...register('notes')} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-sky-500 hover:bg-sky-600">
                {isSubmitting ? 'Guardando...' : editing ? 'Guardar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pegar lista de alumnos</DialogTitle>
            <DialogDescription>Pega los nombres, un alumno por línea. El primer nombre es el nombre, el resto el apellido.</DialogDescription>
          </DialogHeader>
          <div className="mb-2">
            <Label className="text-xs font-semibold">Grupo destino *</Label>
            <Select value={modalGroupId} onValueChange={setModalGroupId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona el grupo..." /></SelectTrigger>
              <SelectContent>
                {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.level} · {g.grade ? g.grade + ' ' : ''}{g.name || g.group_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Textarea rows={10} placeholder={"Ana López García\nLuis Pérez\nMaría Sánchez Rivera\n..."} value={bulkText} onChange={e => setBulkText(e.target.value)} className="font-mono text-sm" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button onClick={saveBulk} className="bg-sky-500 hover:bg-sky-600">Agregar {bulkText.split('\n').filter(s => s.trim()).length} alumnos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
