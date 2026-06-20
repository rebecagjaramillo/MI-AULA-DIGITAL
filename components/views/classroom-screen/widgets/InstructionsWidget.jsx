import React, { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { WidgetContainer } from './WidgetContainer'

export const InstructionsWidget = React.forwardRef(({ id, isDark, editMode, onRemove, className, ...props }, ref) => {
  const [instructions, setInstructions] = useState('1. Saca tu cuaderno y lápiz\n2. Pon atención a la explicación\n3. Trabaja en silencio')

  return (
    <WidgetContainer ref={ref} id={id} title="Instrucciones" icon="📖" isDark={isDark} editMode={editMode} onRemove={onRemove} className={className} {...props}>
      <Textarea 
        value={instructions} 
        onChange={e => setInstructions(e.target.value)} 
        className={`flex-1 min-h-0 text-base resize-none ${isDark ? 'bg-white/10 border-white/10 text-white placeholder:text-white/40' : 'bg-white'}`} 
        placeholder="Escribe las instrucciones para la clase..." 
        onMouseDown={e => e.stopPropagation()}
      />
    </WidgetContainer>
  )
})
InstructionsWidget.displayName = 'InstructionsWidget'
