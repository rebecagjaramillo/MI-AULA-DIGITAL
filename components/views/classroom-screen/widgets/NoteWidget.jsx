import React, { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { WidgetContainer } from './WidgetContainer'

export const NoteWidget = React.forwardRef(({ id, isDark, editMode, onRemove, className, ...props }, ref) => {
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mad_classroom_note')
      if (typeof saved === 'string') {
        setNoteText(saved)
      }
    } catch {}
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setNoteText(val)
    try {
      localStorage.setItem('mad_classroom_note', val)
    } catch {}
  }

  return (
    <WidgetContainer ref={ref} id={id} title="Nota libre" icon="📝" isDark={isDark} editMode={editMode} onRemove={onRemove} className={className} {...props}>
      <Textarea 
        value={noteText} 
        onChange={handleChange} 
        className={`flex-1 min-h-0 text-lg resize-none font-medium ${isDark ? 'bg-white/10 border-white/10 text-white placeholder:text-white/40' : 'bg-yellow-50 border-yellow-200'}`} 
        placeholder="Escribe una nota..." 
        onMouseDown={e => e.stopPropagation()}
      />
    </WidgetContainer>
  )
})
NoteWidget.displayName = 'NoteWidget'
