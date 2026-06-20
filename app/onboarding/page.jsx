"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sparkles, ArrowRight, ArrowLeft, School, BookOpen, Layers, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

const LEVELS = ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria', 'Universidad', 'Otro']
const COMMON_SUBJECTS = ['Matemáticas', 'Español', 'Ciencias Naturales', 'Historia', 'Geografía', 'Inglés', 'Educación Física', 'Artes']

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    full_name: '',
    display_name: '',
    school_name: '',
    education_level: 'Primaria',
    subjects: [] // array of subjects
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
        subjects: form.subjects, // Array en lugar de string
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden p-4">
      {/* Elementos de fondo */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-sky-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>

      <div className="relative z-10 w-full max-w-2xl bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-800 flex">
          <div className={`h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        <div className="p-8 sm:p-12">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 ring-1 ring-indigo-500/20">
                <School className="w-7 h-7 text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Bienvenido a tu nueva aula</h1>
              <p className="text-slate-400 mb-8">Vamos a personalizar tu experiencia. ¿Cómo te gustaría que te llamemos y en dónde das clases?</p>
              
              <div className="space-y-5">
                <div>
                  <Label className="text-slate-300 ml-1">Nombre Completo</Label>
                  <Input 
                    className="bg-slate-800/50 border-slate-700 mt-1 focus:ring-indigo-500 text-white" 
                    value={form.full_name} 
                    onChange={e => setForm({...form, full_name: e.target.value})} 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-300 ml-1">Nombre a mostrar (Apodo)</Label>
                    <Input 
                      className="bg-slate-800/50 border-slate-700 mt-1 focus:ring-indigo-500 text-white" 
                      placeholder="Ej. Profe Juan"
                      value={form.display_name} 
                      onChange={e => setForm({...form, display_name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 ml-1">Nombre de la Escuela</Label>
                    <Input 
                      className="bg-slate-800/50 border-slate-700 mt-1 focus:ring-indigo-500 text-white" 
                      placeholder="Ej. Primaria Leona Vicario"
                      value={form.school_name} 
                      onChange={e => setForm({...form, school_name: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6 ring-1 ring-sky-500/20">
                <Layers className="w-7 h-7 text-sky-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Nivel Educativo</h1>
              <p className="text-slate-400 mb-8">¿En qué nivel escolar impartes clases habitualmente?</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => setForm({...form, education_level: level})}
                    className={`py-4 px-4 rounded-2xl border text-sm font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                      form.education_level === level 
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-1 ring-sky-500/50' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {form.education_level === level && <CheckCircle2 className="w-5 h-5 mb-1" />}
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 ring-1 ring-violet-500/20">
                <BookOpen className="w-7 h-7 text-violet-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Tus Materias (Workspaces)</h1>
              <p className="text-slate-400 mb-8">Selecciona o escribe las materias que impartes. Cada materia tendrá su propio espacio de trabajo aislado.</p>
              
              <div className="mb-6 flex flex-wrap gap-3">
                {COMMON_SUBJECTS.map(subj => {
                  const isSelected = form.subjects.includes(subj)
                  return (
                    <button
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        isSelected 
                        ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/20' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {subj}
                    </button>
                  )
                })}
              </div>

              <form onSubmit={addCustomSubject} className="flex gap-3 mt-6 pt-6 border-t border-slate-800">
                <Input 
                  className="bg-slate-800/50 border-slate-700 text-white focus:ring-violet-500 flex-1" 
                  placeholder="Escribe otra materia y presiona Enter..."
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                />
                <Button type="button" onClick={addCustomSubject} variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">Agregar</Button>
              </form>

              {form.subjects.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex flex-wrap gap-2">
                  <span className="text-sm text-slate-500 w-full mb-1">Materias seleccionadas:</span>
                  {form.subjects.map(s => (
                    <Badge key={s} className="bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border-none px-3 py-1 text-sm font-normal">
                      {s} <button onClick={() => toggleSubject(s)} className="ml-2 font-bold hover:text-white">&times;</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-800/50">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={step === 1 || loading}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
            </Button>
            
            {step < 3 ? (
              <Button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8">
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={finishOnboarding} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 shadow-lg shadow-indigo-500/25">
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
