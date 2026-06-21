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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { useStore } from '@/store/useStore'

import { ClockWidget } from '@/components/views/classroom-screen/widgets/ClockWidget'
import { TimerWidget } from '@/components/views/classroom-screen/widgets/TimerWidget'
import { TrafficLightWidget } from '@/components/views/classroom-screen/widgets/TrafficLightWidget'
import { RandomStudentWidget } from '@/components/views/classroom-screen/widgets/RandomStudentWidget'
import { TeamsWidget } from '@/components/views/classroom-screen/widgets/TeamsWidget'
import { InstructionsWidget } from '@/components/views/classroom-screen/widgets/InstructionsWidget'
import { TodosWidget } from '@/components/views/classroom-screen/widgets/TodosWidget'
import { QuoteWidget } from '@/components/views/classroom-screen/widgets/QuoteWidget'
import { NoteWidget } from '@/components/views/classroom-screen/widgets/NoteWidget'
import { DiceWidget } from '@/components/views/classroom-screen/widgets/DiceWidget'
import { WidgetContainer } from '@/components/views/classroom-screen/widgets/WidgetContainer'

const WidgetMap = {
  clock: ClockWidget,
  timer: TimerWidget,
  traffic: TrafficLightWidget,
  random: RandomStudentWidget,
  teams: TeamsWidget,
  instructions: InstructionsWidget,
  todos: TodosWidget,
  quote: QuoteWidget,
  note: NoteWidget,
  dice: DiceWidget,
}

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

const WORK_MODES = [
  { value: 'normal',   label: 'Clase normal',     emoji: '📚', color: 'from-sky-500 to-indigo-500' },
  { value: 'silencio', label: 'Lectura silenciosa', emoji: '🤫', color: 'from-violet-500 to-purple-500' },
  { value: 'examen',   label: 'Examen',           emoji: '📝', color: 'from-rose-500 to-red-500' },
  { value: 'equipos',  label: 'Trabajo en equipos', emoji: '👥', color: 'from-emerald-500 to-teal-500' },
  { value: 'proyecto', label: 'Proyecto',         emoji: '🎯', color: 'from-amber-500 to-orange-500' },
  { value: 'recreo',   label: 'Receso',           emoji: '🎉', color: 'from-pink-500 to-rose-500' },
]

const BG_COLORS = [
  { name: 'Aurora',  bg: 'bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100' },
  { name: 'Bosque',  bg: 'bg-gradient-to-br from-emerald-100 via-teal-100 to-sky-100' },
  { name: 'Atardecer', bg: 'bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100' },
  { name: 'Coral',   bg: 'bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100' },
  { name: 'Noche',   bg: 'bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 text-white' },
  { name: 'Limpio',  bg: 'bg-slate-50' },
]

export default function ScreenContent({ serverStudents, resolvedGroupId }) {
  const router = useRouter()
  const groups = useStore(s => s.groups)
  
  const groupId = resolvedGroupId || ''
  const students = serverStudents || []
  
  const [isMounted, setIsMounted] = useState(false)
  const [workMode, setWorkMode] = useState('normal')
  const [bgIdx, setBgIdx] = useState(0)
  const [privacy, setPrivacy] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [visibleWidgets, setVisibleWidgets] = useState(DEFAULT_VISIBLE)
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS)

  // Load custom config from localStorage
  useEffect(() => {
    setIsMounted(true)
    try {
      const saved = localStorage.getItem('mad_classroom_config')
      if (saved) {
        const c = JSON.parse(saved)
        if (Array.isArray(c.visible) && c.visible.length) setVisibleWidgets(c.visible)
        if (c.layouts && typeof c.layouts === 'object' && Object.keys(c.layouts).length > 0) {
          setLayouts(c.layouts)
        }
      }
    } catch {}
  }, [])

  const persistConfig = (patch = {}) => {
    try {
      const cur = { visible: visibleWidgets, layouts, ...patch }
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

  const handleGroupChange = (newId) => {
    router.push(`/pantalla-clase?groupId=${newId}`)
  }

  const goFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  if (!isMounted) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Cargando tu salón de clases...</p>
        </div>
      </div>
    )
  }

  const bg = BG_COLORS[bgIdx] || BG_COLORS[0]
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
        <Select value={groupId} onValueChange={handleGroupChange}>
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
          layouts={layouts || DEFAULT_LAYOUTS}
          breakpoints={{ lg: 1200, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={48}
          margin={[14, 14]}
          containerPadding={[0, 0]}
          isDraggable={editMode}
          isResizable={editMode}
          useCSSTransforms={true}
          draggableHandle=".drag-handle"
          onLayoutChange={onLayoutChange}
          compactType="vertical"
          preventCollision={false}
        >
          {visibleWidgets.filter(k => WIDGET_REGISTRY[k]).map(key => {
            const WidgetComponent = WidgetMap[key]
            if (!WidgetComponent) return null
            const reg = WIDGET_REGISTRY[key]
            
            return (
              <WidgetContainer
                key={key}
                id={key}
                title={reg.name}
                icon={reg.icon}
                isDark={isDark}
                editMode={editMode}
                onRemove={toggleWidget}
                className={cardClass}
              >
                <WidgetComponent
                  isDark={isDark}
                  students={students}
                  privacy={privacy}
                />
              </WidgetContainer>
            )
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}
