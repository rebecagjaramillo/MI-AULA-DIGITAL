'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, Users, ClipboardCheck, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { initials, todayISO } from '@/lib/helpers'
import { STATUS_CONFIG, LEVELS_NEW } from '@/lib/constants'
import { PageLayout } from '@/components/layout/PageLayout'
import { useProfile } from '@/contexts/ProfileContext'
import { FilterBar } from '@/components/shared/FilterBar'

export function ReportsClient({ serverGroups, serverStudents }) {
  const { profile } = useProfile()
  const customLevels = Array.isArray(profile?.education_levels) && profile.education_levels.length > 0 ? profile.education_levels : []

  const [reportType, setReportType] = useState('group')
  const [filter, setFilter] = useState({})
  const groupId = filter.group_id || ''
  const filteredStudents = serverStudents.filter(s => s.groupId === groupId)
  
  const [studentId, setStudentId] = useState('')
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10) })
  const [to, setTo] = useState(todayISO())
  
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  // Removed filteredGroups effect as FilterBar manages this internally

  useEffect(() => {
    if (!filteredStudents.find(s => s.id === studentId) && filteredStudents.length > 0) {
      setStudentId(filteredStudents[0].id)
    }
  }, [filteredStudents, studentId])

  const handleClear = () => {
    setFilter({})
    const d = new Date()
    d.setDate(d.getDate() - 30)
    setFrom(d.toISOString().slice(0, 10))
    setTo(todayISO())
    setPreview(null)
  }

  const fetchPreview = async () => {
    setLoading(true); setPreview(null)
    try {
      if (reportType === 'student') {
        if (!studentId) return toast.error('Selecciona un alumno')
        const data = await api(`reports/student?studentId=${studentId}&from=${from}&to=${to}`)
        setPreview({ kind: 'student', data })
      } else {
        if (!groupId) return toast.error('Selecciona un grupo')
        const data = await api(`reports/group?groupId=${groupId}&from=${from}&to=${to}`)
        setPreview({ kind: reportType, data })
      }
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const downloadPDF = async () => {
    if (!preview) return
    try {
      const mod = await import('@/lib/pdfReports')
      let doc
      let fname
      const today = todayISO()
      if (preview.kind === 'student') {
        doc = await mod.generateStudentReportPDF(preview.data)
        fname = `Reporte_${preview.data.student.first_name}_${preview.data.student.last_name}_${today}.pdf`
      } else if (preview.kind === 'attendance') {
        doc = await mod.generateAttendanceListPDF(preview.data)
        fname = `Asistencia_${preview.data.group.grade}_${preview.data.group.group_name}_${today}.pdf`
      } else {
        doc = await mod.generateGroupReportPDF(preview.data)
        fname = `Reporte_Grupal_${preview.data.group.grade}_${preview.data.group.group_name}_${today}.pdf`
      }
      doc.save(fname)
      toast.success('PDF descargado ✓')
    } catch (e) {
      console.error(e)
      toast.error('Error al generar PDF: ' + e.message)
    }
  }

  const reportTypes = [
    { key: 'group',      label: 'Reporte grupal',     desc: 'Asistencia, actividades y promedio por alumno', icon: LayoutGrid,    color: 'bg-sky-500' },
    { key: 'student',    label: 'Reporte individual', desc: 'Detalle completo de un alumno',                  icon: Users,         color: 'bg-violet-500' },
    { key: 'attendance', label: 'Reporte de asistencia', desc: 'Concentrado de asistencias del periodo',     icon: ClipboardCheck, color: 'bg-emerald-500' },
  ]

  return (
    <PageLayout title="Reportes" subtitle="Genera y exporta reportes profesionales en PDF">
      <Card className="border-slate-100 mb-5">
        <CardContent className="p-5">
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">Tipo de reporte</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {reportTypes.map(t => {
              const Icon = t.icon
              const active = reportType === t.key
              return (
                <button key={t.key} onClick={() => setReportType(t.key)} className={`text-left p-4 rounded-xl border-2 transition-all ${active ? 'border-sky-400 bg-sky-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 ${t.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{t.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <FilterBar
            value={filter}
            onChange={(v) => { setFilter(v) }}
            groups={serverGroups} subjects={[]}
            show={['level','group']}
            groupFilterMode="id"
          />

          {reportType === 'student' && (
            <div className="flex flex-col md:flex-row items-end gap-3 mb-4">
              <div className="flex-1 w-full">
                <Label htmlFor="studentId" className="text-xs font-semibold">Alumno</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger id="studentId" className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{filteredStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-end gap-3 mb-1">
            <div className="flex-1 w-full">
              <Label htmlFor="from" className="text-xs font-semibold">Desde</Label>
              <Input id="from" type="date" className="mt-1 w-full" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="flex-1 w-full">
              <Label htmlFor="to" className="text-xs font-semibold">Hasta</Label>
              <Input id="to" type="date" className="mt-1 w-full" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <Button size="sm" variant="ghost" onClick={handleClear} className="h-10 text-slate-500 hover:text-slate-700 text-xs px-4">
              Limpiar
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={fetchPreview} disabled={loading} className="bg-sky-500 hover:bg-sky-600">
              {loading ? 'Generando...' : 'Generar vista previa'}
            </Button>
            {preview && (
              <Button onClick={downloadPDF} className="bg-emerald-500 hover:bg-emerald-600 shadow-md">
                <FileText className="w-4 h-4 mr-1.5" /> Descargar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {preview && <ReportPreview preview={preview} />}
    </PageLayout>
  )
}

function ReportPreview({ preview }) {
  const { kind, data } = preview
  if (kind === 'student') {
    const s = data.student
    return (
      <Card className="border-slate-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg">
              {s.student_number || initials(s.first_name + ' ' + s.last_name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{s.first_name} {s.last_name}</h2>
              <p className="text-sm text-slate-500">{data.group?.grade} {data.group?.group_name} · N° {s.student_number || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-sky-50 rounded-xl p-4 border-l-4 border-sky-400">
              <div className="text-2xl font-bold text-slate-900">{data.attendance.attendance_pct !== null ? data.attendance.attendance_pct + '%' : '—'}</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Asistencia</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border-l-4 border-emerald-400">
              <div className="text-2xl font-bold text-slate-900">{data.average ?? '—'}</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Promedio</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 border-l-4 border-rose-400">
              <div className="text-2xl font-bold text-slate-900">{data.attendance.falta}</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Faltas</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
              <div className="text-2xl font-bold text-slate-900">{data.attendance.retardo}</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Retardos</div>
            </div>
          </div>

          <h3 className="font-semibold text-slate-900 mb-2 text-sm">Calificaciones ({data.grades.length})</h3>
          <div className="border border-slate-100 rounded-xl overflow-hidden mb-5">
            {data.grades.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 italic">Sin actividades en el periodo.</div>
            ) : (
              <table className="w-full text-sm" aria-label={`Calificaciones de ${s.first_name} ${s.last_name}`}>
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                  <tr><th className="text-left p-3">Actividad</th><th className="text-left p-3">Entrega</th><th className="text-left p-3">Estado</th><th className="text-right p-3">Puntaje</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.grades.map((g, i) => (
                    <tr key={i}>
                      <td className="p-3 font-medium text-slate-800">{g.title}</td>
                      <td className="p-3 text-slate-600">{new Date(g.due_date).toLocaleDateString('es-MX')}</td>
                      <td className="p-3"><span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{g.status}</span></td>
                      <td className="p-3 text-right font-bold">{g.score !== null && g.score !== undefined ? `${g.score} / ${g.max_score}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h3 className="font-semibold text-slate-900 mb-2 text-sm">Historial reciente de asistencia</h3>
          <div className="border border-slate-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {data.attendance.records.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 italic">Sin registros.</div>
            ) : (
              <table className="w-full text-sm" aria-label={`Asistencia de ${s.first_name} ${s.last_name}`}>
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase sticky top-0">
                  <tr><th className="text-left p-3">Fecha</th><th className="text-left p-3">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.attendance.records.map((r, i) => {
                    const cfg = STATUS_CONFIG[r.status] || {}
                    return (
                      <tr key={i}>
                        <td className="p-3 text-slate-700">{new Date(r.date).toLocaleDateString('es-MX')}</td>
                        <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${cfg.color || ''}`}>{cfg.label || r.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group / attendance preview
  return (
    <Card className="border-slate-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{kind === 'attendance' ? 'Asistencia' : 'Reporte Grupal'} · {data.group?.grade} {data.group?.group_name}</h2>
            <p className="text-sm text-slate-500">{data.group?.subject || ''} · {data.from} → {data.to}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-sky-50 rounded-xl p-4 border-l-4 border-sky-400">
            <div className="text-2xl font-bold text-slate-900">{data.summary.total_students}</div>
            <div className="text-xs text-slate-600 mt-1 font-medium">Alumnos</div>
          </div>
          <div className="bg-violet-50 rounded-xl p-4 border-l-4 border-violet-400">
            <div className="text-2xl font-bold text-slate-900">{data.summary.total_sessions}</div>
            <div className="text-xs text-slate-600 mt-1 font-medium">Sesiones</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
            <div className="text-2xl font-bold text-slate-900">{data.summary.total_activities}</div>
            <div className="text-xs text-slate-600 mt-1 font-medium">Actividades</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border-l-4 border-emerald-400">
            <div className="text-2xl font-bold text-slate-900">{(data.summary.avg_attendance || 0).toFixed(0)}%</div>
            <div className="text-xs text-slate-600 mt-1 font-medium">Asistencia prom.</div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-x-auto">
          <table className="w-full text-sm" aria-label={`Reporte general del grupo ${data.group?.group_name}`}>
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left p-3">N°</th>
                <th className="text-left p-3">Alumno</th>
                <th className="text-center p-3">Presente</th>
                <th className="text-center p-3">Faltas</th>
                <th className="text-center p-3">Retardos</th>
                <th className="text-center p-3">Justif.</th>
                <th className="text-center p-3">Asist. %</th>
                {kind !== 'attendance' && <>
                  <th className="text-center p-3">Act. ✓</th>
                  <th className="text-center p-3">Act. ⏳</th>
                  <th className="text-center p-3">Promedio</th>
                </>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-slate-500">{s.student_number || ''}</td>
                  <td className="p-3 font-medium text-slate-800">{s.first_name} {s.last_name}</td>
                  <td className="p-3 text-center">{s.presente}</td>
                  <td className={`p-3 text-center font-medium ${s.falta >= 3 ? 'text-rose-600' : ''}`}>{s.falta}</td>
                  <td className="p-3 text-center">{s.retardo}</td>
                  <td className="p-3 text-center">{s.justificado}</td>
                  <td className={`p-3 text-center font-bold ${s.attendance_pct === null ? 'text-slate-400' : s.attendance_pct < 70 ? 'text-rose-600' : s.attendance_pct >= 90 ? 'text-emerald-600' : 'text-slate-700'}`}>{s.attendance_pct !== null ? s.attendance_pct + '%' : '—'}</td>
                  {kind !== 'attendance' && <>
                    <td className="p-3 text-center text-emerald-600 font-medium">{s.activities_done}</td>
                    <td className="p-3 text-center text-amber-600 font-medium">{s.activities_pending}</td>
                    <td className={`p-3 text-center font-bold ${!s.average ? 'text-slate-400' : Number(s.average) < 7 ? 'text-rose-600' : Number(s.average) >= 9 ? 'text-emerald-600' : 'text-slate-700'}`}>{s.average ?? '—'}</td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
