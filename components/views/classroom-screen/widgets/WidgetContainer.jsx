import React from 'react'
import { X } from 'lucide-react'

export const WidgetContainer = React.forwardRef(({ 
  id, title, icon, isDark, editMode, onRemove, className, children, style, onMouseDown, onMouseUp, onTouchEnd, ...props 
}, ref) => {
  return (
    <div 
      ref={ref} 
      style={style}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
      className={`widget-frame relative z-10 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col ${className || ''}`} 
      {...props}
    >
      <div className={`drag-handle flex items-center gap-2 px-3 py-1.5 border-b ${isDark ? 'border-white/10' : 'border-slate-800/50'} ${editMode ? 'cursor-move bg-current/5' : ''}`}>
        <span className="text-sm">{icon}</span>
        <span className={`text-xs font-semibold flex-1 truncate uppercase tracking-wider ${isDark ? 'text-white/70' : 'text-slate-400'}`}>{title}</span>
        {editMode && (
          <button 
            onClick={() => onRemove(id)} 
            onMouseDown={e => e.stopPropagation()} 
            className={`rounded p-0.5 ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-800'}`} 
            title="Ocultar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto mt-2 flex flex-col min-h-0 cursor-default" onMouseDown={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
})
WidgetContainer.displayName = 'WidgetContainer'
