'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Award, Library, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { TopBar } from '@/components/layout/TopBar'
import { toast } from 'sonner'
import { api } from '@/lib/api'

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

export default function LibraryPage() {
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
