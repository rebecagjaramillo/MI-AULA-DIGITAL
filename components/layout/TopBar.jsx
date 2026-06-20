'use client'

import React from 'react'

export function TopBar({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1 text-sm md:text-base">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
