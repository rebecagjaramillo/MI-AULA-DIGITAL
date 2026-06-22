'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, CheckCircle2, SmartphoneNfc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { initials } from '@/lib/helpers'
import { STATUS_CONFIG } from '@/lib/constants'
import { PageLayout } from '@/components/layout/PageLayout'
import { useStore } from '@/store/useStore'
import { FilterBar } from '@/components/shared/FilterBar'

export function AttendanceClient({ serverStudents, serverAttendance, resolvedGroupId, resolvedDate }) {
  const router = useRouter()
  const groups = useStore(s => s.groups)
  
  const groupId = resolvedGroupId || ''
  const date = resolvedDate

  const [filter, setFilter] = useState({ group_id: groupId })

  const setGroupId = (newId) => router.push(`/asistencia?groupId=${newId}&date=${date}`)
  const setDateUrl = (newDate) => router.push(`/asistencia?groupId=${groupId}&date=${newDate}`)

  const students = serverStudents || []
  const attendanceRecords = serverAttendance?.records || []
  const initialNotes = serverAttendance?.session?.notes || ''

  // Mapear los registros que vienen del servidor a nuestro estado de edición local
  const [statuses, setStatuses] = useState({})
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  // Sincronizar el estado interno cuando cambien los props del servidor
  useEffect(() => {
    const map = {}
    attendanceRecords.forEach(r => { map[r.student_id] = r.status })
    students.forEach(s => { if (!map[s.id]) map[s.id] = '' })
    setStatuses(map)
    setNotes(initialNotes)
  }, [students, attendanceRecords, initialNotes])

  const setStatus = (sid, st) => setStatuses(p => ({ ...p, [sid]: p[sid] === st ? '' : st }))
  const markAllPresent = () => {
    const m = {}; students.forEach(s => { m[s.id] = 'presente' }); setStatuses(m)
  }

  const startNfcScan = async () => {
    if (!('NDEFReader' in window)) {
      toast.error('Tu navegador no soporta lectura NFC. Usa Chrome en Android.')
      return
    }

    try {
      const ndef = new window.NDEFReader()
      await ndef.scan()
      toast.info('Lector NFC activado. Acerca la tarjeta de un alumno al celular...', { duration: 5000 })

      ndef.onreading = async (event) => {
        const nfcUid = event.serialNumber 
        try {
          const res = await api('attendance/nfc', { 
            method: 'POST', 
            body: JSON.stringify({ nfc_uid: nfcUid, groupId: groupId, date: date }) 
          })
          toast.success(`✅ Asistencia registrada: ${res.student_name}`)
          setStatus(res.student_id, 'presente')
        } catch (e) {
          toast.error(`❌ Error: ${e.message}`)
        }
      }
      
      ndef.onreadingerror = () => {
        toast.error('Error al leer la tarjeta. Intenta de nuevo.')
      }
      
    } catch (error) {
      toast.error('No se pudo iniciar el lector NFC: ' + error.message)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const records = students.map(s => ({ student_id: s.id, status: statuses[s.id] || 'presente' }))
      await api('attendance/save', { method: 'POST', body: JSON.stringify({ groupId, date, records, notes }) })
      toast.success('Asistencia guardada ✓')
      router.refresh() // Refetch en el Server Component
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const counts = useMemo(() => {
    const c = { presente: 0, falta: 0, retardo: 0, justificado: 0, sin: 0 }
    students.forEach(s => {
      const st = statuses[s.id] || ''
      if (c[st] !== undefined) c[st]++; else c.sin++
    })
    return c
  }, [statuses, students])

  const activeGroup = groups.find(g => g.id === groupId)

  return (
    <PageLayout
      title="Pase de asistencia"
      subtitle="Registra la asistencia del día rápidamente."
      action={
        <Button onClick={save} disabled={!students.length || saving} className="bg-emerald-500 hover:bg-emerald-600 shadow-md">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar asistencia'}
        </Button>
      }
    >

      <FilterBar
        value={{ ...filter, group_id: groupId }}
        onChange={(v) => { setFilter(v); if (v.group_id !== undefined) setGroupId(v.group_id || '') }}
        groups={groups} subjects={[]}
        show={['level','group']}
        groupFilterMode="id"
      />

      <Card className="border-slate-100 mb-4 mt-4">
        <CardContent className="p-4 flex flex-col md:flex-row items-end gap-3">
          <div className="w-full md:flex-1">
            <Label className="text-xs font-semibold">Fecha</Label>
            <Input type="date" className="mt-1 w-full" value={date} onChange={e => setDateUrl(e.target.value)} />
          </div>
          <Button variant="outline" className="w-full md:flex-1 h-10" onClick={markAllPresent} disabled={!students.length}>
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Marcar todos presentes
          </Button>
          <Button variant="outline" className="w-full md:flex-1 h-10" onClick={startNfcScan} disabled={!students.length}>
            <SmartphoneNfc className="w-4 h-4 mr-1.5 text-indigo-500" /> Escanear NFC
          </Button>
        </CardContent>
      </Card>

      {/* Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {Object.entries(STATUS_CONFIG).map(([k, cfg]) => {
          const Icon = cfg.icon
          return (
            <div key={k} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${cfg.color.split(' ').slice(0,2).join(' ')} flex items-center justify-center`}>
                {Icon && <Icon className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 leading-none">{counts[k]}</div>
                <div className="text-xs text-slate-500 mt-1">{cfg.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {!groupId || students.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{!groupId ? 'Selecciona un grupo' : 'Sin alumnos'}</h3>
          <p className="text-sm text-slate-500 mt-1">{!groupId ? 'Selecciona un grupo para pasar lista.' : 'Agrega alumnos al grupo para tomar asistencia.'}</p>
        </div>
      ) : (
        <Card className="border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {students.map(s => {
              const current = statuses[s.id] || ''
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    {s.student_number || initials(s.first_name + ' ' + s.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{s.first_name} {s.last_name}</div>
                    {s.student_number && <div className="text-xs text-slate-500">N° {s.student_number}</div>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {Object.entries(STATUS_CONFIG).map(([k, cfg]) => {
                      const Icon = cfg.icon
                      const active = current === k
                      return (
                        <button
                          key={k}
                          onClick={() => setStatus(s.id, k)}
                          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            active ? cfg.color + ' shadow-sm scale-105' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                          }`}
                          title={cfg.label}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{cfg.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Label className="text-xs font-semibold">Notas de la sesión</Label>
            <Textarea className="mt-1 resize-none bg-white" rows={2} placeholder="Observaciones del día..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </Card>
      )}
    </PageLayout>
  )
}
