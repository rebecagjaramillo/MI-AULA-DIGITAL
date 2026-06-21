"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sparkles, ArrowRight, ArrowLeft, School, BookOpen, Layers, CheckCircle2, Loader2, Palette, Backpack, Microscope, BookMarked, GraduationCap, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

const LEVELS = ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria', 'Universidad', 'Otro']
const LEVEL_ICONS = {
  'Preescolar': Palette,
  'Primaria': Backpack,
  'Secundaria': Microscope,
  'Preparatoria': BookMarked,
  'Universidad': GraduationCap
}
const COMMON_SUBJECTS = ['Matemáticas', 'Español', 'Ciencias Naturales', 'Historia', 'Geografía', 'Inglés', 'Educación Física', 'Artes']
const TITLES_BY_GENDER = {
  M: ['Prof.', 'Mtro.', 'Dr.', 'Ing.', 'Lic.'],
  F: ['Profa.', 'Mtra.', 'Dra.', 'Ing.', 'Lic.'],
  O: ['Prof/a.', 'Mtro/a.', 'Dr/a.', 'Ing.', 'Lic.']
}

export function OnboardingClient() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showCustomLevel, setShowCustomLevel] = useState(false)
  const [showCustomSubject, setShowCustomSubject] = useState(false)
  
  const [form, setForm] = useState({
    full_name: '',
    display_name: '',
    school_name: '',
    gender: '',
    title: '',
    education_levels: [], // array
    subjects: [] // array
  })

  useEffect(() => {
    if (session?.user && !form.full_name) {
      setForm(prev => ({
        ...prev,
        full_name: session.user.name || '',
        display_name: session.user.name?.split(' ')[0] || ''
      }))
    }
  }, [session])

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const toggleSubject = (subj) => {
    setForm(prev => {
      const isSelected = prev.subjects.includes(subj)
      if (isSelected) {
        return { ...prev, subjects: prev.subjects.filter(s => s !== subj) }
      } else {
        return { ...prev, subjects: [...prev.subjects, subj] }
      }
    })
  }

  const [customSubject, setCustomSubject] = useState('')
  const addCustomSubject = (e) => {
    e.preventDefault()
    if (!customSubject.trim()) return
    if (!form.subjects.includes(customSubject.trim())) {
      setForm(prev => ({ ...prev, subjects: [...prev.subjects, customSubject.trim()] }))
    }
    setCustomSubject('')
  }

  const toggleLevel = (lv) => {
    setForm(prev => {
      const isSelected = prev.education_levels.includes(lv)
      if (isSelected) {
        return { ...prev, education_levels: prev.education_levels.filter(l => l !== lv) }
      } else {
        return { ...prev, education_levels: [...prev.education_levels, lv] }
      }
    })
  }

  const [customLevel, setCustomLevel] = useState('')
  const addCustomLevel = (e) => {
    e.preventDefault()
    if (!customLevel.trim()) return
    if (!form.education_levels.includes(customLevel.trim())) {
      setForm(prev => ({ ...prev, education_levels: [...prev.education_levels, customLevel.trim()] }))
    }
    setCustomLevel('')
  }

  const finishOnboarding = async () => {
    if (form.subjects.length === 0) {
      toast.error('Por favor selecciona al menos una materia')
      return
    }
    
    setLoading(true)
    try {
      // Formatear para el API y agregar setupCompleted: true
      const payload = {
        ...form,
        education_levels: form.education_levels,
        subjects: form.subjects, 
        setupCompleted: true,
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Error al guardar el perfil')
      
      toast.success('¡Perfil configurado con éxito!')
      router.push('/dashboard')
    } catch (e) {
      toast.error(e.message)
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center relative overflow-hidden p-4">
      <div className="relative z-10 w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          <div className={`h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        <div className="p-8 sm:p-12">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-6 shadow-sm">
                <School className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">Configura tu perfil</h1>
              <p className="text-slate-500 text-sm mb-8">Personaliza tu aula. Cuéntanos cómo te gustaría que te llamemos y en qué institución impartes clases.</p>
              
              <div className="space-y-5">
                <div>
                  <Label htmlFor="full_name" className="text-slate-700 ml-0.5">Nombre Completo</Label>
                  <Input 
                    id="full_name"
                    spellCheck={true}
                    className="mt-1.5 h-11" 
                    value={form.full_name} 
                    onChange={e => setForm({...form, full_name: e.target.value})} 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="display_name" className="text-slate-700 ml-0.5">Nombre a mostrar (Apodo)</Label>
                    <Input 
                      id="display_name"
                      spellCheck={true}
                      className="mt-1.5 h-11" 
                      placeholder="Ej. Profe Juan"
                      value={form.display_name} 
                      onChange={e => setForm({...form, display_name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="school_name" className="text-slate-700 ml-0.5">Nombre de la Escuela</Label>
                    <Input 
                      id="school_name"
                      spellCheck={true}
                      className="mt-1.5 h-11" 
                      placeholder="Ej. Primaria Leona Vicario"
                      value={form.school_name} 
                      onChange={e => setForm({...form, school_name: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                  <div>
                    <Label htmlFor="gender" className="text-slate-700 ml-0.5">Género</Label>
                    <select 
                      id="gender"
                      className="w-full mt-1.5 focus:ring-sky-500 text-slate-900 bg-white rounded-md p-2 h-11 border border-slate-200 outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all shadow-sm" 
                      value={form.gender} 
                      onChange={e => setForm({...form, gender: e.target.value})} 
                    >
                      <option value="">Selecciona...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="title" className="text-slate-700 ml-0.5">Título</Label>
                    <select 
                      id="title"
                      className="w-full mt-1.5 focus:ring-sky-500 text-slate-900 bg-white rounded-md p-2 h-11 border border-slate-200 outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                      value={form.title} 
                      onChange={e => setForm({...form, title: e.target.value})}
                      disabled={!form.gender}
                    >
                      <option value="">{form.gender ? 'Selecciona...' : 'Primero elige un género'}</option>
                      {form.gender && TITLES_BY_GENDER[form.gender]?.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-6 shadow-sm">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">Niveles Escolares</h1>
              <p className="text-slate-500 text-sm mb-8">Cuéntanos en qué niveles o grados enseñas habitualmente. Puedes seleccionar una o varias opciones.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {LEVELS.filter(l => l !== 'Otro').map(level => {
                  const isSelected = form.education_levels.includes(level)
                  const Icon = LEVEL_ICONS[level] || Layers
                  return (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      className={`relative py-4 px-4 h-28 rounded-2xl border text-sm font-medium transition-all flex flex-col items-center justify-center gap-1 shadow-sm ${
                        isSelected
                        ? 'bg-sky-50 border-sky-600 text-sky-700 ring-1 ring-sky-600/50' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5">
                          <CheckCircle2 className="w-4 h-4 text-sky-600" />
                        </div>
                      )}
                      <Icon className={`w-7 h-7 mb-1 transition-colors ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} strokeWidth={1.5} />
                      <span className="text-center leading-tight">{level}</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => setShowCustomLevel(!showCustomLevel)}
                  className={`relative py-4 px-4 h-28 rounded-2xl border text-sm font-medium transition-all flex flex-col items-center justify-center gap-1 shadow-sm ${
                    showCustomLevel
                    ? 'bg-slate-100 border-slate-300 text-slate-900' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-dashed'
                  }`}
                >
                  <Plus className={`w-7 h-7 mb-1 transition-colors ${showCustomLevel ? 'text-slate-600' : 'text-slate-400'}`} strokeWidth={1.5} />
                  <span className="text-center leading-tight">Otro</span>
                </button>
              </div>

              {showCustomLevel && (
               <form onSubmit={addCustomLevel} className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="custom_level" className="text-slate-700 mb-1.5 ml-0.5 block">Escribe tu nivel escolar</Label>
                  <div className="flex gap-3">
                    <Input 
                      id="custom_level"
                      spellCheck={true}
                      className="h-11 flex-1" 
                      placeholder="Ej. Taller de Arte, Curso Verano..."
                      value={customLevel}
                      onChange={e => setCustomLevel(e.target.value)}
                    />
                    <Button type="button" onClick={addCustomLevel} variant="outline" className="h-11 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold shadow-sm">Agregar</Button>
                  </div>
                </form>
              )}

              {form.education_levels.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-2 shadow-sm">
                  <span className="text-sm font-medium text-slate-600 w-full mb-1">Niveles seleccionados:</span>
                  {form.education_levels.map(l => (
                    <Badge key={l} className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-none px-3 py-1 text-sm font-normal">
                      {l} <button onClick={() => toggleLevel(l)} className="ml-2 font-bold hover:text-slate-900">&times;</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-6 shadow-sm">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">Tus Materias</h1>
              <p className="text-slate-500 text-sm mb-8">Selecciona o agrega las materias que impartes. Cada una contará con un espacio exclusivo para organizar tus clases, recursos y actividades.</p>
              
              <div className="mb-6 flex flex-wrap gap-3">
                {COMMON_SUBJECTS.map(subj => {
                  const isSelected = form.subjects.includes(subj)
                  return (
                    <button
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all shadow-sm ${
                        isSelected 
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sky-600/20' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {subj}
                    </button>
                  )
                })}
                <button
                  onClick={() => setShowCustomSubject(!showCustomSubject)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all shadow-sm flex items-center gap-1 ${
                    showCustomSubject
                    ? 'bg-slate-100 border-slate-300 text-slate-900' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 border-dashed'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Otra
                </button>
              </div>

              {showCustomSubject && (
                <form onSubmit={addCustomSubject} className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="custom_subject" className="text-slate-700 mb-1.5 ml-0.5 block">Nombre de la materia</Label>
                  <div className="flex gap-3">
                    <Input 
                      id="custom_subject"
                      spellCheck={true}
                      className="h-11 flex-1" 
                      placeholder="Ej. Robótica, Programación..."
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                    />
                    <Button type="button" onClick={addCustomSubject} variant="outline" className="h-11 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold shadow-sm">Agregar</Button>
                  </div>
                </form>
              )}

              {form.subjects.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-2 shadow-sm">
                  <span className="text-sm font-medium text-slate-600 w-full mb-1">Materias seleccionadas:</span>
                  {form.subjects.map(s => (
                    <Badge key={s} className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-none px-3 py-1 text-sm font-normal">
                      {s} <button onClick={() => toggleSubject(s)} className="ml-2 font-bold hover:text-slate-900">&times;</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={step === 1 || loading}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
            </Button>
            
            {step < 3 ? (
              <Button onClick={nextStep} className="h-11 bg-sky-600 hover:bg-sky-700 text-white px-8 rounded-xl font-medium shadow-md">
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={finishOnboarding} disabled={loading} className="h-11 bg-sky-600 hover:bg-sky-700 text-white px-8 rounded-xl font-medium shadow-md shadow-sky-600/25">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loading ? 'Configurando Aula...' : 'Comenzar'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
