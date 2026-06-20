import React, { useState, useEffect } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { WidgetContainer } from './WidgetContainer'

export const TimerWidget = React.forwardRef(({ id, isDark, editMode, onRemove, className, ...props }, ref) => {
  const [timerMin, setTimerMin] = useState(5)
  const [timerSec, setTimerSec] = useState(0)
  const [timerInitial, setTimerInitial] = useState(300)
  const [timerLeft, setTimerLeft] = useState(300)
  const [timerRunning, setTimerRunning] = useState(false)

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
    const interval = setInterval(() => setTimerLeft(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timerRunning, timerLeft])

  const startTimer = () => {
    if (timerLeft <= 0) {
      const total = timerMin * 60 + timerSec
      setTimerInitial(total)
      setTimerLeft(total)
    }
    setTimerRunning(true)
  }

  const resetTimer = () => {
    const total = timerMin * 60 + timerSec
    setTimerInitial(total)
    setTimerLeft(total)
    setTimerRunning(false)
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  return (
    <WidgetContainer ref={ref} id={id} title="Temporizador" icon="⏱️" isDark={isDark} editMode={editMode} onRemove={onRemove} className={className} {...props}>
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
    </WidgetContainer>
  )
})
TimerWidget.displayName = 'TimerWidget'
