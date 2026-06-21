'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { PageLayout } from '@/components/layout/PageLayout'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { todayISO } from '@/lib/helpers'

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

export function CalendarClient({ serverEvents, serverGroups }) {
  const router = useRouter()
  const events = serverEvents || []
  const groups = serverGroups || []

  const [currentDate, setCurrentDate] = useState(new Date())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', event_type: 'recordatorio', start_date: todayISO(), end_date: todayISO(), group_id: null })

  const openCreate = (date = null) => {
    setEditing(null)
    setForm({ title: '', description: '', event_type: 'recordatorio', start_date: date || todayISO(), end_date: date || todayISO(), group_id: null })
    setOpen(true)
  }
  
  const openEdit = (ev) => { 
    setEditing(ev); setForm({ ...ev }); setOpen(true) 
  }
  
  const save = async () => {
    if (!form.title.trim()) return toast.error('Pon un título')
    try {
      const type = EVENT_TYPES.find(t => t.value === form.event_type)
      const body = { ...form, color: type?.color || '#3b82f6' }
      if (editing) await api('events/' + editing.id, { method: 'PUT', body: JSON.stringify(body) })
      else await api('events', { method: 'POST', body: JSON.stringify(body) })
      toast.success(editing ? 'Evento actualizado' : 'Evento creado')
      setOpen(false)
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }
  
  const remove = async (ev) => { 
    if (!confirm('¿Eliminar evento?')) return
    try {
      await api('events/' + ev.id, { method: 'DELETE' })
      toast.success('Evento eliminado')
      setOpen(false)
      router.refresh()
    } catch (e) { toast.error(e.message) }
  }

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
  events.forEach(e => { 
    if (!eventsByDate[e.start_date]) eventsByDate[e.start_date] = []
    eventsByDate[e.start_date].push(e) 
  })

  const upcoming = events.filter(e => e.start_date >= todayStr).sort((a,b) => a.start_date.localeCompare(b.start_date)).slice(0, 8)

  return (
    <PageLayout
      title="Calendario"
      subtitle="Tus fechas importantes: exámenes, entregas, juntas y más"
      action={<Button onClick={() => openCreate()} className="bg-sky-500 hover:bg-sky-600 shadow-md"><Plus className="w-4 h-4 mr-1.5" /> Nuevo evento</Button>}
    >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="capitalize text-lg">{monthName}</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} aria-label="Mes anterior">← </Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} aria-label="Mes siguiente">→</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
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
                      <Badge className="text-2xs mt-1" style={{ background: ev.color + '20', color: ev.color, borderColor: ev.color + '40' }}>{type.label}</Badge>
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
              <Label htmlFor="title" className="text-xs font-semibold">Título *</Label>
              <Input id="title" className="mt-1" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej. Examen parcial Matemáticas" />
            </div>
            <div>
              <Label htmlFor="description" className="text-xs font-semibold">Descripción</Label>
              <Textarea id="description" className="mt-1 resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="event_type" className="text-xs font-semibold">Tipo</Label>
                <Select value={form.event_type} onValueChange={v => setForm({...form, event_type: v})}>
                  <SelectTrigger id="event_type" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="group_id" className="text-xs font-semibold">Grupo (opcional)</Label>
                <Select value={form.group_id || 'none'} onValueChange={v => setForm({...form, group_id: v === 'none' ? null : v})}>
                  <SelectTrigger id="group_id" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin grupo —</SelectItem>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.grade} {g.group_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start_date" className="text-xs font-semibold">Fecha inicio</Label>
                <Input id="start_date" type="date" className="mt-1" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-xs font-semibold">Fecha fin</Label>
                <Input id="end_date" type="date" className="mt-1" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center !justify-between">
            <div>{editing && <Button variant="outline" className="text-rose-600 hover:bg-rose-50 border-rose-200" onClick={() => { remove(editing) }}><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Guardar' : 'Crear'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
