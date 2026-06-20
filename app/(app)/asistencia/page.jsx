'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClipboardCheck, CheckCircle2, SmartphoneNfc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { initials, todayISO } from '@/lib/helpers'
import { STATUS_CONFIG } from '@/lib/constants'
import { TopBar } from '@/components/layout/TopBar'
import { FilterBar } from '@/components/shared/FilterBar'
import { useGroups } from '@/contexts/GroupsContext'

function AttendanceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramGroupId = searchParams.get('groupId')
  
  const { groups } = useGroups()
  const groupId = paramGroupId || (groups.length > 0 ? groups[0].id : '')
  const setGroupId = (newId) => router.push(`/asistencia?groupId=${newId}`)

  const [date, setDate] = useState(todayISO())
  const [students, setStudents] = useState([])
  const [statuses, setStatuses] = useState({}) // student_id -> status
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!groupId) return
    Promise.all([
      api('students?groupId=' + groupId),
      api('attendance?groupId=' + groupId + '&date=' + date),
    ]).then(([stu, att]) => {
      setStudents(stu)
      const map = {}
      att.records.forEach(r => { map[r.student_id] = r.status })
      // Default to presente
      stu.forEach(s => { if (!map[s.id]) map[s.id] = '' })
      setStatuses(map)
      setNotes(att.session?.notes || '')
    }).catch(e => toast.error(e.message))
  }, [groupId, date])

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
    <div>
      <TopBar
        title="Pase de asistencia"
        subtitle="Registra la asistencia del día rápidamente. Tap en cada estado."
        action={
          <Button onClick={save} disabled={!students.length || saving} className="bg-emerald-500 hover:bg-emerald-600 shadow-md">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar asistencia'}
          </Button>
        }
      />

      <FilterBar
        value={{ group_id: groupId }}
        onChange={(v) => { if (v.group_id !== undefined) setGroupId(v.group_id || '') }}
        groups={groups} subjects={[]}
        show={['level','grade','group']}
      />

      <Card className="border-slate-100 mb-4">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <Label className="text-xs font-semibold">Fecha</Label>
            <Input type="date" className="mt-1" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <Button variant="outline" onClick={markAllPresent} disabled={!students.length}>
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Marcar todos presentes
          </Button>
          <Button variant="outline" onClick={startNfcScan} disabled={!students.length}>
            <SmartphoneNfc className="w-4 h-4 mr-1.5 text-indigo-500" /> Escanear Tarjetas NFC
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
          <p className="text-sm text-slate-500 mt-1">{!groupId ? 'Primero crea un grupo y agrega alumnos.' : 'Agrega alumnos al grupo para tomar asistencia.'}</p>
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
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Cargando asistencia...</div>}>
      <AttendanceContent />
    </Suspense>
  )
}
