'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, LayoutGrid, Users, ClipboardCheck, GraduationCap, MoreHorizontal } from 'lucide-react'

const MOBILE_ITEMS = [
  { key: 'dashboard',  path: '/dashboard',  icon: Home,           label: 'Inicio' },
  { key: 'groups',     path: '/grupos',     icon: LayoutGrid,     label: 'Grupos' },
  { key: 'students',   path: '/alumnos',    icon: Users,          label: 'Alumnos' },
  { key: 'attendance', path: '/asistencia', icon: ClipboardCheck, label: 'Asistencia' },
]

export function MobileHeader() {
  return (
    <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
        <GraduationCap className="w-4 h-4 text-white" />
      </div>
      <div className="font-bold text-slate-900 text-sm">MI AULA DIGITAL</div>
    </div>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around py-2 z-50">
      {MOBILE_ITEMS.map(item => {
        const Icon = item.icon
        const active = pathname === item.path || pathname.startsWith(item.path + '/')
        return (
          <Link
            key={item.key}
            href={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg ${active ? 'text-sky-600' : 'text-slate-400'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
