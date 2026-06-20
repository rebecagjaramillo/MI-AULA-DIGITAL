import {
  Home, Users, BookOpen, ClipboardCheck, FileText, Calendar as CalendarIcon,
  LayoutGrid, Library, Settings, Sparkles, ListChecks, Presentation, BookMarked,
  CheckCircle2, XCircle, Clock3, ShieldCheck
} from 'lucide-react'

// ============== Navegación ==============
export const NAV_ITEMS = [
  { key: 'dashboard',  path: '/dashboard',       label: 'Inicio',            icon: Home },
  { key: 'groups',     path: '/grupos',           label: 'Mis grupos',        icon: LayoutGrid },
  { key: 'students',   path: '/alumnos',          label: 'Alumnos',           icon: Users },
  { key: 'attendance', path: '/asistencia',       label: 'Asistencia',        icon: ClipboardCheck },
  { key: 'activities', path: '/actividades',      label: 'Actividades',       icon: ListChecks },
  { key: 'screen',     path: '/pantalla-clase',   label: 'Pantalla de clase', icon: Presentation },
  { key: 'plans',      path: '/planeaciones',     label: 'Planeaciones',      icon: BookMarked },
  { key: 'curriculum', path: '/temarios',         label: 'Temarios',          icon: BookOpen },
  { key: 'reports',    path: '/reportes',         label: 'Reportes',          icon: FileText },
  { key: 'library',    path: '/biblioteca',       label: 'Biblioteca',        icon: Library },
  { key: 'calendar',   path: '/calendario',       label: 'Calendario',        icon: CalendarIcon },
  { key: 'settings',   path: '/configuracion',    label: 'Configuración',     icon: Settings },
]

// ============== Colores de grupos ==============
export const GROUP_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'
]

// ============== Asistencia ==============
export const STATUS_CONFIG = {
  presente:    { label: 'Presente',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  falta:       { label: 'Falta',       color: 'bg-rose-100 text-rose-700 border-rose-200',         dot: 'bg-rose-500',    icon: XCircle },
  retardo:     { label: 'Retardo',     color: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   icon: Clock3 },
  justificado: { label: 'Justificado', color: 'bg-sky-100 text-sky-700 border-sky-200',             dot: 'bg-sky-500',     icon: ShieldCheck },
}

// ============== Actividades ==============
export const ACTIVITY_TYPES = [
  { value: 'tarea',          label: 'Tarea',            color: 'bg-sky-100 text-sky-700' },
  { value: 'trabajo_clase',  label: 'Trabajo en clase', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'proyecto',       label: 'Proyecto',         color: 'bg-violet-100 text-violet-700' },
  { value: 'examen',         label: 'Examen',           color: 'bg-rose-100 text-rose-700' },
  { value: 'participacion',  label: 'Participación',    color: 'bg-amber-100 text-amber-700' },
  { value: 'exposicion',     label: 'Exposición',       color: 'bg-pink-100 text-pink-700' },
  { value: 'practica',       label: 'Práctica',         color: 'bg-teal-100 text-teal-700' },
  { value: 'producto',       label: 'Producto',         color: 'bg-indigo-100 text-indigo-700' },
  { value: 'otro',           label: 'Otro',             color: 'bg-slate-100 text-slate-700' },
]

export const GRADE_STATUSES = [
  { value: 'pendiente',     label: 'Pendiente',    color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'entregado',     label: 'Entregado',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'tarde',         label: 'Tarde',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'no_entregado',  label: 'No entregó',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'incompleto',    label: 'Incompleto',   color: 'bg-orange-100 text-orange-700 border-orange-200' },
]

// ============== Niveles educativos ==============
export const LEVELS_NEW = [
  { key: 'Preescolar',   label: 'Preescolar',   color: '#f59e0b', grades: ['1°','2°','3°'] },
  { key: 'Primaria',     label: 'Primaria',     color: '#3b82f6', grades: ['1°','2°','3°','4°','5°','6°'] },
  { key: 'Secundaria',   label: 'Secundaria',   color: '#10b981', grades: ['1°','2°','3°'] },
  { key: 'Preparatoria', label: 'Preparatoria', color: '#8b5cf6', grades: ['1°','2°','3°','4°','5°','6°'] },
]

export const LEVELS = ['Preescolar','Primaria','Secundaria','Preparatoria','Universidad','Otro']
export const SHIFTS = ['Matutino','Vespertino','Mixto']

export const GRADES = ['1°','2°','3°','4°','5°','6°','1° Sec','2° Sec','3° Sec','1° Prepa','2° Prepa','3° Prepa']

// ============== Trimestres ==============
export const TRIMESTRES = [
  { value: 1, label: 'T1' },
  { value: 2, label: 'T2' },
  { value: 3, label: 'T3' },
]

export const DEFAULT_TERM_DATES = {
  t1: { start_month: 8,  end_month: 11 },
  t2: { start_month: 12, end_month: 3  },
  t3: { start_month: 4,  end_month: 7  },
}

// ============== Puntos de conducta ==============
export const POINT_CATEGORIES = {
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

// ============== Planeaciones ==============
export const PLAN_STATUSES = [
  { value: 'borrador',          label: 'Borrador',   color: 'bg-slate-100 text-slate-600' },
  { value: 'planeada',          label: 'Planeada',   color: 'bg-sky-100 text-sky-700' },
  { value: 'impartida',         label: 'Impartida',  color: 'bg-emerald-100 text-emerald-700' },
  { value: 'requiere_refuerzo', label: 'Reforzar',   color: 'bg-amber-100 text-amber-700' },
  { value: 'evaluada',          label: 'Evaluada',   color: 'bg-violet-100 text-violet-700' },
]

// ============== Biblioteca ==============
export const RESOURCE_TYPES = [
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

// ============== Calendario ==============
export const EVENT_TYPES = [
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

// ============== Temarios ==============
export const TOPIC_STATUSES = [
  { value: 'no_iniciado', label: 'No iniciado', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'en_curso',    label: 'En curso',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'visto',       label: 'Visto',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'reforzar',    label: 'Reforzar',    color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'evaluado',    label: 'Evaluado',    color: 'bg-sky-100 text-sky-700 border-sky-200' },
]
