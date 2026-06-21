'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, GraduationCap, BookOpen, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NAV_ITEMS } from '@/lib/constants'
import { useStore, useGreeting } from '@/store/useStore'

export default function Sidebar() {
  const pathname = usePathname()
  const greetingName = useGreeting()
  // ⚡ Ahora extraemos EXACTAMENTE lo que necesitamos. Si cambia 'loading', Sidebar NO se renderiza.
  const profile = useStore(state => state.profile)
  const activeSubject = useStore(state => state.activeSubject)
  const setActiveSubject = useStore(state => state.setActiveSubject)

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-slate-200">
      <div className="px-6 pt-6 pb-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-[15px] leading-tight">MI AULA</div>
            <div className="text-xs text-sky-600 font-semibold tracking-wider">DIGITAL</div>
          </div>
        </div>
      </div>

      {profile?.subjects && profile.subjects.length > 0 && (
        <div className="px-4 pt-2 pb-4 border-b border-slate-100 shrink-0">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">MATERIA ACTIVA</label>
          <Select value={activeSubject || ''} onValueChange={setActiveSubject}>
            <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-sm font-semibold text-slate-700 h-9 rounded-xl focus:ring-sky-500">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-500" />
                <SelectValue placeholder="Materia" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {profile.subjects.map(s => (
                <SelectItem key={s} value={s} className="font-medium">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = pathname === item.path || pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.key}
              href={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                active
                  ? 'bg-gradient-to-r from-sky-50 to-indigo-50 text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-sky-600' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4" />}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 mt-auto shrink-0">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 flex flex-col gap-1.5">
          <Link href="/configuracion" className="flex flex-col items-center text-center group pt-1 pb-0.5">
            <div className="w-full min-w-0 px-1">
              <div className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition-colors leading-tight mb-0.5">{greetingName}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{profile?.school_name || 'Tu escuela'}</div>
            </div>
          </Link>
          <Button variant="ghost" className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 justify-center h-8 px-2 rounded-lg font-medium text-[11px] shadow-sm border border-rose-100" onClick={() => window.location.href = '/'}>
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  )
}
