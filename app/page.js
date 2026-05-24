'use client'

import { useEffect, useState, useMemo } from 'react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Responsive, WidthProvider } from 'react-grid-layout/legacy'
import {
  Home, Users, BookOpen, ClipboardCheck, FileText, Calendar as CalendarIcon,
  LayoutGrid, Library, Settings, Sparkles, GraduationCap, Plus, Search,
  CheckCircle2, XCircle, Clock3, ShieldCheck, AlertTriangle, TrendingUp,
  ChevronRight, Pencil, Trash2, UserPlus, BookMarked, Presentation,
  ListChecks, Award, Bell, MoreHorizontal, MapPin, School, Palette,
  Play, Pause, RotateCcw, Shuffle, Lightbulb, Eye, EyeOff, Maximize,
  Minimize, Volume2, Lock, Unlock, Dices, Trophy, X, Timer, SmartphoneNfc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

// ============== Constantes ==============
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Inicio', icon: Home },
  { key: 'groups', label: 'Mis grupos', icon: LayoutGrid },
  { key: 'students', label: 'Alumnos', icon: Users },
  { key: 'attendance', label: 'Asistencia', icon: ClipboardCheck },
  { key: 'activities', label: 'Actividades', icon: ListChecks },
  { key: 'screen', label: 'Pantalla de clase', icon: Presentation },
  { key: 'plans', label: 'Planeaciones', icon: BookMarked },
  { key: 'curriculum', label: 'Temarios', icon: BookOpen },
  { key: 'reports', label: 'Reportes', icon: FileText },
  { key: 'library', label: 'Biblioteca', icon: Library },
  { key: 'calendar', label: 'Calendario', icon: CalendarIcon },
  { key: 'settings', label: 'Configuración', icon: Settings },
]

const GROUP_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'
]

const STATUS_CONFIG = {
  presente:    { label: 'Presente',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  falta:       { label: 'Falta',       color: 'bg-rose-100 text-rose-700 border-rose-200',         dot: 'bg-rose-500',    icon: XCircle },
  retardo:     { label: 'Retardo',     color: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   icon: Clock3 },
  justificado: { label: 'Justificado', color: 'bg-sky-100 text-sky-700 border-sky-200',             dot: 'bg-sky-500',     icon: ShieldCheck },
}

const ACTIVITY_TYPES = [
  { value: 'tarea', label: 'Tarea', color: 'bg-sky-100 text-sky-700' },
  { value: 'trabajo_clase', label: 'Trabajo en clase', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'proyecto', label: 'Proyecto', color: 'bg-violet-100 text-violet-700' },
  { value: 'examen', label: 'Examen', color: 'bg-rose-100 text-rose-700' },
  { value: 'participacion', label: 'Participación', color: 'bg-amber-100 text-amber-700' },
  { value: 'exposicion', label: 'Exposición', color: 'bg-pink-100 text-pink-700' },
  { value: 'practica', label: 'Práctica', color: 'bg-teal-100 text-teal-700' },
  { value: 'producto', label: 'Producto', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'otro', label: 'Otro', color: 'bg-slate-100 text-slate-700' },
]
const GRADE_STATUSES = [
  { value: 'pendiente',     label: 'Pendiente',    color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'entregado',     label: 'Entregado',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'tarde',         label: 'Tarde',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'no_entregado',  label: 'No entregó',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'incompleto',    label: 'Incompleto',   color: 'bg-orange-100 text-orange-700 border-orange-200' },
]

const GRADES = ['1°','2°','3°','4°','5°','6°','1° Sec','2° Sec','3° Sec','1° Prepa','2° Prepa','3° Prepa']

const LEVELS_NEW = [
  { key: 'Preescolar',   label: 'Preescolar',   color: '#f59e0b', grades: ['1°','2°','3°'] },
  { key: 'Primaria',     label: 'Primaria',     color: '#3b82f6', grades: ['1°','2°','3°','4°','5°','6°'] },
  { key: 'Secundaria',   label: 'Secundaria',   color: '#10b981', grades: ['1°','2°','3°'] },
  { key: 'Preparatoria', label: 'Preparatoria', color: '#8b5cf6', grades: ['1°','2°','3°','4°','5°','6°'] },
]
const TRIMESTRES = [
  { value: 1, label: 'T1' },
  { value: 2, label: 'T2' },
  { value: 3, label: 'T3' },
]
const DEFAULT_TERM_DATES = {
  t1: { start_month: 8,  end_month: 11 },
  t2: { start_month: 12, end_month: 3  },
  t3: { start_month: 4,  end_month: 7  },
}
function getTrimestre(dateStr, termDates) {
  if (!dateStr) return null
  const td = termDates || DEFAULT_TERM_DATES
  const m = new Date(dateStr).getMonth() + 1
  const inRange = (r) => {
    const { start_month: s, end_month: e } = r
    if (s <= e) return m >= s && m <= e
    return m >= s || m <= e
  }
  if (inRange(td.t1)) return 1
  if (inRange(td.t2)) return 2
  if (inRange(td.t3)) return 3
  return null
}
const LEVELS = ['Preescolar','Primaria','Secundaria','Preparatoria','Universidad','Otro']
const SHIFTS = ['Matutino','Vespertino','Mixto']

// ============== Helpers ==============
function todayISO() { return new Date().toISOString().slice(0,10) }
function formatDateLong(d = new Date()) {
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function api(path, opts = {}) {
  return fetch('/api/' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  }).then(async r => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || 'Error')
    return data
  })
}
function initials(s = '') {
  return s.split(' ').filter(Boolean).slice(0,2).map(w => w[0]?.toUpperCase()).join('')
}

// ============== Filter Bar (reusable) ==============
function FilterBar({ value, onChange, groups = [], subjects = [], show = ['level','grade','group','subject','trimestre','dateRange'], compact = false }) {
  const v = value || {}
  const set = (patch) => onChange({ ...v, ...patch })
  // Available grades based on selected level
  const levelDef = LEVELS_NEW.find(l => l.key === v.level)
  const availableGrades = levelDef ? levelDef.grades : Array.from(new Set(LEVELS_NEW.flatMap(l => l.grades)))
  // Filter groups by level + grade
  const filteredGroups = groups.filter(g => {
    if (v.level && g.level && g.level !== v.level) return false
    if (v.grade && g.grade !== v.grade) return false
    return !g.archived
  })

  return (
    <Card className="border-slate-100 mb-4">
      <CardContent className={`p-3 flex flex-wrap items-end gap-2 ${compact ? '' : ''}`}>
        {show.includes('level') && (
          <div className="min-w-[130px]">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Nivel</Label>
            <Select value={v.level || 'all'} onValueChange={x => set({ level: x === 'all' ? '' : x, grade: '', group_id: '' })}>
              <SelectTrigger className="h-9 mt-0.5 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {LEVELS_NEW.map(l => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {show.includes('grade') && (
          <div className="min-w-[100px]">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Grado</Label>
            <Select value={v.grade || 'all'} onValueChange={x => set({ grade: x === 'all' ? '' : x, group_id: '' })}>
              <SelectTrigger className="h-9 mt-0.5 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {show.includes('group') && (
          <div className="min-w-[160px] flex-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Grupo</Label>
            <Select value={v.group_id || 'all'} onValueChange={x => set({ group_id: x === 'all' ? '' : x })}>
              <SelectTrigger className="h-9 mt-0.5 text-sm"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {filteredGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.level} · {g.grade} {g.group_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {show.includes('subject') && (
          <div className="min-w-[140px]">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Materia</Label>
            <Select value={v.subject_id || 'all'} onValueChange={x => set({ subject_id: x === 'all' ? '' : x })}>
              <SelectTrigger className="h-9 mt-0.5 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {show.includes('trimestre') && (
          <div className="min-w-[110px]">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Trimestre</Label>
            <Select value={v.trimestre ? String(v.trimestre) : 'all'} onValueChange={x => set({ trimestre: x === 'all' ? null : Number(x) })}>
              <SelectTrigger className="h-9 mt-0.5 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TRIMESTRES.map(t => <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {show.includes('dateRange') && (
          <>
            <div className="min-w-[130px]">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Desde</Label>
              <Input type="date" className="h-9 mt-0.5 text-sm" value={v.from || ''} onChange={e => set({ from: e.target.value })} />
            </div>
            <div className="min-w-[130px]">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Hasta</Label>
              <Input type="date" className="h-9 mt-0.5 text-sm" value={v.to || ''} onChange={e => set({ to: e.target.value })} />
            </div>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={() => onChange({})} className="h-9 text-slate-500 hover:text-slate-700 text-xs">
          Limpiar
        </Button>
      </CardContent>
    </Card>
  )
}

// ============== Sidebar ==============
function Sidebar({ view, setView, profile }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-slate-200">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-[15px] leading-tight">MI AULA</div>
            <div className="text-[11px] text-sky-600 font-semibold tracking-wider">DIGITAL</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                active
                  ? 'bg-gradient-to-r from-sky-50 to-indigo-50 text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-sky-600' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.soon && <span className="text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Pronto</span>}
              {active && !item.soon && <ChevronRight className="w-4 h-4" />}
            </button>
          )
        })}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50">
          <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold">
              {initials(profile?.display_name || profile?.full_name || 'PR')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{profile?.display_name || 'Maestro/a'}</div>
            <div className="text-[11px] text-slate-500 truncate">{profile?.school_name || 'Tu escuela'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ============== TopBar ==============
function TopBar({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ============== Onboarding ==============
function OnboardingDialog({ open, onSaved }) {
  const [form, setForm] = useState({
    full_name: '', display_name: '', school_name: '',
    education_level: 'Primaria', shift: 'Matutino', subjects: ''
  })
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!form.full_name.trim()) return toast.error('Ingresa tu nombre')
    setSaving(true)
    try {
      const p = await api('profile', { method: 'POST', body: JSON.stringify({ ...form, display_name: form.display_name || form.full_name }) })
      toast.success('¡Bienvenido/a a MI AULA DIGITAL!')
      onSaved(p)
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-sky-500 to-indigo-600 px-6 py-7 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl">¡Te damos la bienvenida!</DialogTitle>
              <DialogDescription className="text-sky-100">Cuéntanos un poco sobre ti</DialogDescription>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Nombre completo *</Label>
              <Input className="mt-1" placeholder="Ej. Rebeca Martínez" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">¿Cómo te llamamos?</Label>
              <Input className="mt-1" placeholder="Ej. Profa. Rebeca" value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700">Escuela</Label>
            <Input className="mt-1" placeholder="Ej. Escuela Primaria Benito Juárez" value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Nivel educativo</Label>
              <Select value={form.education_level} onValueChange={v => setForm({...form, education_level: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Turno</Label>
              <Select value={form.shift} onValueChange={v => setForm({...form, shift: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700">Materia(s) que impartes</Label>
            <Input className="mt-1" placeholder="Ej. Matemáticas, Ciencias" value={form.subjects} onChange={e => setForm({...form, subjects: e.target.value})} />
          </div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <Button onClick={submit} disabled={saving} className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-md h-11 text-sm font-semibold">
            {saving ? 'Guardando...' : 'Comenzar →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Dashboard ==============
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

function DashboardView({ profile, setView, onOpenAttendance, onOpenGroup, onAddStudent }) {
  const [data, setData] = useState(null)
  const load = () => api('dashboard').then(setData).catch(e => toast.error(e.message))
  useEffect(() => { load() }, [])
  const greet = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

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
            <Button onClick={onOpenAttendance} size="sm" className="bg-white text-sky-700 hover:bg-sky-50 font-semibold shadow-md">
              <ClipboardCheck className="w-4 h-4 mr-1.5" /> Tomar asistencia
            </Button>
            <Button onClick={() => setView('students')} size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <UserPlus className="w-4 h-4 mr-1.5" /> Agregar alumno
            </Button>
            <Button onClick={() => setView('groups')} size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
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
                <QuickAction icon={ClipboardCheck} label="Tomar asistencia" color="bg-sky-500" onClick={onOpenAttendance} />
                <QuickAction icon={UserPlus} label="Agregar alumno" color="bg-emerald-500" onClick={() => setView('students')} />
                <QuickAction icon={LayoutGrid} label="Nuevo grupo" color="bg-violet-500" onClick={() => setView('groups')} />
                <QuickAction icon={ListChecks} label="Crear actividad" color="bg-amber-500" onClick={() => setView('activities')} />
                <QuickAction icon={Presentation} label="Pantalla de clase" color="bg-pink-500" onClick={() => setView('screen')} />
                <QuickAction icon={BookMarked} label="Crear planeación" color="bg-indigo-500" onClick={() => setView('plans')} />
                <QuickAction icon={FileText} label="Generar reporte" color="bg-rose-500" onClick={() => setView('reports')} />
                <QuickAction icon={Library} label="Biblioteca" color="bg-teal-500" onClick={() => setView('library')} />
              </div>
            </CardContent>
          </Card>

          {/* My groups list */}
          <Card className="mt-6 border-slate-100">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-sky-500" /> Mis grupos
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setView('groups')} className="text-sky-600 hover:text-sky-700 h-8">
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
                  <Button size="sm" onClick={() => setView('groups')} className="bg-sky-500 hover:bg-sky-600">
                    <Plus className="w-4 h-4 mr-1" /> Crear mi primer grupo
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.groups.slice(0, 6).map(g => (
                    <button key={g.id} onClick={() => onOpenGroup(g)} className="text-left p-3.5 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all group">
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

// ============== Groups View (jerárquico) ==============
function GroupsView({ onSelectGroup }) {
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [subjOpen, setSubjOpen] = useState(false)
  const emptyForm = { level: 'Primaria', grade: '1°', group_name: 'A', subject: '', primary_subject_id: null, additional_subject_ids: [], school_year: '2024-2025', color: GROUP_COLORS[0], notes: '' }
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState({})
  const [expanded, setExpanded] = useState({}) // level::grade keys

  const load = () => Promise.all([api('groups'), api('subjects')]).then(([gs, ss]) => { setGroups(gs); setSubjects(ss) }).catch(e => toast.error(e.message))
  useEffect(() => { load() }, [])

  useEffect(() => {
    // Auto-expand levels that have groups
    const exp = {}
    groups.forEach(g => { exp[`${g.level || 'Primaria'}::${g.grade}`] = true })
    setExpanded(prev => ({ ...exp, ...prev }))
  }, [groups.length])

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
      setOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (g) => {
    if (!confirm(`¿Eliminar grupo ${g.level} · ${g.grade} ${g.group_name}? También se eliminarán sus alumnos.`)) return
    try { await api('groups/' + g.id, { method: 'DELETE' }); toast.success('Grupo eliminado'); load() }
    catch (e) { toast.error(e.message) }
  }
  const addSubject = async (name) => {
    if (!name?.trim()) return null
    const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#14b8a6']
    const s = await api('subjects', { method: 'POST', body: JSON.stringify({ name: name.trim(), color: colors[subjects.length % colors.length] }) })
    load()
    return s
  }
  const removeSubject = async (s) => {
    if (!confirm(`¿Eliminar materia "${s.name}"?`)) return
    await api('subjects/' + s.id, { method: 'DELETE' }); load()
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
                                <Card key={g.id} className="overflow-hidden border-slate-100 hover:shadow-md transition-all group cursor-pointer" onClick={() => onSelectGroup(g)}>
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

// ============== Students View ==============
function StudentsView({ selectedGroup, setSelectedGroup, onOpenStudent }) {
  const [groups, setGroups] = useState([])
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', student_number: '', guardian_name: '', guardian_contact: '', notes: '', nfc_uid: '' })
  const [bulkText, setBulkText] = useState('')

  useEffect(() => { api('groups').then(setGroups).catch(e => toast.error(e.message)) }, [])
  const groupId = selectedGroup?.id || groups[0]?.id
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
        // Guardamos el código de la tarjeta en el formulario
        setForm(f => ({ ...f, nfc_uid: event.serialNumber }))
        toast.success('¡Tarjeta vinculada correctamente! No olvides guardar.')
      }
      
      ndef.onreadingerror = () => toast.error('Error al leer la tarjeta.')
    } catch (e) { 
      toast.error('Error al iniciar NFC: ' + e.message) 
    }
  }

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
  const reload = () => api('students?groupId=' + groupId).then(setStudents)
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
            onChange={(v) => { if (v.group_id !== undefined) { const g = groups.find(x => x.id === v.group_id); setSelectedGroup(g); } }}
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
                  <div key={s.id} onClick={() => onOpenStudent && onOpenStudent(s.id)} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group cursor-pointer">
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

// ============== Attendance View ==============

function AttendanceView({ initialGroup }) {
  const [groups, setGroups] = useState([])
  const [groupId, setGroupId] = useState(initialGroup?.id || '')
  const [date, setDate] = useState(todayISO())
  const [students, setStudents] = useState([])
  const [statuses, setStatuses] = useState({}) // student_id -> status
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api('groups').then(gs => {
      setGroups(gs)
      if (!groupId && gs[0]) setGroupId(gs[0].id)
    }).catch(e => toast.error(e.message))
  }, [])

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
    // Verificamos si el navegador soporta Web NFC
    if (!('NDEFReader' in window)) {
      toast.error('Tu navegador no soporta lectura NFC. Usa Chrome en Android.')
      return
    }

    try {
      const ndef = new window.NDEFReader()
      await ndef.scan()
      toast.info('Lector NFC activado. Acerca la tarjeta de un alumno al celular...', { duration: 5000 })

      ndef.onreading = async (event) => {
        // El serialNumber es el identificador único (UID) físico de la tarjeta
        const nfcUid = event.serialNumber 
        
        try {
          // Enviamos el UID a nuestra nueva API
          const res = await api('attendance/nfc', { 
            method: 'POST', 
            body: JSON.stringify({ nfc_uid: nfcUid, groupId: groupId, date: date }) 
          })
          
          toast.success(`✅ Asistencia registrada: ${res.student_name}`)
          
          // Actualizamos la interfaz (el estado local) inmediatamente
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
                <Icon className="w-5 h-5" />
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
                          <Icon className="w-3.5 h-3.5" />
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

const POINT_CATEGORIES = {
  positive: [
    { label: 'Participación', points: 1 },
    { label: 'Trabajo en equipo', points: 1 },
    { label: 'Respeto', points: 1 },
    { label: 'Responsabilidad', points: 1 },
    { label: 'Entrega puntual', points: 2 },
    { label: 'Ayuda a compañeros', points: 2 },
    { label: 'Esfuerzo', points: 1 },
    { label: 'Cumplimiento de material', points: 1 },
  ],
  negative: [
    { label: 'No trajo material', points: -1 },
    { label: 'Interrumpe', points: -1 },
    { label: 'No trabaja', points: -2 },
    { label: 'Falta de respeto', points: -2 },
    { label: 'Actividad incompleta', points: -1 },
    { label: 'Distracción constante', points: -1 },
  ],
}


// ============== Student Detail (Ficha) ==============
function StudentDetailView({ studentId, onBack, setView }) {
  const [data, setData] = useState(null)
  const [obsText, setObsText] = useState('')
  const [pointNote, setPointNote] = useState('')

  const load = () => api(`students/${studentId}/detail`).then(setData).catch(e => toast.error(e.message))
  useEffect(() => { load() }, [studentId])

  const addPoint = async (category, points) => {
    try {
      await api(`students/${studentId}/points`, { method: 'POST', body: JSON.stringify({ category, points, note: pointNote }) })
      toast.success(`${points > 0 ? '+' : ''}${points} pts · ${category}`)
      setPointNote(''); load()
    } catch (e) { toast.error(e.message) }
  }
  const removePoint = async (pid) => {
    try { await api(`students/${studentId}/points/${pid}`, { method: 'DELETE' }); load() }
    catch (e) { toast.error(e.message) }
  }
  const addObservation = async () => {
    if (!obsText.trim()) return
    try {
      await api(`students/${studentId}/observations`, { method: 'POST', body: JSON.stringify({ text: obsText }) })
      toast.success('Observación guardada')
      setObsText(''); load()
    } catch (e) { toast.error(e.message) }
  }
  const removeObs = async (oid) => {
    try { await api(`students/${studentId}/observations/${oid}`, { method: 'DELETE' }); load() }
    catch (e) { toast.error(e.message) }
  }

  if (!data) return <div className="p-8 text-slate-500">Cargando ficha...</div>
  const { student, group, stats, attendance_records, grades, points, observations } = data

  return (
    <div>
      <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-700 mb-3 flex items-center gap-1 font-medium">
        ← Volver a alumnos
      </button>

      {/* Hero header */}
      <div className="bg-gradient-to-br from-violet-500 via-pink-500 to-rose-500 rounded-3xl p-6 text-white mb-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl border-2 border-white/30">
            {student.student_number || initials(student.first_name + ' ' + student.last_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-pink-100 text-xs font-semibold uppercase tracking-wider">{group?.grade} {group?.group_name} {group?.subject && `· ${group.subject}`}</div>
            <h1 className="text-3xl font-bold mt-1">{student.first_name} {student.last_name}</h1>
            <div className="text-pink-100 text-sm mt-1.5 flex flex-wrap gap-x-4">
              {student.student_number && <span>N° de lista: {student.student_number}</span>}
              {student.guardian_name && <span>Tutor: {student.guardian_name}</span>}
              {student.guardian_contact && <span>📞 {student.guardian_contact}</span>}
            </div>
          </div>
          <Button onClick={() => setView('reports')} size="sm" className="bg-white text-rose-700 hover:bg-rose-50 font-semibold shadow-md">
            <FileText className="w-4 h-4 mr-1.5" /> Generar reporte PDF
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-2xl font-bold text-slate-900">{stats.attendance_pct !== null ? stats.attendance_pct + '%' : '—'}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Asistencia</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-2xl font-bold text-emerald-600">{stats.average ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Promedio</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-2xl font-bold text-rose-600">{stats.falta}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Faltas</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-2xl font-bold text-amber-600">{stats.retardo}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Retardos</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-2xl font-bold text-sky-600">{stats.activities_done}/{stats.activities_done + stats.activities_pending}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Actividades</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className={`text-2xl font-bold ${stats.points_total > 0 ? 'text-emerald-600' : stats.points_total < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {stats.points_total > 0 ? '+' : ''}{stats.points_total}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Puntos</div>
        </div>
      </div>

      <Tabs defaultValue="grades" className="w-full">
        <TabsList className="bg-white border border-slate-100">
          <TabsTrigger value="grades">Calificaciones ({grades.length})</TabsTrigger>
          <TabsTrigger value="attendance">Asistencia ({attendance_records.length})</TabsTrigger>
          <TabsTrigger value="points">Puntos ({points.length})</TabsTrigger>
          <TabsTrigger value="observations">Observaciones ({observations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="mt-4">
          <Card className="border-slate-100">
            <CardContent className="p-0">
              {grades.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">Sin actividades aún.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {grades.map((g, i) => {
                    const type = ACTIVITY_TYPES.find(t => t.value === g.type) || ACTIVITY_TYPES[0]
                    return (
                      <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50/50">
                        <div className="flex-1 min-w-0">
                          <Badge className={`${type.color} hover:${type.color} text-[10px]`}>{type.label}</Badge>
                          <div className="font-medium text-slate-900 mt-1">{g.title}</div>
                          <div className="text-xs text-slate-500">{new Date(g.due_date).toLocaleDateString('es-MX')} · {g.status}</div>
                          {g.feedback && <div className="text-xs text-slate-600 mt-1 italic">"{g.feedback}"</div>}
                        </div>
                        <div className="text-right">
                          {g.score !== null && g.score !== undefined ? (
                            <>
                              <div className={`text-2xl font-bold ${(Number(g.score)/Number(g.max_score))*10 < 7 ? 'text-rose-600' : 'text-emerald-600'}`}>{g.score}</div>
                              <div className="text-xs text-slate-400">/ {g.max_score}</div>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">Pendiente</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card className="border-slate-100">
            <CardContent className="p-0">
              {attendance_records.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">Sin registros de asistencia.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {attendance_records.map((r, i) => {
                    const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.presente
                    const Icon = cfg.icon
                    return (
                      <div key={i} className="p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${cfg.color.split(' ').slice(0,2).join(' ')} flex items-center justify-center`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 text-sm">{new Date(r.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                          <div className="text-xs text-slate-500">{cfg.label}{r.justification && ` · ${r.justification}`}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-emerald-100 bg-emerald-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                  <Award className="w-4 h-4" /> Puntos positivos (+{stats.points_positive})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {POINT_CATEGORIES.positive.map(c => (
                  <Button key={c.label} size="sm" variant="outline" onClick={() => addPoint(c.label, c.points)} className="bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700 text-xs h-8">
                    +{c.points} {c.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card className="border-rose-100 bg-rose-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-4 h-4" /> Áreas de oportunidad ({stats.points_negative})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {POINT_CATEGORIES.negative.map(c => (
                  <Button key={c.label} size="sm" variant="outline" onClick={() => addPoint(c.label, c.points)} className="bg-white hover:bg-rose-50 border-rose-200 text-rose-700 text-xs h-8">
                    {c.points} {c.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
          <Input placeholder="Nota opcional para el próximo punto..." value={pointNote} onChange={e => setPointNote(e.target.value)} />
          <Card className="border-slate-100">
            <CardContent className="p-0">
              {points.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">Sin puntos registrados. Asigna puntos con los botones de arriba.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {points.map(p => (
                    <div key={p.id} className="p-3 flex items-center gap-3 group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${p.points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {p.points > 0 ? '+' : ''}{p.points}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 text-sm">{p.category}</div>
                        <div className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString('es-MX')}{p.note && ` · ${p.note}`}</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-rose-500" onClick={() => removePoint(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observations" className="mt-4 space-y-4">
          <Card className="border-slate-100">
            <CardContent className="p-4">
              <Label className="text-xs font-semibold">Nueva observación</Label>
              <div className="flex gap-2 mt-1">
                <Textarea rows={2} className="resize-none flex-1" placeholder="Anota una observación sobre el alumno..." value={obsText} onChange={e => setObsText(e.target.value)} />
                <Button onClick={addObservation} className="bg-sky-500 hover:bg-sky-600 self-end">Guardar</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100">
            <CardContent className="p-0">
              {observations.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">Sin observaciones registradas.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {observations.map(o => (
                    <div key={o.id} className="p-4 flex items-start gap-3 group">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                        <Pencil className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-slate-800">{o.text}</div>
                        <div className="text-xs text-slate-400 mt-1">{new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-rose-500" onClick={() => removeObs(o.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============== Activities View ==============
function ActivitiesView({ initialGroup }) {
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [groupId, setGroupId] = useState(initialGroup?.id || '')
  const [activities, setActivities] = useState([])
  const [filter, setFilter] = useState({})
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [gradingActivity, setGradingActivity] = useState(null) // {activity, students, grades}
  const [form, setForm] = useState({ title: '', description: '', activity_type: 'tarea', due_date: todayISO(), max_score: 10, weight: 1, subject_id: null })

  useEffect(() => {
    Promise.all([api('groups'), api('subjects')]).then(([gs, ss]) => {
      setGroups(gs); setSubjects(ss)
      if (!groupId && gs[0]) setGroupId(gs[0].id)
    }).catch(e => toast.error(e.message))
  }, [])

  const load = () => {
    if (!groupId) { setActivities([]); return }
    api('activities?groupId=' + groupId).then(setActivities).catch(e => toast.error(e.message))
  }
  useEffect(() => { load() }, [groupId])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', activity_type: 'tarea', due_date: todayISO(), max_score: 10, weight: 1, subject_id: null })
    setOpen(true)
  }
  const openEdit = (a) => {
    setEditing(a)
    setForm({ title: a.title, description: a.description || '', activity_type: a.activity_type, due_date: a.due_date, max_score: a.max_score, weight: a.weight, subject_id: a.subject_id || null })
    setOpen(true)
  }
  const save = async () => {
    if (!form.title.trim()) return toast.error('Pon un título')
    try {
      if (editing) {
        await api('activities/' + editing.id, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Actividad actualizada')
      } else {
        await api('activities', { method: 'POST', body: JSON.stringify({ ...form, group_id: groupId }) })
        toast.success('Actividad creada')
      }
      setOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (a) => {
    if (!confirm(`¿Eliminar "${a.title}"? También se eliminarán sus calificaciones.`)) return
    try { await api('activities/' + a.id, { method: 'DELETE' }); toast.success('Eliminada'); load() }
    catch (e) { toast.error(e.message) }
  }
  const openGrading = async (a) => {
    try {
      const data = await api('activities/' + a.id + '/grades')
      setGradingActivity(data)
    } catch (e) { toast.error(e.message) }
  }

  const activeGroup = groups.find(g => g.id === groupId)

  if (gradingActivity) {
    return <GradingView data={gradingActivity} onBack={() => { setGradingActivity(null); load() }} />
  }

  return (
    <div>
      <TopBar
        title="Actividades"
        subtitle={activeGroup ? `${activeGroup.grade} ${activeGroup.group_name} ${activeGroup.subject ? `· ${activeGroup.subject}` : ''}` : 'Selecciona un grupo'}
        action={
          <Button onClick={openCreate} disabled={!groupId} className="bg-sky-500 hover:bg-sky-600 shadow-md">
            <Plus className="w-4 h-4 mr-1.5" /> Nueva actividad
          </Button>
        }
      />

      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <h3 className="font-bold text-slate-900 text-lg">Primero crea un grupo</h3>
          <p className="text-sm text-slate-500 mt-1">Ve a "Mis grupos" para crear tu primer grupo.</p>
        </div>
      ) : (
        <>
          <FilterBar
            value={{ ...filter, group_id: groupId }}
            onChange={(v) => { setFilter(v); if (v.group_id !== undefined) setGroupId(v.group_id || '') }}
            groups={groups} subjects={subjects}
            show={['level','grade','group','subject','trimestre']}
          />

          {(() => {
            // Apply client-side filters by subject_id and trimestre
            const filtered = activities.filter(a => {
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
              <h3 className="font-bold text-slate-900 text-lg">{activities.length === 0 ? 'Aún no hay actividades' : 'Sin resultados con esos filtros'}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">{activities.length === 0 ? 'Crea tu primera tarea, examen o proyecto' : 'Ajusta los filtros o crea una nueva'}</p>
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
                            {a.trimestre && <Badge variant="outline" className="text-[10px] border-violet-300 text-violet-700 bg-violet-50">T{a.trimestre}</Badge>}
                            {subj && <Badge variant="outline" className="text-[10px]" style={{ borderColor: subj.color, color: subj.color }}>{subj.name}</Badge>}
                          </div>
                          <h3 className="font-bold text-slate-900 leading-tight">{a.title}</h3>
                          {a.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-50" onClick={() => remove(a)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(a.due_date).toLocaleDateString('es-MX')}</span>
                        <span>•</span>
                        <span>Máx. {a.max_score} pts</span>
                        {overdue && <Badge variant="destructive" className="text-[10px]">Vencida</Badge>}
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-medium">{a.graded_count}/{a.students_count} calificados</span>
                          <span className="text-slate-500">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                      <Button onClick={() => openGrading(a)} size="sm" className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 border border-sky-200 shadow-none">
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
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Título *</Label>
              <Input className="mt-1" placeholder="Ej. Tarea de fracciones" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Descripción</Label>
              <Textarea className="mt-1 resize-none" rows={2} placeholder="Detalles, instrucciones..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Materia</Label>
                <Select value={form.subject_id || 'none'} onValueChange={v => setForm({...form, subject_id: v === 'none' ? null : v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin materia —</SelectItem>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Tipo</Label>
                <Select value={form.activity_type} onValueChange={v => setForm({...form, activity_type: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Fecha de entrega</Label>
                <Input type="date" className="mt-1" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Trimestre (auto)</Label>
                <Input className="mt-1 bg-slate-50" readOnly value={getTrimestre(form.due_date) ? `T${getTrimestre(form.due_date)}` : '—'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Puntaje máximo</Label>
                <Input type="number" className="mt-1" value={form.max_score} onChange={e => setForm({...form, max_score: Number(e.target.value)})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Ponderación</Label>
                <Input type="number" step="0.1" className="mt-1" value={form.weight} onChange={e => setForm({...form, weight: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GradingView({ data, onBack }) {
  const { activity, students } = data
  const [grades, setGrades] = useState(() => {
    const m = {}
    students.forEach(s => {
      const g = data.grades[s.id]
      m[s.id] = g ? { score: g.score ?? '', status: g.status || 'pendiente', feedback: g.feedback || '' } : { score: '', status: 'pendiente', feedback: '' }
    })
    return m
  })
  const [saving, setSaving] = useState(false)

  const updateGrade = (sid, patch) => setGrades(g => ({ ...g, [sid]: { ...g[sid], ...patch } }))
  const save = async () => {
    setSaving(true)
    try {
      const records = students.map(s => ({ student_id: s.id, ...grades[s.id], status: (grades[s.id].score !== '' && grades[s.id].score !== null) ? 'calificado' : grades[s.id].status }))
      await api('activities/' + activity.id + '/grades', { method: 'POST', body: JSON.stringify({ records }) })
      toast.success('Calificaciones guardadas ✓')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const scores = students.map(s => Number(grades[s.id]?.score)).filter(x => !isNaN(x) && grades[students.find(st => st)?.id]?.score !== '')
  const validScores = students.map(s => grades[s.id]?.score).filter(x => x !== '' && x !== null && !isNaN(Number(x))).map(Number)
  const avg = validScores.length ? (validScores.reduce((a,b) => a+b, 0) / validScores.length).toFixed(1) : '—'
  const type = ACTIVITY_TYPES.find(t => t.value === activity.activity_type) || ACTIVITY_TYPES[0]

  return (
    <div>
      <button onClick={onBack} className="text-sm text-sky-600 hover:text-sky-700 mb-3 flex items-center gap-1 font-medium">
        ← Volver a actividades
      </button>
      <TopBar
        title={activity.title}
        subtitle={`Máximo: ${activity.max_score} pts · Promedio actual: ${avg}`}
        action={
          <Button onClick={save} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 shadow-md">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar calificaciones'}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className={`${type.color} hover:${type.color}`}>{type.label}</Badge>
        <Badge variant="outline">Entrega: {new Date(activity.due_date).toLocaleDateString('es-MX')}</Badge>
      </div>

      {activity.description && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4 text-sm text-slate-700">{activity.description}</div>
      )}

      <Card className="border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {students.map(s => {
            const g = grades[s.id]
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
                        max={activity.max_score}
                        placeholder="—"
                        className="w-20 text-center font-bold text-base"
                        value={g.score}
                        onChange={e => updateGrade(s.id, { score: e.target.value })}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">/{activity.max_score}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-13 pl-13" style={{ marginLeft: '52px' }}>
                  {GRADE_STATUSES.map(st => (
                    <button
                      key={st.value}
                      onClick={() => updateGrade(s.id, { status: st.value })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${g.status === st.value ? st.color + ' shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
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
    </div>
  )
}

const PLAN_STATUSES = [
  { value: 'borrador',          label: 'Borrador',   color: 'bg-slate-100 text-slate-600' },
  { value: 'planeada',          label: 'Planeada',   color: 'bg-sky-100 text-sky-700' },
  { value: 'impartida',         label: 'Impartida',  color: 'bg-emerald-100 text-emerald-700' },
  { value: 'requiere_refuerzo', label: 'Reforzar',   color: 'bg-amber-100 text-amber-700' },
  { value: 'evaluada',          label: 'Evaluada',   color: 'bg-violet-100 text-violet-700' },
]

const ResponsiveGridLayout = WidthProvider(Responsive)

const WIDGET_REGISTRY = {
  clock:        { name: 'Reloj + Fecha + Valor', icon: '🕐' },
  timer:        { name: 'Temporizador',          icon: '⏱️' },
  traffic:      { name: 'Semáforo de conducta',  icon: '🚦' },
  random:       { name: 'Alumno al azar',        icon: '🎲' },
  teams:        { name: 'Equipos aleatorios',    icon: '👥' },
  instructions: { name: 'Instrucciones',         icon: '📖' },
  todos:        { name: 'Actividades',           icon: '✅' },
  quote:        { name: 'Frase del día',         icon: '💡' },
  note:         { name: 'Nota libre',            icon: '📝' },
  dice:         { name: 'Dado',                  icon: '🎲' },
}

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'clock',        x: 0,  y: 0,  w: 5, h: 8, minW: 3, minH: 5 },
    { i: 'timer',        x: 5,  y: 0,  w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'traffic',      x: 9,  y: 0,  w: 3, h: 5, minW: 2, minH: 4 },
    { i: 'random',       x: 5,  y: 5,  w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'teams',        x: 9,  y: 5,  w: 3, h: 5, minW: 3, minH: 4 },
    { i: 'instructions', x: 0,  y: 8,  w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'todos',        x: 6,  y: 10, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'quote',        x: 0,  y: 14, w: 12, h: 3, minW: 4, minH: 2 },
  ],
  md: [
    { i: 'clock',        x: 0, y: 0,  w: 6, h: 7 },
    { i: 'timer',        x: 6, y: 0,  w: 4, h: 5 },
    { i: 'traffic',      x: 6, y: 5,  w: 4, h: 4 },
    { i: 'random',       x: 0, y: 7,  w: 5, h: 5 },
    { i: 'teams',        x: 5, y: 9,  w: 5, h: 5 },
    { i: 'instructions', x: 0, y: 12, w: 5, h: 4 },
    { i: 'todos',        x: 5, y: 14, w: 5, h: 4 },
    { i: 'quote',        x: 0, y: 18, w: 10, h: 3 },
  ],
  sm: [
    { i: 'clock',        x: 0, y: 0,  w: 6, h: 7 },
    { i: 'timer',        x: 0, y: 7,  w: 6, h: 5 },
    { i: 'traffic',      x: 0, y: 12, w: 6, h: 4 },
    { i: 'random',       x: 0, y: 16, w: 6, h: 5 },
    { i: 'teams',        x: 0, y: 21, w: 6, h: 5 },
    { i: 'instructions', x: 0, y: 26, w: 6, h: 4 },
    { i: 'todos',        x: 0, y: 30, w: 6, h: 4 },
    { i: 'quote',        x: 0, y: 34, w: 6, h: 3 },
  ],
}

const DEFAULT_VISIBLE = ['clock','timer','traffic','random','teams','instructions','todos','quote']

const VALUES_BY_MONTH = [
  { name: 'Respeto',        emoji: '🤝', desc: 'Trato digno a todos' },         // Enero
  { name: 'Amor y amistad', emoji: '💖', desc: 'Cuidar de los demás' },         // Febrero
  { name: 'Igualdad',       emoji: '⚖️', desc: 'Mismos derechos para todos' },  // Marzo
  { name: 'Limpieza',       emoji: '🌿', desc: 'Cuido mi entorno' },            // Abril
  { name: 'Gratitud',       emoji: '🙏', desc: 'Agradezco lo que tengo' },      // Mayo
  { name: 'Honestidad',     emoji: '✨', desc: 'Digo siempre la verdad' },      // Junio
  { name: 'Esfuerzo',       emoji: '💪', desc: 'Doy lo mejor de mí' },          // Julio
  { name: 'Responsabilidad',emoji: '🎯', desc: 'Cumplo mis compromisos' },      // Agosto
  { name: 'Identidad',      emoji: '🌎', desc: 'Reconozco quien soy' },         // Septiembre
  { name: 'Tolerancia',     emoji: '🕊️', desc: 'Acepto las diferencias' },     // Octubre
  { name: 'Solidaridad',    emoji: '🤲', desc: 'Ayudo a los demás' },           // Noviembre
  { name: 'Paz',            emoji: '☮️', desc: 'Convivencia armónica' },       // Diciembre
]

const WORK_MODES = [
  { value: 'normal',   label: 'Clase normal',     emoji: '📚', color: 'from-sky-500 to-indigo-500' },
  { value: 'silencio', label: 'Lectura silenciosa', emoji: '🤫', color: 'from-violet-500 to-purple-500' },
  { value: 'examen',   label: 'Examen',           emoji: '📝', color: 'from-rose-500 to-red-500' },
  { value: 'equipos',  label: 'Trabajo en equipos', emoji: '👥', color: 'from-emerald-500 to-teal-500' },
  { value: 'proyecto', label: 'Proyecto',         emoji: '🎯', color: 'from-amber-500 to-orange-500' },
  { value: 'recreo',   label: 'Receso',           emoji: '🎉', color: 'from-pink-500 to-rose-500' },
]

const QUOTES = [
  'La educación es el arma más poderosa para cambiar el mundo. — Nelson Mandela',
  'Enseñar es aprender dos veces. — Joseph Joubert',
  'El que aprende y aprende y no practica lo que sabe, es como el que ara y ara y no siembra. — Platón',
  'Los grandes maestros son aquellos que se convierten en puentes para que sus alumnos los crucen. — Nikos Kazantzakis',
  'La mente no es un recipiente que llenar, sino un fuego que encender. — Plutarco',
  'El éxito no es definitivo, el fracaso no es fatal: lo que cuenta es el valor para continuar. — W. Churchill',
  'Si puedes soñarlo, puedes hacerlo. — Walt Disney',
  'Aprende como si fueras a vivir para siempre. — Mahatma Gandhi',
]

const BG_COLORS = [
  { name: 'Aurora',  bg: 'bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100' },
  { name: 'Bosque',  bg: 'bg-gradient-to-br from-emerald-100 via-teal-100 to-sky-100' },
  { name: 'Atardecer', bg: 'bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100' },
  { name: 'Coral',   bg: 'bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100' },
  { name: 'Noche',   bg: 'bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 text-white' },
  { name: 'Limpio',  bg: 'bg-slate-50' },
]

// ============== Classroom Screen View ==============
function ClassroomScreenView({ onExit }) {
  const [groups, setGroups] = useState([])
  const [groupId, setGroupId] = useState('')
  const [students, setStudents] = useState([])
  const [now, setNow] = useState(new Date())
  const [bgIdx, setBgIdx] = useState(0)
  const [workMode, setWorkMode] = useState('normal')
  const [privacy, setPrivacy] = useState(false)
  const [activeWidgets, setActiveWidgets] = useState({
    clock: true, timer: true, random: true, teams: true, instructions: true,
    todo: true, traffic: true, quote: true,
  })

  // Customizable layout (drag/resize/show/hide)
  const [editMode, setEditMode] = useState(false)
  const [visibleWidgets, setVisibleWidgets] = useState(DEFAULT_VISIBLE)
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS)
  const [noteText, setNoteText] = useState('')
  const [diceValue, setDiceValue] = useState(1)
  const [diceRolling, setDiceRolling] = useState(false)

  // Load custom config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mad_classroom_config')
      if (saved) {
        const c = JSON.parse(saved)
        if (Array.isArray(c.visible) && c.visible.length) setVisibleWidgets(c.visible)
        if (c.layouts && typeof c.layouts === 'object') setLayouts(c.layouts)
        if (typeof c.noteText === 'string') setNoteText(c.noteText)
      }
    } catch {}
  }, [])

  const persistConfig = (patch = {}) => {
    try {
      const cur = { visible: visibleWidgets, layouts, noteText, ...patch }
      localStorage.setItem('mad_classroom_config', JSON.stringify(cur))
    } catch {}
  }

  const onLayoutChange = (_layout, allLayouts) => {
    setLayouts(allLayouts)
    persistConfig({ layouts: allLayouts })
  }

  const toggleWidget = (key) => {
    const isVisible = visibleWidgets.includes(key)
    const next = isVisible ? visibleWidgets.filter(k => k !== key) : [...visibleWidgets, key]
    setVisibleWidgets(next)
    persistConfig({ visible: next })
  }

  const resetLayout = () => {
    if (!confirm('¿Restablecer la disposición por defecto?')) return
    setLayouts(DEFAULT_LAYOUTS)
    setVisibleWidgets(DEFAULT_VISIBLE)
    persistConfig({ layouts: DEFAULT_LAYOUTS, visible: DEFAULT_VISIBLE })
    toast.success('Disposición restablecida')
  }

  const rollDice = () => {
    setDiceRolling(true)
    let n = 0
    const id = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      n++
      if (n > 12) { clearInterval(id); setDiceRolling(false) }
    }, 80)
  }

  // Timer state
  const [timerMin, setTimerMin] = useState(5)
  const [timerSec, setTimerSec] = useState(0)
  const [timerInitial, setTimerInitial] = useState(300)
  const [timerLeft, setTimerLeft] = useState(300)
  const [timerRunning, setTimerRunning] = useState(false)

  // Instructions and todos
  const [instructions, setInstructions] = useState('1. Saca tu cuaderno y lápiz\n2. Pon atención a la explicación\n3. Trabaja en silencio')
  const [todos, setTodos] = useState([
    { id: 1, text: 'Revisar tarea', done: false },
    { id: 2, text: 'Ejercicios de la página 45', done: false },
    { id: 3, text: 'Compartir respuestas en parejas', done: false },
  ])
  const [newTodo, setNewTodo] = useState('')

  // Random student
  const [randomStudent, setRandomStudent] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [excludeRecent, setExcludeRecent] = useState([])

  // Random teams
  const [teamCount, setTeamCount] = useState(4)
  const [teams, setTeams] = useState([])

  // Traffic light
  const [trafficLight, setTrafficLight] = useState('green') // green, yellow, red

  // Quote
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))

  // Valor del mes (auto by month, customizable)
  const defaultMonthValue = VALUES_BY_MONTH[new Date().getMonth()]
  const [monthValue, setMonthValue] = useState(defaultMonthValue)
  const [editingValue, setEditingValue] = useState(false)
  const [valueDraft, setValueDraft] = useState({ name: defaultMonthValue.name, emoji: defaultMonthValue.emoji, desc: defaultMonthValue.desc })

  useEffect(() => { api('groups').then(setGroups).catch(() => {}) }, [])
  useEffect(() => {
    if (groupId) api('students?groupId=' + groupId).then(setStudents).catch(() => {})
    else setStudents([])
  }, [groupId])

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return
    if (timerLeft <= 0) {
      setTimerRunning(false)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = 880; g.gain.value = 0.3
        o.start(); setTimeout(() => { o.stop(); ctx.close() }, 600)
      } catch {}
      toast.success('⏰ ¡Tiempo!')
      return
    }
    const id = setInterval(() => setTimerLeft(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning, timerLeft])

  const startTimer = () => {
    if (timerLeft <= 0) {
      const total = timerMin * 60 + timerSec
      setTimerInitial(total); setTimerLeft(total)
    }
    setTimerRunning(true)
  }
  const resetTimer = () => {
    const total = timerMin * 60 + timerSec
    setTimerInitial(total); setTimerLeft(total); setTimerRunning(false)
  }
  const formatTime = (s) => {
    const m = Math.floor(s / 60), ss = s % 60
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  const pickRandom = () => {
    if (students.length === 0) return toast.error('Selecciona un grupo con alumnos')
    setSpinning(true)
    let count = 0
    const interval = setInterval(() => {
      const available = students.filter(s => !excludeRecent.includes(s.id))
      const pool = available.length > 0 ? available : students
      const pick = pool[Math.floor(Math.random() * pool.length)]
      setRandomStudent(pick)
      count++
      if (count > 18) {
        clearInterval(interval)
        setSpinning(false)
        setExcludeRecent(prev => [...prev, pick.id].slice(-Math.floor(students.length * 0.7)))
      }
    }, 80)
  }
  const resetRandom = () => { setRandomStudent(null); setExcludeRecent([]) }

  const makeTeams = () => {
    if (students.length === 0) return toast.error('Selecciona un grupo con alumnos')
    const shuffled = [...students].sort(() => Math.random() - 0.5)
    const result = Array.from({ length: teamCount }, () => [])
    shuffled.forEach((s, i) => { result[i % teamCount].push(s) })
    setTeams(result)
  }

  const addTodo = () => {
    if (!newTodo.trim()) return
    setTodos(t => [...t, { id: Date.now(), text: newTodo, done: false }])
    setNewTodo('')
  }
  const toggleTodo = (id) => setTodos(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const removeTodo = (id) => setTodos(t => t.filter(x => x.id !== id))

  const goFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  const bg = BG_COLORS[bgIdx]
  const isDark = bg.name === 'Noche'
  const cardClass = isDark
    ? 'bg-white/10 backdrop-blur border border-white/10 text-white'
    : 'bg-white/80 backdrop-blur border border-white/40 shadow-sm text-slate-900'

  const currentMode = WORK_MODES.find(m => m.value === workMode) || WORK_MODES[0]

  return (
    <div className={`fixed inset-0 z-50 ${bg.bg} overflow-y-auto`}>
      {/* Top toolbar */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-black/30' : 'bg-white/60'} backdrop-blur border-b ${isDark ? 'border-white/10' : 'border-slate-200/50'} px-4 py-2.5 flex items-center gap-2 flex-wrap`}>
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <Presentation className="w-4 h-4" /> Pantalla de clase
        </div>
        <div className="w-px h-5 bg-current opacity-20" />
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger className={`h-8 text-xs w-[160px] ${isDark ? 'bg-white/10 border-white/10 text-white' : ''}`}><SelectValue placeholder="Selecciona grupo" /></SelectTrigger>
          <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.grade} {g.group_name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={workMode} onValueChange={setWorkMode}>
          <SelectTrigger className={`h-8 text-xs w-[180px] ${isDark ? 'bg-white/10 border-white/10 text-white' : ''}`}><SelectValue /></SelectTrigger>
          <SelectContent>{WORK_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.emoji} {m.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(bgIdx)} onValueChange={v => setBgIdx(Number(v))}>
          <SelectTrigger className={`h-8 text-xs w-[120px] ${isDark ? 'bg-white/10 border-white/10 text-white' : ''}`}><SelectValue /></SelectTrigger>
          <SelectContent>{BG_COLORS.map((b, i) => <SelectItem key={i} value={String(i)}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant={privacy ? 'default' : 'outline'} className={`h-8 text-xs ${privacy ? 'bg-rose-500 hover:bg-rose-600 text-white' : isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`} onClick={() => setPrivacy(!privacy)}>
          {privacy ? <><Lock className="w-3.5 h-3.5 mr-1" /> Privado</> : <><Unlock className="w-3.5 h-3.5 mr-1" /> Modo normal</>}
        </Button>
        <Button size="sm" variant="outline" className={`h-8 text-xs ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`} onClick={goFullscreen}>
          <Maximize className="w-3.5 h-3.5 mr-1" /> Pantalla completa
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" className={isDark ? 'text-white hover:bg-white/10' : ''} onClick={onExit}>
          <X className="w-4 h-4 mr-1" /> Salir
        </Button>
      </div>

      {/* Mode strip */}
      <div className={`px-6 py-3 bg-gradient-to-r ${currentMode.color} text-white flex items-center justify-center gap-3 text-lg font-bold`}>
        <span className="text-2xl">{currentMode.emoji}</span>
        <span>Modo: {currentMode.label}</span>
      </div>

      {/* Customization toolbar */}
      <div className={`px-4 py-2 flex items-center gap-2 flex-wrap text-xs ${isDark ? 'bg-black/30 text-white' : 'bg-white/60 text-slate-700'} backdrop-blur border-b ${isDark ? 'border-white/10' : 'border-slate-200/50'}`}>
        <Button size="sm" variant={editMode ? 'default' : 'outline'} className={`h-8 ${editMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`} onClick={() => setEditMode(!editMode)}>
          {editMode ? <><Unlock className="w-3.5 h-3.5 mr-1" /> Bloquear pantalla</> : <><Pencil className="w-3.5 h-3.5 mr-1" /> Personalizar</>}
        </Button>
        {editMode && (
          <span className="opacity-70 hidden md:inline">✨ Arrastra desde la cabecera. Redimensiona desde la esquina inferior derecha.</span>
        )}
        <div className="flex-1" />
        {editMode && (
          <>
            <details className="relative">
              <summary className="list-none cursor-pointer">
                <span className={`inline-flex items-center h-8 px-3 rounded-md border text-xs font-medium ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Widgets ({visibleWidgets.length}/{Object.keys(WIDGET_REGISTRY).length})
                </span>
              </summary>
              <div className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-xl z-50 p-1.5 ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                {Object.entries(WIDGET_REGISTRY).map(([k, w]) => {
                  const on = visibleWidgets.includes(k)
                  return (
                    <button key={k} onClick={() => toggleWidget(k)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'} ${on ? 'opacity-100' : 'opacity-60'}`}>
                      <span className="text-xl">{w.icon}</span>
                      <span className="flex-1 text-left font-medium">{w.name}</span>
                      {on ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Plus className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            </details>
            <Button size="sm" variant="outline" onClick={resetLayout} className={`h-8 ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restablecer
            </Button>
          </>
        )}
      </div>

      {/* Custom grid styles */}
      <style jsx global>{`
        .layout { position: relative; }
        .react-grid-item.react-grid-placeholder { background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(59,130,246,0.15)'}; border-radius: 1rem; opacity: 0.6; transition: all 100ms ease; }
        .react-grid-item { transition: transform 200ms ease, width 200ms ease, height 200ms ease; }
        .react-grid-item.resizing { z-index: 3; }
        .react-grid-item.react-draggable-dragging { z-index: 5; opacity: 0.95; cursor: grabbing !important; }
        .react-resizable-handle { background-image: none !important; }
        .react-resizable-handle::after { content: ''; position: absolute; right: 4px; bottom: 4px; width: 8px; height: 8px; border-right: 2px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(100,116,139,0.5)'}; border-bottom: 2px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(100,116,139,0.5)'}; border-bottom-right-radius: 2px; }
        .edit-active .widget-frame { outline: 2px dashed ${isDark ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.6)'}; outline-offset: -3px; }
        .drag-handle { user-select: none; }
      `}</style>

      {/* Dynamic grid */}
      <div className={editMode ? 'edit-active px-2 md:px-4 py-3' : 'px-2 md:px-4 py-3'}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={48}
          margin={[14, 14]}
          containerPadding={[0, 0]}
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle=".drag-handle"
          onLayoutChange={onLayoutChange}
          compactType="vertical"
          preventCollision={false}
        >
          {visibleWidgets.filter(k => WIDGET_REGISTRY[k]).map(key => {
            const w = WIDGET_REGISTRY[key]
            return (
              <div key={key} className={`widget-frame ${cardClass} rounded-2xl overflow-hidden flex flex-col`}>
                <div className={`drag-handle flex items-center gap-2 px-3 py-1.5 border-b ${isDark ? 'border-white/10' : 'border-slate-100'} ${editMode ? 'cursor-move bg-current/5' : ''}`}>
                  <span className="text-sm">{w.icon}</span>
                  <span className={`text-[11px] font-semibold flex-1 truncate uppercase tracking-wider ${isDark ? 'text-white/70' : 'text-slate-500'}`}>{w.name}</span>
                  {editMode && (
                    <button onClick={() => toggleWidget(key)} className={`rounded p-0.5 ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`} title="Ocultar">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-4 flex flex-col min-h-0">
                  {/* CLOCK widget */}
                  {key === 'clock' && (<>
                    <div className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-slate-500'} text-center capitalize`}>
                      {now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                      <div className="text-5xl md:text-6xl xl:text-7xl font-bold tabular-nums tracking-tight leading-none" style={{ fontFeatureSettings: '"tnum"' }}>
                        {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`text-lg tabular-nums ${isDark ? 'text-white/50' : 'text-slate-400'} mt-1`}>{String(now.getSeconds()).padStart(2,'0')}s</div>
                    </div>
                    <div className={`mt-2 w-full rounded-xl px-3 py-2 ${isDark ? 'bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-300/30' : 'bg-gradient-to-r from-amber-100 to-pink-100 border border-amber-200'} flex items-center gap-2 group`}>
                      <div className="text-2xl flex-shrink-0">{monthValue.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>Valor del mes</div>
                        <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{monthValue.name}</div>
                        <div className={`text-[10px] ${isDark ? 'text-white/70' : 'text-slate-600'} truncate`}>{monthValue.desc}</div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => { setValueDraft({ name: monthValue.name, emoji: monthValue.emoji, desc: monthValue.desc }); setEditingValue(true) }} className={`h-7 w-7 flex-shrink-0 ${isDark ? 'hover:bg-white/10 text-white' : ''}`} title="Cambiar valor">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>)}

                  {/* TIMER widget */}
                  {key === 'timer' && (<>
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                      <div className={`text-5xl md:text-6xl font-bold tabular-nums ${timerLeft <= 10 && timerRunning ? 'text-rose-500 animate-pulse' : ''}`}>
                        {formatTime(Math.max(0, timerLeft))}
                      </div>
                      <div className="w-full max-w-xs mt-2">
                        <div className={`h-1.5 ${isDark ? 'bg-white/20' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                          <div className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all" style={{ width: `${timerInitial ? (timerLeft / timerInitial) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {!timerRunning && (
                        <div className="flex items-center gap-1">
                          <Input type="number" min="0" max="99" className="w-12 h-7 text-center text-xs" value={timerMin} onChange={e => { const v = Number(e.target.value) || 0; setTimerMin(v); setTimerLeft(v*60 + timerSec); setTimerInitial(v*60 + timerSec) }} />
                          <span className="text-[10px] opacity-60">m</span>
                          <Input type="number" min="0" max="59" className="w-12 h-7 text-center text-xs" value={timerSec} onChange={e => { const v = Number(e.target.value) || 0; setTimerSec(v); setTimerLeft(timerMin*60 + v); setTimerInitial(timerMin*60 + v) }} />
                          <span className="text-[10px] opacity-60">s</span>
                        </div>
                      )}
                      <div className="flex gap-1 ml-auto flex-wrap">
                        {[1,3,5,10,15].map(m => (
                          <Button key={m} size="sm" variant="outline" className={`h-6 px-1.5 text-[10px] ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`} onClick={() => { setTimerMin(m); setTimerSec(0); setTimerInitial(m*60); setTimerLeft(m*60); setTimerRunning(false) }}>{m}m</Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <Button size="sm" onClick={timerRunning ? () => setTimerRunning(false) : startTimer} className={`flex-1 h-8 ${timerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                        {timerRunning ? <><Pause className="w-3.5 h-3.5 mr-1" /> Pausa</> : <><Play className="w-3.5 h-3.5 mr-1" /> Iniciar</>}
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetTimer} className={`h-8 ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>)}

                  {/* TRAFFIC LIGHT widget */}
                  {key === 'traffic' && (<>
                    <div className="flex-1 flex flex-col gap-2 items-center justify-center min-h-0">
                      {[
                        { color: 'red',    bg: 'bg-rose-500',    label: 'Silencio total' },
                        { color: 'yellow', bg: 'bg-amber-400',   label: 'Voz baja' },
                        { color: 'green',  bg: 'bg-emerald-500', label: 'Diálogo libre' },
                      ].map(t => {
                        const active = trafficLight === t.color
                        return (
                          <button key={t.color} onClick={() => setTrafficLight(t.color)} className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${t.bg} transition-all ${active ? 'scale-110 ring-4 ring-white shadow-2xl' : 'opacity-30 grayscale'}`} title={t.label} />
                        )
                      })}
                    </div>
                    <div className="mt-2 text-sm font-bold text-center">
                      {trafficLight === 'red' && '🤫 Silencio total'}
                      {trafficLight === 'yellow' && '🗣️ Voz baja'}
                      {trafficLight === 'green' && '💬 Diálogo libre'}
                    </div>
                  </>)}

                  {/* RANDOM STUDENT widget */}
                  {key === 'random' && (<>
                    <div className="flex-1 flex items-center justify-center min-h-0">
                      {students.length === 0 ? (
                        <div className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'} text-center`}>Selecciona un grupo arriba ↑</div>
                      ) : !randomStudent ? (
                        <button onClick={pickRandom} className="text-center w-full py-4">
                          <Dices className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-white/40' : 'text-slate-300'}`} />
                          <div className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Toca para elegir alumno</div>
                        </button>
                      ) : (
                        <div className={`text-center transition-all ${spinning ? 'scale-95 blur-sm' : 'scale-100'}`}>
                          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 via-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-2xl mb-2 shadow-xl">
                            {randomStudent.student_number || initials(randomStudent.first_name + ' ' + randomStudent.last_name)}
                          </div>
                          <div className="text-xl md:text-2xl font-bold leading-tight">
                            {privacy ? `Alumno #${randomStudent.student_number || '?'}` : `${randomStudent.first_name} ${randomStudent.last_name}`}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <Button onClick={pickRandom} disabled={spinning || students.length === 0} className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white h-8">
                        <Shuffle className="w-3.5 h-3.5 mr-1.5" /> {spinning ? 'Girando...' : '🎲 Elegir'}
                      </Button>
                      {randomStudent && <Button size="sm" variant="outline" onClick={resetRandom} className={`h-8 ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`}>Reset</Button>}
                    </div>
                  </>)}

                  {/* TEAMS widget */}
                  {key === 'teams' && (<>
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-xs whitespace-nowrap">Equipos:</Label>
                      <Input type="number" min="2" max="10" className="w-14 h-7 text-center text-sm" value={teamCount} onChange={e => setTeamCount(Math.max(2, Math.min(10, Number(e.target.value) || 2)))} />
                      <Button size="sm" onClick={makeTeams} disabled={students.length === 0} className="bg-emerald-500 hover:bg-emerald-600 h-7 ml-auto">
                        <Shuffle className="w-3.5 h-3.5 mr-1" /> Crear
                      </Button>
                    </div>
                    {teams.length === 0 ? (
                      <div className={`flex-1 flex items-center justify-center text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        {students.length === 0 ? 'Selecciona un grupo' : 'Haz clic en "Crear"'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 flex-1 overflow-auto min-h-0">
                        {teams.map((team, i) => {
                          const colors = ['from-sky-500 to-blue-500','from-emerald-500 to-teal-500','from-amber-500 to-orange-500','from-violet-500 to-pink-500','from-rose-500 to-red-500','from-cyan-500 to-blue-500','from-lime-500 to-green-500','from-fuchsia-500 to-purple-500','from-yellow-500 to-amber-500','from-indigo-500 to-violet-500']
                          return (
                            <div key={i} className="rounded-lg overflow-hidden">
                              <div className={`bg-gradient-to-r ${colors[i % colors.length]} text-white px-2 py-1 text-xs font-bold`}>Equipo {i+1}</div>
                              <div className={`p-1.5 space-y-0.5 ${isDark ? 'bg-white/5' : 'bg-white/60'}`}>
                                {team.map(s => (
                                  <div key={s.id} className="text-[11px] font-medium truncate">
                                    {privacy ? `#${s.student_number || '?'}` : `${s.student_number ? s.student_number + '. ' : ''}${s.first_name} ${s.last_name}`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>)}

                  {/* INSTRUCTIONS widget */}
                  {key === 'instructions' && (
                    <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} className={`flex-1 min-h-0 text-base resize-none ${isDark ? 'bg-white/10 border-white/10 text-white placeholder:text-white/40' : 'bg-white'}`} placeholder="Escribe las instrucciones para la clase..." />
                  )}

                  {/* TODOS widget */}
                  {key === 'todos' && (<>
                    <div className="flex-1 space-y-1 overflow-auto min-h-0 mb-2">
                      {todos.map(t => (
                        <div key={t.id} className={`flex items-center gap-2 p-1.5 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} group`}>
                          <button onClick={() => toggleTodo(t.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-emerald-500 border-emerald-500' : isDark ? 'border-white/40' : 'border-slate-300'}`}>
                            {t.done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </button>
                          <span className={`flex-1 text-sm ${t.done ? 'line-through opacity-50' : ''}`}>{t.text}</span>
                          <button onClick={() => removeTodo(t.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder="Nueva actividad..." className={`h-8 text-sm ${isDark ? 'bg-white/10 border-white/10 text-white placeholder:text-white/40' : ''}`} />
                      <Button size="sm" onClick={addTodo} className="bg-sky-500 hover:bg-sky-600 h-8"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </>)}

                  {/* QUOTE widget */}
                  {key === 'quote' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center relative min-h-0">
                      <Lightbulb className={`w-6 h-6 mb-2 ${isDark ? 'text-amber-300' : 'text-amber-500'}`} />
                      <p className="text-base md:text-lg italic font-medium leading-relaxed max-w-3xl">"{QUOTES[quoteIdx].split(' — ')[0]}"</p>
                      <p className={`text-xs mt-1.5 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>— {QUOTES[quoteIdx].split(' — ')[1] || ''}</p>
                      <Button size="sm" variant="outline" onClick={() => setQuoteIdx((quoteIdx + 1) % QUOTES.length)} className={`mt-2 h-7 text-xs ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`}>
                        <Shuffle className="w-3 h-3 mr-1" /> Otra frase
                      </Button>
                    </div>
                  )}

                  {/* NOTE widget (free text) */}
                  {key === 'note' && (
                    <Textarea value={noteText} onChange={e => { setNoteText(e.target.value); persistConfig({ noteText: e.target.value }) }} className={`flex-1 min-h-0 text-lg resize-none font-medium ${isDark ? 'bg-white/10 border-white/10 text-white placeholder:text-white/40' : 'bg-yellow-50 border-yellow-200'}`} placeholder="Escribe una nota..." />
                  )}

                  {/* DICE widget */}
                  {key === 'dice' && (<>
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                      <div className={`w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center font-bold text-5xl md:text-6xl shadow-xl transition-transform ${diceRolling ? 'animate-bounce' : ''} ${isDark ? 'bg-white/15 text-white' : 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white'}`}>
                        {diceValue}
                      </div>
                    </div>
                    <Button onClick={rollDice} disabled={diceRolling} className="mt-2 bg-sky-500 hover:bg-sky-600 h-8">
                      <Dices className="w-4 h-4 mr-1.5" /> {diceRolling ? 'Tirando...' : 'Tirar dado'}
                    </Button>
                  </>)}
                </div>
              </div>
            )
          })}
        </ResponsiveGridLayout>
      </div>

      {/* Edit Valor del mes Dialog (moved outside the grid) */}
      <Dialog open={editingValue} onOpenChange={setEditingValue}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>✨ Valor del mes</DialogTitle>
            <DialogDescription>Elige un valor predefinido o personaliza el tuyo</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-2 block">Valores sugeridos</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {VALUES_BY_MONTH.map((v, i) => {
                  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
                  return (
                    <button key={i} onClick={() => setValueDraft(v)} className={`p-2.5 rounded-xl border text-left transition-all ${valueDraft.name === v.name ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/30'}`}>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{v.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] uppercase font-semibold text-slate-400">{months[i]}</div>
                          <div className="font-semibold text-slate-900 text-sm">{v.name}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Label className="text-xs font-semibold mb-2 block">O crea uno personalizado</Label>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <Input className="text-center text-2xl" value={valueDraft.emoji} onChange={e => setValueDraft({...valueDraft, emoji: e.target.value})} placeholder="✨" />
                <Input value={valueDraft.name} onChange={e => setValueDraft({...valueDraft, name: e.target.value})} placeholder="Valor (ej. Empatía)" />
              </div>
              <Input className="mt-2" value={valueDraft.desc} onChange={e => setValueDraft({...valueDraft, desc: e.target.value})} placeholder="Descripción breve" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingValue(false)}>Cancelar</Button>
            <Button onClick={() => { setMonthValue(valueDraft); setEditingValue(false); toast.success('Valor actualizado ✓') }} className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white">Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== Lesson Plans View ==============
function PlansView({ profile }) {
  const [plans, setPlans] = useState([])
  const [groups, setGroups] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [generating, setGenerating] = useState(false)
  const emptyForm = { group_id: null, subject: '', grade: '', topic: '', title: '', date: todayISO(), duration_minutes: 50, objective: '', learning_goal: '', start_activity: '', development_activity: '', closing_activity: '', materials: '', evaluation: '', accommodations: '', observations: '', status: 'borrador' }
  const [form, setForm] = useState(emptyForm)
  const [levelNotes, setLevelNotes] = useState('')

  const load = () => api('lesson-plans').then(setPlans).catch(e => toast.error(e.message))
  useEffect(() => { load(); api('groups').then(setGroups) }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setLevelNotes(''); setOpen(true) }
  const openEdit = (p) => { setEditing(p); setForm({ ...p, group_id: p.group_id || null }); setOpen(true) }
  const save = async () => {
    if (!form.topic && !form.title) return toast.error('Pon un tema o título')
    try {
      const body = { ...form, title: form.title || form.topic }
      if (editing) await api('lesson-plans/' + editing.id, { method: 'PUT', body: JSON.stringify(body) })
      else await api('lesson-plans', { method: 'POST', body: JSON.stringify(body) })
      toast.success(editing ? 'Planeación guardada' : 'Planeación creada')
      setOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (p) => { if (!confirm('¿Eliminar planeación?')) return; await api('lesson-plans/' + p.id, { method: 'DELETE' }); load() }
  const generateAI = async () => {
    if (!form.subject || !form.topic) return toast.error('Materia y tema son requeridos para la IA')
    setGenerating(true)
    try {
      const res = await api('lesson-plans/generate-ai', { method: 'POST', body: JSON.stringify({
        subject: form.subject, grade: form.grade, topic: form.topic,
        learning_goal: form.learning_goal, duration_minutes: form.duration_minutes,
        level_notes: levelNotes,
      })})
      setForm(f => ({ ...f, ...res.generated, title: f.title || form.topic }))
      toast.success('✨ Planeación generada con IA')
    } catch (e) { toast.error(e.message) }
    finally { setGenerating(false) }
  }
  const exportPDF = async (p) => {
    try {
      const mod = await import('@/lib/pdfReports')
      const group = groups.find(g => g.id === p.group_id) || { grade: p.grade, group_name: '', subject: p.subject, school_year: '' }
      const doc = await mod.generateLessonPlanPDF({ profile, plan: p, group })
      doc.save(`Planeacion_${(p.title || p.topic || 'sin_titulo').replace(/\s+/g,'_')}.pdf`)
      toast.success('PDF descargado ✓')
    } catch (e) { toast.error('Error PDF: ' + e.message) }
  }

  const onGroupChange = (gid) => {
    const g = groups.find(gg => gg.id === gid)
    setForm(f => ({ ...f, group_id: gid, subject: g?.subject || f.subject, grade: g?.grade || f.grade }))
  }

  return (
    <div>
      <TopBar
        title="Planeaciones de clase"
        subtitle="Crea planeaciones manuales o genéralas con IA en segundos"
        action={<Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 shadow-md text-white"><Sparkles className="w-4 h-4 mr-1.5" /> Nueva planeación</Button>}
      />

      {plans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Crea tu primera planeación</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">Usa IA para generar planeaciones detalladas en segundos</p>
          <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white"><Sparkles className="w-4 h-4 mr-1.5" /> Nueva planeación con IA</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(p => {
            const st = PLAN_STATUSES.find(s => s.value === p.status) || PLAN_STATUSES[0]
            return (
              <Card key={p.id} className="border-slate-100 hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <Badge className={`${st.color} hover:${st.color} mb-2`}>{st.label}</Badge>
                      <h3 className="font-bold text-slate-900 leading-tight">{p.title || p.topic}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {[p.subject, p.grade, new Date(p.date).toLocaleDateString('es-MX'), `${p.duration_minutes} min`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  {p.objective && <p className="text-xs text-slate-600 line-clamp-2 mb-3 italic">"{p.objective}"</p>}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                    <Button onClick={() => openEdit(p)} size="sm" variant="outline" className="flex-1"><Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar</Button>
                    <Button onClick={() => exportPDF(p)} size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600"><FileText className="w-3.5 h-3.5 mr-1.5" /> PDF</Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => remove(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              {editing ? 'Editar planeación' : 'Nueva planeación'}
            </DialogTitle>
            <DialogDescription>Completa los datos básicos y genera el resto con IA, o llénala manualmente</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Tema *</Label>
                <Input className="mt-1" placeholder="Ej. Fracciones equivalentes" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Fecha</Label>
                <Input type="date" className="mt-1" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Duración (min)</Label>
                <Input type="number" className="mt-1" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs font-semibold">Grupo</Label>
                <Select value={form.group_id || 'none'} onValueChange={v => onGroupChange(v === 'none' ? null : v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin grupo —</SelectItem>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.grade} {g.group_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Materia *</Label>
                <Input className="mt-1" placeholder="Matemáticas" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Grado</Label>
                <Input className="mt-1" placeholder="5°" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLAN_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs font-semibold text-violet-700">✨ Generar con IA</Label>
                  <Input className="mt-1 bg-white" placeholder="Notas opcionales del grupo (nivel, contexto...)" value={levelNotes} onChange={e => setLevelNotes(e.target.value)} />
                </div>
                <Button onClick={generateAI} disabled={generating || !form.subject || !form.topic} className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-md self-end">
                  <Sparkles className="w-4 h-4 mr-1.5" /> {generating ? 'Generando...' : 'Generar planeación'}
                </Button>
              </div>
              <div className="text-[11px] text-violet-700/80 mt-2">Requiere materia y tema. La IA rellenará objetivo, inicio, desarrollo, cierre, materiales, evaluación y adecuaciones.</div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Objetivo</Label>
              <Textarea rows={2} className="mt-1 resize-none" value={form.objective} onChange={e => setForm({...form, objective: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Aprendizaje esperado</Label>
              <Textarea rows={2} className="mt-1 resize-none" value={form.learning_goal} onChange={e => setForm({...form, learning_goal: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold text-sky-700">🟢 Inicio</Label>
                <Textarea rows={5} className="mt-1 resize-none" value={form.start_activity} onChange={e => setForm({...form, start_activity: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-amber-700">🟡 Desarrollo</Label>
                <Textarea rows={5} className="mt-1 resize-none" value={form.development_activity} onChange={e => setForm({...form, development_activity: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-violet-700">🔵 Cierre</Label>
                <Textarea rows={5} className="mt-1 resize-none" value={form.closing_activity} onChange={e => setForm({...form, closing_activity: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Materiales</Label>
                <Textarea rows={3} className="mt-1 resize-none" value={form.materials} onChange={e => setForm({...form, materials: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Evaluación</Label>
                <Textarea rows={3} className="mt-1 resize-none" value={form.evaluation} onChange={e => setForm({...form, evaluation: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Adecuaciones</Label>
                <Textarea rows={3} className="mt-1 resize-none" value={form.accommodations} onChange={e => setForm({...form, accommodations: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Observaciones</Label>
                <Textarea rows={3} className="mt-1 resize-none" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Crear planeación'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== Reports View ==============
function ReportsView() {
  const [groups, setGroups] = useState([])
  const [students, setStudents] = useState([])
  const [reportType, setReportType] = useState('group')
  const [groupId, setGroupId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10) })
  const [to, setTo] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => { api('groups').then(gs => { setGroups(gs); if (gs[0]) setGroupId(gs[0].id) }).catch(e => toast.error(e.message)) }, [])
  useEffect(() => {
    if (groupId) api('students?groupId=' + groupId).then(s => { setStudents(s); if (s[0]) setStudentId(s[0].id) }).catch(e => toast.error(e.message))
    else { setStudents([]); setStudentId('') }
  }, [groupId])

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
    <div>
      <TopBar title="Reportes" subtitle="Genera y exporta reportes profesionales en PDF" />

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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-semibold">Grupo</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.grade} {g.group_name} {g.subject && `· ${g.subject}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {reportType === 'student' && (
              <div>
                <Label className="text-xs font-semibold">Alumno</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Desde</Label>
              <Input type="date" className="mt-1" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Hasta</Label>
              <Input type="date" className="mt-1" value={to} onChange={e => setTo(e.target.value)} />
            </div>
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
    </div>
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
              <table className="w-full text-sm">
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
              <table className="w-full text-sm">
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
          <table className="w-full text-sm">
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

const RESOURCE_TYPES = [
  { value: 'pagina_web',  label: 'Página web',  icon: '🌐', color: 'bg-sky-100 text-sky-700' },
  { value: 'video',       label: 'Video',       icon: '🎬', color: 'bg-rose-100 text-rose-700' },
  { value: 'juego',       label: 'Juego',       icon: '🎮', color: 'bg-violet-100 text-violet-700' },
  { value: 'simulador',   label: 'Simulador',   icon: '🧪', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'documento',   label: 'Documento',   icon: '📄', color: 'bg-amber-100 text-amber-700' },
  { value: 'presentacion',label: 'Presentación',icon: '📊', color: 'bg-pink-100 text-pink-700' },
  { value: 'formulario',  label: 'Formulario',  icon: '📋', color: 'bg-teal-100 text-teal-700' },
  { value: 'plataforma',  label: 'Plataforma',  icon: '🏛️', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'ejercicios',  label: 'Ejercicios',  icon: '✏️', color: 'bg-orange-100 text-orange-700' },
  { value: 'otro',        label: 'Otro',        icon: '🔗', color: 'bg-slate-100 text-slate-700' },
]

const EVENT_TYPES = [
  { value: 'examen',         label: 'Examen',          color: '#ef4444', emoji: '📝' },
  { value: 'entrega',        label: 'Entrega',         color: '#3b82f6', emoji: '📤' },
  { value: 'proyecto',       label: 'Proyecto',        color: '#8b5cf6', emoji: '🎯' },
  { value: 'junta',          label: 'Junta',           color: '#06b6d4', emoji: '👥' },
  { value: 'consejo',        label: 'Consejo Técnico', color: '#0891b2', emoji: '📅' },
  { value: 'suspension',     label: 'Suspensión',      color: '#64748b', emoji: '🚫' },
  { value: 'reporte',        label: 'Reporte',         color: '#f59e0b', emoji: '📊' },
  { value: 'cierre',         label: 'Cierre parcial',  color: '#dc2626', emoji: '🏁' },
  { value: 'actividad',      label: 'Actividad esp.',  color: '#10b981', emoji: '🎉' },
  { value: 'recordatorio',   label: 'Recordatorio',    color: '#f97316', emoji: '⏰' },
  { value: 'planeacion',     label: 'Planeación',      color: '#ec4899', emoji: '📚' },
]

const TOPIC_STATUSES = [
  { value: 'no_iniciado', label: 'No iniciado', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'en_curso',    label: 'En curso',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'visto',       label: 'Visto',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'reforzar',    label: 'Reforzar',    color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'evaluado',    label: 'Evaluado',    color: 'bg-sky-100 text-sky-700 border-sky-200' },
]

// ============== Library View ==============
function LibraryView() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterFav, setFilterFav] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', url: '', description: '', subject: '', grade: '', resource_type: 'pagina_web', tags: '', favorite: false })

  const load = () => api('library').then(setItems).catch(e => toast.error(e.message))
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', url: '', description: '', subject: '', grade: '', resource_type: 'pagina_web', tags: '', favorite: false })
    setOpen(true)
  }
  const openEdit = (r) => {
    setEditing(r); setForm({ ...r }); setOpen(true)
  }
  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) return toast.error('Título y URL son obligatorios')
    try {
      if (editing) await api('library/' + editing.id, { method: 'PUT', body: JSON.stringify(form) })
      else await api('library', { method: 'POST', body: JSON.stringify(form) })
      toast.success(editing ? 'Recurso actualizado' : 'Recurso agregado')
      setOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (r) => { if (!confirm('¿Eliminar este recurso?')) return; await api('library/' + r.id, { method: 'DELETE' }); load() }
  const toggleFav = async (r) => { await api('library/' + r.id, { method: 'PUT', body: JSON.stringify({ favorite: !r.favorite }) }); load() }

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    if (filterType !== 'all' && i.resource_type !== filterType) return false
    if (filterFav && !i.favorite) return false
    if (q && !((i.title + ' ' + i.description + ' ' + i.tags).toLowerCase().includes(q))) return false
    return true
  })

  return (
    <div>
      <TopBar
        title="Biblioteca de recursos"
        subtitle="Guarda enlaces educativos organizados por materia, grado y tema"
        action={<Button onClick={openCreate} className="bg-sky-500 hover:bg-sky-600 shadow-md"><Plus className="w-4 h-4 mr-1.5" /> Nuevo recurso</Button>}
      />

      <Card className="border-slate-100 mb-4">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs font-semibold">Buscar</Label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Título, descripción, etiquetas..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="min-w-[160px]">
            <Label className="text-xs font-semibold">Tipo</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {RESOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant={filterFav ? 'default' : 'outline'} className={filterFav ? 'bg-amber-500 hover:bg-amber-600' : ''} onClick={() => setFilterFav(!filterFav)}>
            <Award className="w-4 h-4 mr-1.5" /> Favoritos
          </Button>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Library className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{items.length === 0 ? 'Tu biblioteca está vacía' : 'Sin resultados'}</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">{items.length === 0 ? 'Agrega tus primeros enlaces educativos' : 'Prueba ajustar los filtros'}</p>
          {items.length === 0 && <Button onClick={openCreate} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-1.5" /> Agregar enlace</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => {
            const type = RESOURCE_TYPES.find(t => t.value === r.resource_type) || RESOURCE_TYPES[0]
            return (
              <Card key={r.id} className="border-slate-100 hover:shadow-md transition-shadow group overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${type.color} hover:${type.color}`}><span className="mr-1">{type.icon}</span>{type.label}</Badge>
                    <button onClick={() => toggleFav(r)} className={`text-lg leading-none ${r.favorite ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`} title="Favorito">⭐</button>
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight mt-2">{r.title}</h3>
                  {r.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] text-slate-500">
                    {r.subject && <Badge variant="outline" className="text-[10px] py-0">{r.subject}</Badge>}
                    {r.grade && <Badge variant="outline" className="text-[10px] py-0">{r.grade}</Badge>}
                    {r.tags && r.tags.split(',').slice(0,3).map(t => <Badge key={t} variant="outline" className="text-[10px] py-0">#{t.trim()}</Badge>)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                    <Button asChild size="sm" className="flex-1 bg-sky-500 hover:bg-sky-600 shadow-none">
                      <a href={r.url} target="_blank" rel="noopener noreferrer">Abrir →</a>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => remove(r)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar recurso' : 'Nuevo recurso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Título *</Label>
              <Input className="mt-1" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej. Khan Academy - Fracciones" />
            </div>
            <div>
              <Label className="text-xs font-semibold">URL *</Label>
              <Input className="mt-1" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs font-semibold">Descripción</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="¿Para qué sirve este recurso?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Materia</Label>
                <Input className="mt-1" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Ej. Matemáticas" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Grado</Label>
                <Input className="mt-1" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} placeholder="Ej. 5°" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Tipo</Label>
                <Select value={form.resource_type} onValueChange={v => setForm({...form, resource_type: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{RESOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Etiquetas (coma)</Label>
                <Input className="mt-1" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="fracciones, sumas, ..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Agregar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== Calendar View ==============
function CalendarView() {
  const [events, setEvents] = useState([])
  const [groups, setGroups] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', event_type: 'recordatorio', start_date: todayISO(), end_date: todayISO(), group_id: null })

  useEffect(() => { load(); api('groups').then(setGroups) }, [])
  const load = () => api('events').then(setEvents).catch(e => toast.error(e.message))

  const openCreate = (date = null) => {
    setEditing(null)
    setForm({ title: '', description: '', event_type: 'recordatorio', start_date: date || todayISO(), end_date: date || todayISO(), group_id: null })
    setOpen(true)
  }
  const openEdit = (ev) => { setEditing(ev); setForm({ ...ev }); setOpen(true) }
  const save = async () => {
    if (!form.title.trim()) return toast.error('Pon un título')
    try {
      const type = EVENT_TYPES.find(t => t.value === form.event_type)
      const body = { ...form, color: type?.color || '#3b82f6' }
      if (editing) await api('events/' + editing.id, { method: 'PUT', body: JSON.stringify(body) })
      else await api('events', { method: 'POST', body: JSON.stringify(body) })
      toast.success(editing ? 'Evento actualizado' : 'Evento creado')
      setOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (ev) => { if (!confirm('¿Eliminar evento?')) return; await api('events/' + ev.id, { method: 'DELETE' }); load() }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = todayISO()

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const eventsByDate = {}
  events.forEach(e => { if (!eventsByDate[e.start_date]) eventsByDate[e.start_date] = []; eventsByDate[e.start_date].push(e) })

  const upcoming = events.filter(e => e.start_date >= todayStr).sort((a,b) => a.start_date.localeCompare(b.start_date)).slice(0, 8)

  return (
    <div>
      <TopBar
        title="Calendario"
        subtitle="Tus fechas importantes: exámenes, entregas, juntas y más"
        action={<Button onClick={() => openCreate()} className="bg-sky-500 hover:bg-sky-600 shadow-md"><Plus className="w-4 h-4 mr-1.5" /> Nuevo evento</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="capitalize text-lg">{monthName}</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>← </Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>→</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 mb-2">
              {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                if (!d) return <div key={i} className="aspect-square" />
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const dayEvents = eventsByDate[dateStr] || []
                const isToday = dateStr === todayStr
                return (
                  <button key={i} onClick={() => openCreate(dateStr)} className={`aspect-square rounded-lg border p-1 text-left flex flex-col hover:border-sky-300 transition-all ${isToday ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-100' : 'border-slate-100 bg-white'}`}>
                    <div className={`text-xs font-bold ${isToday ? 'text-sky-700' : 'text-slate-700'}`}>{d}</div>
                    <div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0,2).map(ev => (
                        <div key={ev.id} className="text-[9px] px-1 py-0.5 rounded truncate text-white font-medium" style={{ background: ev.color || '#3b82f6' }}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <div className="text-[9px] text-slate-500">+{dayEvents.length - 2}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-sky-500" /> Próximos eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">Sin eventos próximos</div>
            ) : upcoming.map(ev => {
              const type = EVENT_TYPES.find(t => t.value === ev.event_type) || EVENT_TYPES[0]
              return (
                <div key={ev.id} onClick={() => openEdit(ev)} className="p-3 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{type.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">{ev.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{new Date(ev.start_date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                      <Badge className="text-[10px] mt-1" style={{ background: ev.color + '20', color: ev.color, borderColor: ev.color + '40' }}>{type.label}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>{editing ? 'Editar evento' : 'Nuevo evento'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Título *</Label>
              <Input className="mt-1" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej. Examen parcial Matemáticas" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Descripción</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Tipo</Label>
                <Select value={form.event_type} onValueChange={v => setForm({...form, event_type: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Grupo (opcional)</Label>
                <Select value={form.group_id || 'none'} onValueChange={v => setForm({...form, group_id: v === 'none' ? null : v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin grupo —</SelectItem>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.grade} {g.group_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Fecha inicio</Label>
                <Input type="date" className="mt-1" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Fecha fin</Label>
                <Input type="date" className="mt-1" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center !justify-between">
            <div>{editing && <Button variant="outline" className="text-rose-600 hover:bg-rose-50 border-rose-200" onClick={() => { remove(editing); setOpen(false) }}><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Crear'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== Curriculum (Temarios) View ==============
function CurriculumView() {
  const [units, setUnits] = useState([])
  const [filterSubject, setFilterSubject] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [unitOpen, setUnitOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [unitForm, setUnitForm] = useState({ title: '', description: '', subject: '', grade: '' })

  const load = () => {
    let q = ''
    if (filterSubject) q += '?subject=' + encodeURIComponent(filterSubject)
    if (filterGrade) q += (q ? '&' : '?') + 'grade=' + encodeURIComponent(filterGrade)
    api('curriculum/units' + q).then(setUnits).catch(e => toast.error(e.message))
  }
  useEffect(() => { load() }, [filterSubject, filterGrade])

  const openCreateUnit = () => { setEditingUnit(null); setUnitForm({ title: '', description: '', subject: filterSubject, grade: filterGrade }); setUnitOpen(true) }
  const openEditUnit = (u) => { setEditingUnit(u); setUnitForm({ title: u.title, description: u.description, subject: u.subject, grade: u.grade }); setUnitOpen(true) }
  const saveUnit = async () => {
    if (!unitForm.title.trim()) return toast.error('Pon un título')
    try {
      if (editingUnit) await api('curriculum/units/' + editingUnit.id, { method: 'PUT', body: JSON.stringify(unitForm) })
      else await api('curriculum/units', { method: 'POST', body: JSON.stringify(unitForm) })
      toast.success(editingUnit ? 'Unidad actualizada' : 'Unidad creada')
      setUnitOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const removeUnit = async (u) => { if (!confirm('¿Eliminar unidad y sus temas?')) return; await api('curriculum/units/' + u.id, { method: 'DELETE' }); load() }
  const addTopic = async (unit_id) => {
    const title = prompt('Título del tema:')
    if (!title) return
    await api('curriculum/topics', { method: 'POST', body: JSON.stringify({ unit_id, title }) })
    load()
  }
  const updateTopic = async (id, patch) => { await api('curriculum/topics/' + id, { method: 'PUT', body: JSON.stringify(patch) }); load() }
  const removeTopic = async (id) => { if (!confirm('¿Eliminar tema?')) return; await api('curriculum/topics/' + id, { method: 'DELETE' }); load() }

  const allTopics = units.flatMap(u => u.topics || [])
  const totalTopics = allTopics.length
  const seenTopics = allTopics.filter(t => t.status === 'visto' || t.status === 'evaluado').length
  const progress = totalTopics ? Math.round(seenTopics / totalTopics * 100) : 0

  return (
    <div>
      <TopBar
        title="Temarios"
        subtitle="Organiza unidades y temas por materia y grado. Marca tu avance."
        action={<Button onClick={openCreateUnit} className="bg-sky-500 hover:bg-sky-600 shadow-md"><Plus className="w-4 h-4 mr-1.5" /> Nueva unidad</Button>}
      />

      <Card className="border-slate-100 mb-4">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs font-semibold">Filtrar por materia</Label>
            <Input className="mt-1" placeholder="Ej. Matemáticas" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} />
          </div>
          <div className="min-w-[140px]">
            <Label className="text-xs font-semibold">Grado</Label>
            <Input className="mt-1" placeholder="Ej. 5°" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} />
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 min-w-[200px]">
            <div className="text-xs font-semibold text-emerald-700">Avance general</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-sm font-bold text-emerald-700">{progress}%</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{seenTopics} de {totalTopics} temas vistos</div>
          </div>
        </CardContent>
      </Card>

      {units.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Sin unidades aún</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">Crea tu primera unidad temática</p>
          <Button onClick={openCreateUnit} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-1.5" /> Nueva unidad</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {units.map(u => {
            const total = u.topics?.length || 0
            const seen = u.topics?.filter(t => t.status === 'visto' || t.status === 'evaluado').length || 0
            const pct = total ? Math.round(seen/total*100) : 0
            return (
              <Card key={u.id} className="border-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{u.title}</h3>
                        {u.subject && <Badge variant="outline">{u.subject}</Badge>}
                        {u.grade && <Badge variant="outline">{u.grade}</Badge>}
                      </div>
                      {u.description && <p className="text-xs text-slate-500">{u.description}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">{seen}/{total} temas</div>
                      <Progress value={pct} className="h-1.5 w-24 mt-1" />
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditUnit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => removeUnit(u)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {(u.topics || []).map(t => {
                      const status = TOPIC_STATUSES.find(s => s.value === t.status) || TOPIC_STATUSES[0]
                      return (
                        <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 group">
                          <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]?.replace('bg-','bg-')}`} style={{ background: t.status === 'visto' ? '#10b981' : t.status === 'reforzar' ? '#ef4444' : t.status === 'en_curso' ? '#f59e0b' : t.status === 'evaluado' ? '#3b82f6' : '#94a3b8' }} />
                          <span className={`flex-1 text-sm ${t.status === 'visto' || t.status === 'evaluado' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{t.title}</span>
                          <Select value={t.status} onValueChange={(v) => updateTopic(t.id, { status: v })}>
                            <SelectTrigger className={`h-7 text-[11px] w-[120px] border ${status.color}`}><SelectValue /></SelectTrigger>
                            <SelectContent>{TOPIC_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-rose-500" onClick={() => removeTopic(t.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      )
                    })}
                    <Button onClick={() => addTopic(u.id)} size="sm" variant="ghost" className="text-sky-600 hover:text-sky-700 h-8">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Agregar tema
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUnit ? 'Editar unidad' : 'Nueva unidad'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Título *</Label>
              <Input className="mt-1" value={unitForm.title} onChange={e => setUnitForm({...unitForm, title: e.target.value})} placeholder="Ej. Unidad 1: Números naturales" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Descripción</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={unitForm.description} onChange={e => setUnitForm({...unitForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Materia</Label>
                <Input className="mt-1" value={unitForm.subject} onChange={e => setUnitForm({...unitForm, subject: e.target.value})} placeholder="Ej. Matemáticas" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Grado</Label>
                <Input className="mt-1" value={unitForm.grade} onChange={e => setUnitForm({...unitForm, grade: e.target.value})} placeholder="Ej. 5°" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitOpen(false)}>Cancelar</Button>
            <Button onClick={saveUnit} className="bg-sky-500 hover:bg-sky-600">{editingUnit ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== Placeholder ==============
function ComingSoonView({ title, icon: Icon, description }) {
  return (
    <div>
      <TopBar title={title} subtitle="Esta sección estará disponible muy pronto" />
      <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-3xl border border-sky-100 p-12 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-5">
          <Icon className="w-10 h-10 text-sky-500" />
        </div>
        <h3 className="font-bold text-slate-900 text-2xl">Próximamente</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{description}</p>
        <Badge className="mt-5 bg-amber-100 text-amber-700 hover:bg-amber-100">Fase 2</Badge>
      </div>
    </div>
  )
}

function SettingsView({ profile, onSaved }) {
  const [form, setForm] = useState(profile || {})
  useEffect(() => { setForm(profile || {}) }, [profile])
  const td = form.term_dates || DEFAULT_TERM_DATES
  const setTD = (k, field, val) => setForm({ ...form, term_dates: { ...td, [k]: { ...td[k], [field]: Number(val) } } })
  const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const save = async () => {
    try {
      const p = await api('profile', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Configuración guardada')
      onSaved(p)
    } catch (e) { toast.error(e.message) }
  }
  const wipeAll = async () => {
    if (!confirm('⚠️ ¿Borrar TODOS tus datos? (Grupos, alumnos, actividades, etc.) Esta acción no se puede deshacer.')) return
    await api('reset', { method: 'POST' })
    toast.success('Datos borrados. Recargando...')
    setTimeout(() => window.location.reload(), 1000)
  }
  return (
    <div>
      <TopBar title="Configuración" subtitle="Personaliza tu perfil y los trimestres del ciclo escolar" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-slate-100">
          <CardHeader><CardTitle className="text-base">Perfil del docente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Nombre completo</Label><Input className="mt-1" value={form.full_name || ''} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
              <div><Label className="text-xs font-semibold">Nombre a mostrar</Label><Input className="mt-1" value={form.display_name || ''} onChange={e => setForm({...form, display_name: e.target.value})} /></div>
            </div>
            <div><Label className="text-xs font-semibold">Escuela</Label><Input className="mt-1" value={form.school_name || ''} onChange={e => setForm({...form, school_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Nivel educativo</Label>
                <Select value={form.education_level || 'Primaria'} onValueChange={v => setForm({...form, education_level: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs font-semibold">Turno</Label>
                <Select value={form.shift || 'Matutino'} onValueChange={v => setForm({...form, shift: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs font-semibold">Materias que impartes</Label><Input className="mt-1" value={form.subjects || ''} onChange={e => setForm({...form, subjects: e.target.value})} /></div>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader><CardTitle className="text-base flex items-center gap-2">📅 Trimestres del ciclo escolar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">Define el rango de meses de cada trimestre. Se asignará automáticamente a actividades y planeaciones según su fecha.</p>
            {[
              { key: 't1', label: 'Trimestre 1', color: 'sky' },
              { key: 't2', label: 'Trimestre 2', color: 'emerald' },
              { key: 't3', label: 'Trimestre 3', color: 'amber' },
            ].map(t => (
              <div key={t.key} className={`p-3 rounded-xl bg-${t.color}-50 border border-${t.color}-100`}>
                <div className={`text-xs font-bold text-${t.color}-700 mb-2 uppercase tracking-wide`}>{t.label}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-slate-500">Mes inicio</Label>
                    <Select value={String(td[t.key].start_month)} onValueChange={v => setTD(t.key, 'start_month', v)}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-slate-500">Mes fin</Label>
                    <Select value={String(td[t.key].end_month)} onValueChange={v => setTD(t.key, 'end_month', v)}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setForm({...form, term_dates: DEFAULT_TERM_DATES})} className="text-xs">
              ↺ Restablecer a default SEP (T1 Ago-Nov, T2 Dic-Mar, T3 Abr-Jul)
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 flex justify-between items-center">
          <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">Guardar cambios</Button>
          <Button onClick={wipeAll} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Borrar todos mis datos</Button>
        </div>
      </div>
    </div>
  )
}

// ============== App ==============
function App() {
  const [view, setView] = useState('dashboard')
  const [profile, setProfile] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  useEffect(() => {
    api('profile').then(p => { setProfile(p); setLoaded(true) }).catch(() => setLoaded(true))
  }, [])

  const onOpenAttendance = () => setView('attendance')
  const onOpenGroup = (g) => { setSelectedGroup(g); setView('students') }
  const onOpenStudent = (id) => { setSelectedStudentId(id); setView('student-detail') }

  let content
  if (view === 'dashboard') content = <DashboardView profile={profile} setView={setView} onOpenAttendance={onOpenAttendance} onOpenGroup={onOpenGroup} />
  else if (view === 'groups') content = <GroupsView onSelectGroup={onOpenGroup} />
  else if (view === 'students') content = <StudentsView selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} onOpenStudent={onOpenStudent} />
  else if (view === 'student-detail' && selectedStudentId) content = <StudentDetailView studentId={selectedStudentId} onBack={() => setView('students')} setView={setView} />
  else if (view === 'attendance') content = <AttendanceView initialGroup={selectedGroup} />
  else if (view === 'activities') content = <ActivitiesView initialGroup={selectedGroup} />
  else if (view === 'reports') content = <ReportsView />
  else if (view === 'plans') content = <PlansView profile={profile} />
  else if (view === 'screen') content = <ClassroomScreenView onExit={() => setView('dashboard')} />
  else if (view === 'library') content = <LibraryView />
  else if (view === 'calendar') content = <CalendarView />
  else if (view === 'curriculum') content = <CurriculumView />
  else if (view === 'settings') content = <SettingsView profile={profile} onSaved={setProfile} />
  else {
    const item = NAV_ITEMS.find(i => i.key === view)
    const descMap = {
      activities: 'Crearás actividades, las calificarás en tabla, agregarás retroalimentación y rúbricas. Las calificaciones alimentarán los reportes automáticamente.',
      screen: 'Pantalla tipo Classroomscreen con temporizador, alumno aleatorio, generador de grupos, semáforo de conducta, puntos por equipo y mucho más.',
      plans: 'Generador de planeaciones con IA que crea inicio, desarrollo, cierre, evaluación y materiales en segundos a partir de un tema.',
      reports: 'Reportes quincenales, parciales e individuales en PDF con plantillas personalizables y campos dinámicos.',
      library: 'Biblioteca de enlaces educativos organizados por materia, grado y etiquetas. Asocia recursos a tus planeaciones.',
      calendar: 'Calendario mensual/semanal/diario con eventos: exámenes, juntas, entregas y recordatorios personales.',
    }
    content = <ComingSoonView title={item?.label || 'Próximamente'} icon={item?.icon || Sparkles} description={descMap[view] || 'Estamos trabajando en esta sección.'} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar view={view} setView={setView} profile={profile} />
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="font-bold text-slate-900 text-sm">MI AULA DIGITAL</div>
        </div>
        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around py-2 z-50">
          {[
            { key: 'dashboard', icon: Home, label: 'Inicio' },
            { key: 'groups', icon: LayoutGrid, label: 'Grupos' },
            { key: 'students', icon: Users, label: 'Alumnos' },
            { key: 'attendance', icon: ClipboardCheck, label: 'Asistencia' },
          ].map(item => {
            const Icon = item.icon
            const active = view === item.key
            return (
              <button key={item.key} onClick={() => setView(item.key)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg ${active ? 'text-sky-600' : 'text-slate-400'}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px] mx-auto">
          {content}
        </div>
      </main>

      {loaded && !profile && <OnboardingDialog open={true} onSaved={setProfile} />}
    </div>
  )
}

export default App
