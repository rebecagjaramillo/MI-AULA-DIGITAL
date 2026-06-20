'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutGrid, Users, ClipboardCheck, TrendingUp, Sparkles, UserPlus, Plus,
  ListChecks, Presentation, BookMarked, FileText, Library, Bell, CheckCircle2,
  AlertTriangle, Award, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api, formatDateLong } from '@/lib/api'
import { useProfile } from '@/contexts/ProfileContext'

function StatCard({ icon: Icon, label, value, sub, gradient, iconColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 leading-none">{value}</div>
      <div className="text-sm font-medium text-slate-600 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</span>
    </button>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { profile, activeSubject } = useProfile()
  const [rawData, setRawData] = useState(null)

  const load = () => api('dashboard').then(setRawData).catch(e => toast.error(e.message))
  useEffect(() => { load() }, [])

  const greet = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const data = useMemo(() => {
    if (!rawData || !activeSubject) return rawData;
    
    // Filtramos los grupos por la materia activa
    const filteredGroups = rawData.groups.filter(g => g.subject === activeSubject);
    const validGroupIds = new Set(filteredGroups.map(g => g.id));
    
    return {
      ...rawData,
      groups: filteredGroups,
      groups_count: filteredGroups.length,
      alerts: rawData.alerts.filter(a => validGroupIds.has(a.group_id)),
      upcoming_activities: rawData.upcoming_activities.filter(a => validGroupIds.has(a.group_id)),
      // Nota: students_count y attendance_pct_last7 son globales en esta versión simplificada
    }
  }, [rawData, activeSubject])

  if (!data) return <div className="p-8 text-slate-500">Cargando...</div>

  return (
    <div>
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 text-white p-7 mb-6 shadow-lg">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="text-sky-100 text-sm font-medium capitalize">{formatDateLong()}</div>
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{greet}, {profile?.display_name || 'Maestro/a'} 👋</h1>
          <p className="text-sky-100 mt-2 max-w-xl">Aquí tienes un resumen de tu aula. ¡Que tengas un excelente día de clase!</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <Button onClick={() => router.push('/asistencia')} size="sm" className="bg-white text-sky-700 hover:bg-sky-50 font-semibold shadow-md">
              <ClipboardCheck className="w-4 h-4 mr-1.5" /> Tomar asistencia
            </Button>
            <Button onClick={() => router.push('/alumnos')} size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <UserPlus className="w-4 h-4 mr-1.5" /> Agregar alumno
            </Button>
            <Button onClick={() => router.push('/grupos')} size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Plus className="w-4 h-4 mr-1.5" /> Nuevo grupo
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={LayoutGrid} label="Grupos activos" value={data.groups_count} gradient="bg-sky-100" iconColor="text-sky-600" />
        <StatCard icon={Users} label="Alumnos en total" value={data.students_count} gradient="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard icon={ClipboardCheck} label="Asistencias hoy" value={data.today_sessions_count} sub="sesiones registradas" gradient="bg-violet-100" iconColor="text-violet-600" />
        <StatCard icon={TrendingUp} label="Asistencia 7 días" value={data.attendance_pct_last7 !== null ? data.attendance_pct_last7 + '%' : '—'} gradient="bg-amber-100" iconColor="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500" /> Accesos rápidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <QuickAction icon={ClipboardCheck} label="Tomar asistencia" color="bg-sky-500" onClick={() => router.push('/asistencia')} />
                <QuickAction icon={UserPlus} label="Agregar alumno" color="bg-emerald-500" onClick={() => router.push('/alumnos')} />
                <QuickAction icon={LayoutGrid} label="Nuevo grupo" color="bg-violet-500" onClick={() => router.push('/grupos')} />
                <QuickAction icon={ListChecks} label="Crear actividad" color="bg-amber-500" onClick={() => router.push('/actividades')} />
                <QuickAction icon={Presentation} label="Pantalla de clase" color="bg-pink-500" onClick={() => router.push('/pantalla-clase')} />
                <QuickAction icon={BookMarked} label="Crear planeación" color="bg-indigo-500" onClick={() => router.push('/planeaciones')} />
                <QuickAction icon={FileText} label="Generar reporte" color="bg-rose-500" onClick={() => router.push('/reportes')} />
                <QuickAction icon={Library} label="Biblioteca" color="bg-teal-500" onClick={() => router.push('/biblioteca')} />
              </div>
            </CardContent>
          </Card>

          {/* My groups list */}
          <Card className="mt-6 border-slate-100">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-sky-500" /> Mis grupos
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => router.push('/grupos')} className="text-sky-600 hover:text-sky-700 h-8">
                Ver todos <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {data.groups.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <LayoutGrid className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 mb-3">Aún no tienes grupos creados</p>
                  <Button size="sm" onClick={() => router.push('/grupos')} className="bg-sky-500 hover:bg-sky-600">
                    <Plus className="w-4 h-4 mr-1" /> Crear mi primer grupo
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.groups.slice(0, 6).map(g => (
                    <button key={g.id} onClick={() => router.push(`/alumnos?groupId=${g.id}`)} className="text-left p-3.5 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all group">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm" style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}dd)` }}>
                          {g.grade?.replace('°','').slice(0,2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">{g.grade} {g.group_name} {g.subject && `· ${g.subject}`}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{g.school_year}</div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">{g.student_count || 0} 👥</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts panel */}
        <div className="space-y-6">
          <Card className="border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" /> Alertas inteligentes
                {data.alerts.length > 0 && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">{data.alerts.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.alerts.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500">¡Sin alertas! Todo en orden.</p>
                </div>
              ) : data.alerts.slice(0, 5).map((a, i) => (
                <div key={i} className={`p-3 rounded-xl border ${a.priority === 'high' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.priority === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{a.student_name}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{a.description}</div>
                      <div className="text-[11px] text-slate-500 mt-1 italic">→ {a.suggested_action}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-gradient-to-br from-violet-50 to-pink-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-500" /> Frase del día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 italic leading-relaxed">"La educación no es la preparación para la vida; la educación es la vida misma."</p>
              <p className="text-xs text-slate-500 mt-2">— John Dewey</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
