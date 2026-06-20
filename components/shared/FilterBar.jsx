'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LEVELS_NEW, TRIMESTRES } from '@/lib/constants'
import { useProfile } from '@/contexts/ProfileContext'

export function FilterBar({ value, onChange, groups = [], subjects = [], show = ['level','grade','group','subject','trimestre','dateRange'], compact = false }) {
  const { profile } = useProfile()
  const customLevels = Array.isArray(profile?.education_levels) && profile.education_levels.length > 0 ? profile.education_levels : []
  
  const v = value || {}
  const set = (patch) => onChange({ ...v, ...patch })
  
  // Available grades based on selected level or groups
  const levelDef = LEVELS_NEW.find(l => l.key === v.level)
  const availableGrades = levelDef ? levelDef.grades : Array.from(new Set(groups.map(g => g.grade).filter(Boolean)))
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
                {customLevels.length > 0 
                  ? customLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)
                  : LEVELS_NEW.map(l => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)
                }
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
