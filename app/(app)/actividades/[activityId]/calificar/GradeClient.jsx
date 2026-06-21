'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { initials } from '@/lib/helpers'
import { ACTIVITY_TYPES, GRADE_STATUSES } from '@/lib/constants'
import { PageLayout } from '@/components/layout/PageLayout'

export function GradeClient({ activity, students, serverGrades }) {
  const router = useRouter()

  const [grades, setGrades] = useState({})
  const [saving, setSaving] = useState(false)

  // Inicializar estado local a partir de los datos del servidor
  useEffect(() => {
    const m = {}
    students.forEach(s => {
      const g = serverGrades[s.id]
      m[s.id] = g 
        ? { score: g.score ?? '', status: g.status || 'pendiente', feedback: g.feedback || '' } 
        : { score: '', status: 'pendiente', feedback: '' }
    })
    setGrades(m)
  }, [students, serverGrades])

  const updateGrade = (sid, patch) => setGrades(g => ({ ...g, [sid]: { ...g[sid], ...patch } }))
  
  const save = async () => {
    setSaving(true)
    try {
      const records = students.map(s => ({ 
        student_id: s.id, 
        ...grades[s.id], 
        status: (grades[s.id].score !== '' && grades[s.id].score !== null) ? 'calificado' : grades[s.id].status 
      }))
      await api(`activities/${activity.id}/grades`, { method: 'POST', body: JSON.stringify({ records }) })
      toast.success('Calificaciones guardadas ✓')
      router.refresh()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Prevenir cálculos en primer render si no ha hidratado el estado
  if (Object.keys(grades).length === 0 && students.length > 0) {
    return <PageLayout isLoading />
  }

  const validScores = students.map(s => grades[s.id]?.score).filter(x => x !== '' && x !== null && !isNaN(Number(x))).map(Number)
  const avg = validScores.length ? (validScores.reduce((a,b) => a+b, 0) / validScores.length).toFixed(1) : '—'
  const type = activity ? (ACTIVITY_TYPES.find(t => t.value === activity.activity_type) || ACTIVITY_TYPES[0]) : null

  return (
    <PageLayout
      title={activity?.title || 'Cargando actividad...'}
      subtitle={activity ? `Máximo: ${activity.max_score} pts · Promedio actual: ${avg}` : ''}
      action={
        <Button onClick={save} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 shadow-md">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar calificaciones'}
        </Button>
      }
    >
      <button onClick={() => router.push('/actividades')} className="text-sm text-sky-600 hover:text-sky-700 mb-3 flex items-center gap-1 font-medium">
        ← Volver a actividades
      </button>

      {activity && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={`${type?.color} hover:${type?.color}`}>{type?.label}</Badge>
            <Badge variant="outline">Entrega: {new Date(activity.due_date).toLocaleDateString('es-MX')}</Badge>
          </div>

          {activity.description && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4 text-sm text-slate-700">{activity.description}</div>
          )}
        </>
      )}

      <Card className="border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {students.map(s => {
            const g = grades[s.id] || { score: '', status: 'pendiente', feedback: '' }
            return (
              <div key={s.id} className="p-3 sm:p-4 hover:bg-slate-50/40">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    {s.student_number || initials(s.first_name + ' ' + s.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{s.first_name} {s.last_name}</div>
                    {s.student_number && <div className="text-xs text-slate-500">N° {s.student_number}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max={activity?.max_score}
                        placeholder="—"
                        className="w-20 text-center font-bold text-base"
                        value={g.score}
                        onChange={e => updateGrade(s.id, { score: e.target.value })}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">/{activity?.max_score}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-13 pl-13" style={{ marginLeft: '52px' }}>
                  {GRADE_STATUSES.map(st => (
                    <button
                      key={st.value}
                      onClick={() => updateGrade(s.id, { status: st.value })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${g.status === st.value ? st.color + ' shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    >
                      {st.label}
                    </button>
                  ))}
                  <Input
                    placeholder="Retroalimentación..."
                    className="flex-1 min-w-[200px] h-7 text-xs"
                    value={g.feedback}
                    onChange={e => updateGrade(s.id, { feedback: e.target.value })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </PageLayout>
  )
}
