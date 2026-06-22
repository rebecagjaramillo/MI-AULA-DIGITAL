'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LEVELS_NEW, TRIMESTRES } from '@/lib/constants'
import { useProfile } from '@/contexts/ProfileContext'

export function FilterBar({ value, onChange, groups = [], subjects = [], show = ['level','grade','group','subject','trimestre','dateRange'], compact = false, groupFilterMode = 'name' }) {
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

  const uniqueGroupNames = Array.from(new Set(filteredGroups.map(g => g.name || g.group_name).filter(Boolean))).sort()

  const handleClear = () => {
    const empty = {}
    if (show.includes('level')) empty.level = ''
    if (show.includes('grade')) empty.grade = ''
    if (show.includes('group')) { empty.group_id = ''; empty.groupName = '' }
    if (show.includes('subject')) empty.subject_id = ''
    if (show.includes('trimestre')) empty.trimestre = ''
    if (show.includes('dateRange')) { empty.from = ''; empty.to = '' }
    onChange(empty)
  }

  return (
    <Card className="border-slate-100 mb-4">
      <CardContent className={`p-3 flex flex-wrap items-end gap-2 ${compact ? '' : ''}`}>
        {show.includes('level') && (
          <div className="flex-1 min-w-[100px]">
            <Label htmlFor="filter-level" className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Nivel</Label>
            <Select value={v.level || 'all'} onValueChange={x => set({ level: x === 'all' ? '' : x, grade: '', groupName: '', group_id: '' })}>
              <SelectTrigger id="filter-level" aria-label="Seleccionar nivel" className="h-9 mt-0.5 text-sm"><SelectValue /></SelectTrigger>
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
          <div className="flex-1 min-w-[100px]">
            <Label htmlFor="filter-grade" className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Grado</Label>
            <Select value={v.grade || 'all'} onValueChange={x => set({ grade: x === 'all' ? '' : x, groupName: '', group_id: '' })}>
              <SelectTrigger id="filter-grade" aria-label="Seleccionar grado" className="h-9 mt-0.5 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {show.includes('group') && (
          <div className="flex-1 min-w-[100px]">
            <Label htmlFor="filter-group" className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Grupo</Label>
            {groupFilterMode === 'name' ? (
              <Select value={v.groupName || 'all'} onValueChange={x => set({ groupName: x === 'all' ? '' : x, group_id: '' })}>
                <SelectTrigger id="filter-group" aria-label="Seleccionar grupo" className="h-9 mt-0.5 text-sm"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueGroupNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Select value={v.group_id || 'all'} onValueChange={x => set({ group_id: x === 'all' ? '' : x, groupName: '' })}>
                <SelectTrigger id="filter-group" aria-label="Seleccionar grupo" className="h-9 mt-0.5 text-sm"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filteredGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.level} · {g.grade ? g.grade + ' ' : ''}{g.name || g.group_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        {show.includes('subject') && (
          <div className="min-w-[140px]">
            <Label htmlFor="filter-subject" className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Materia</Label>
            <Select value={v.subject_id || 'all'} onValueChange={x => set({ subject_id: x === 'all' ? '' : x })}>
              <SelectTrigger id="filter-subject" aria-label="Seleccionar materia" className="h-9 mt-0.5 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {show.includes('trimestre') && (
          <div className="min-w-[110px]">
            <Label htmlFor="filter-term" className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Trimestre</Label>
            <Select value={v.trimestre ? String(v.trimestre) : 'all'} onValueChange={x => set({ trimestre: x === 'all' ? null : Number(x) })}>
              <SelectTrigger id="filter-term" aria-label="Seleccionar trimestre" className="h-9 mt-0.5 text-sm"><SelectValue /></SelectTrigger>
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
              <Label className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Desde</Label>
              <Input type="date" className="h-9 mt-0.5 text-sm" value={v.from || ''} onChange={e => set({ from: e.target.value })} />
            </div>
            <div className="min-w-[130px]">
              <Label className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Hasta</Label>
              <Input type="date" className="h-9 mt-0.5 text-sm" value={v.to || ''} onChange={e => set({ to: e.target.value })} />
            </div>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={handleClear} className="h-9 text-slate-500 hover:text-slate-700 text-xs">
          Limpiar
        </Button>
      </CardContent>
    </Card>
  )
}
