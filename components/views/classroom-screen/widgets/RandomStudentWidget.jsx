import React, { useState } from 'react'
import { Dices, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { initials } from '@/lib/helpers'
import { WidgetContainer } from './WidgetContainer'

export const RandomStudentWidget = React.forwardRef(({ id, isDark, editMode, onRemove, className, students = [], privacy, ...props }, ref) => {
  const [randomStudent, setRandomStudent] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [excludeRecent, setExcludeRecent] = useState([])

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

  const resetRandom = () => {
    setRandomStudent(null)
    setExcludeRecent([])
  }

  return (
    <WidgetContainer ref={ref} id={id} title="Alumno al azar" icon="🎲" isDark={isDark} editMode={editMode} onRemove={onRemove} className={className} {...props}>
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
    </WidgetContainer>
  )
})
RandomStudentWidget.displayName = 'RandomStudentWidget'
