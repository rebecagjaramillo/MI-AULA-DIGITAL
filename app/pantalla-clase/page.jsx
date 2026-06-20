'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Responsive, WidthProvider } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import {
  Presentation, Lock, Unlock, Maximize, X, Plus, CheckCircle2,
  RotateCcw, Pencil, Pause, Play, Dices, Shuffle, Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { initials } from '@/lib/helpers'
import { useGroups } from '@/contexts/GroupsContext'

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

export default function ClassroomScreenPage() {
  const router = useRouter()
  const { groups } = useGroups()
  const [groupId, setGroupId] = useState('')
  const [students, setStudents] = useState([])
  const [now, setNow] = useState(new Date())
  const [bgIdx, setBgIdx] = useState(0)
  const [workMode, setWorkMode] = useState('normal')
  const [privacy, setPrivacy] = useState(false)

  // Customizable layout (drag/resize/show/hide)
  const [editMode, setEditMode] = useState(false)
  const [visibleWidgets, setVisibleWidgets] = useState(DEFAULT_VISIBLE)
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS)
  const [noteText, setNoteText] = useState('')
  const [diceValue, setDiceValue] = useState(1)
  const [diceRolling, setDiceRolling] = useState(false)

  useEffect(() => {
    if (groups.length > 0 && !groupId) setGroupId(groups[0].id)
  }, [groups, groupId])

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
        <Button size="sm" variant="ghost" className={isDark ? 'text-white hover:bg-white/10' : ''} onClick={() => router.push('/dashboard')}>
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
