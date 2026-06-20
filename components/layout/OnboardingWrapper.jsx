'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useProfile } from '@/contexts/ProfileContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const LEVELS = ['Preescolar','Primaria','Secundaria','Preparatoria','Universidad','Otro']
const SHIFTS = ['Matutino','Vespertino','Mixto']

export function OnboardingWrapper({ children }) {
  const { profile, loading, updateProfile } = useProfile()
  const [form, setForm] = useState({
    full_name: '', display_name: '', school_name: '',
    education_level: 'Primaria', shift: 'Matutino', subjects: ''
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.full_name.trim()) return toast.error('Ingresa tu nombre')
    setSaving(true)
    try {
      const p = await api('profile', { method: 'POST', body: JSON.stringify({ ...form, display_name: form.display_name || form.full_name }) })
      toast.success('¡Bienvenido/a a MI AULA DIGITAL!')
      updateProfile(p)
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const showOnboarding = !loading && !profile

  return (
    <>
      {children}
      <Dialog open={showOnboarding}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden" hideCloseButton>
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 px-6 py-7 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl">¡Te damos la bienvenida!</DialogTitle>
                <DialogDescription className="text-sky-100">Cuéntanos un poco sobre ti</DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Nombre completo *</Label>
                <Input className="mt-1" placeholder="Ej. Rebeca Martínez" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">¿Cómo te llamamos?</Label>
                <Input className="mt-1" placeholder="Ej. Profa. Rebeca" value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Escuela</Label>
              <Input className="mt-1" placeholder="Ej. Escuela Primaria Benito Juárez" value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Nivel educativo</Label>
                <Select value={form.education_level} onValueChange={v => setForm({...form, education_level: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Turno</Label>
                <Select value={form.shift} onValueChange={v => setForm({...form, shift: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Materia(s) que impartes</Label>
              <Input className="mt-1" placeholder="Ej. Matemáticas, Ciencias" value={form.subjects} onChange={e => setForm({...form, subjects: e.target.value})} />
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 sm:justify-end">
            <Button onClick={submit} disabled={saving} className="bg-sky-500 hover:bg-sky-600 shadow-md">
              {saving ? 'Guardando...' : 'Comenzar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
