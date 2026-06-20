'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, GraduationCap } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NAV_ITEMS } from '@/lib/constants'
import { initials } from '@/lib/helpers'
import { useProfile } from '@/contexts/ProfileContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { profile } = useProfile()

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-slate-200">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-[15px] leading-tight">MI AULA</div>
            <div className="text-[11px] text-sky-600 font-semibold tracking-wider">DIGITAL</div>
          </div>
        </div>
      </div>
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
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50">
          <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold">
              {initials(profile?.display_name || profile?.full_name || 'PR')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{profile?.display_name || 'Maestro/a'}</div>
            <div className="text-[11px] text-slate-500 truncate">{profile?.school_name || 'Tu escuela'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
