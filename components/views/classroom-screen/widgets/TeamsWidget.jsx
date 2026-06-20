import React, { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
export function TeamsWidget({ isDark, students = [], privacy }) {
  const [teamCount, setTeamCount] = useState(4)
  const [teams, setTeams] = useState([])

  const makeTeams = () => {
    if (students.length === 0) return toast.error('Selecciona un grupo con alumnos')
    const shuffled = [...students].sort(() => Math.random() - 0.5)
    const result = Array.from({ length: teamCount }, () => [])
    shuffled.forEach((s, i) => { result[i % teamCount].push(s) })
    setTeams(result)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-xs whitespace-nowrap">Equipos:</Label>
        <Input type="number" min="2" max="10" className="w-14 h-7 text-center text-sm" value={teamCount} onChange={e => setTeamCount(Math.max(2, Math.min(10, Number(e.target.value) || 2)))} />
        <Button size="sm" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); makeTeams() }} disabled={students.length === 0} className="bg-emerald-500 hover:bg-emerald-600 h-7 ml-auto">
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
    </div>
  )
}
