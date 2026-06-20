import React, { useState } from 'react'
import { WidgetContainer } from './WidgetContainer'

export const TrafficLightWidget = React.forwardRef(({ id, isDark, editMode, onRemove, className, ...props }, ref) => {
  const [trafficLight, setTrafficLight] = useState('green') // green, yellow, red

  return (
    <WidgetContainer ref={ref} id={id} title="Semáforo de conducta" icon="🚦" isDark={isDark} editMode={editMode} onRemove={onRemove} className={className} {...props}>
      <div className="flex-1 flex flex-col gap-2 items-center justify-center min-h-0">
        {[
          { color: 'red',    bg: 'bg-rose-500',    label: 'Silencio total' },
          { color: 'yellow', bg: 'bg-amber-400',   label: 'Voz baja' },
          { color: 'green',  bg: 'bg-emerald-500', label: 'Diálogo libre' },
        ].map(t => {
          const active = trafficLight === t.color
          return (
            <button key={t.color} onClick={() => setTrafficLight(t.color)} className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${t.bg} transition-all ${active ? 'scale-110 ring-4 ring-white shadow-2xl' : 'opacity-30 grayscale'}`} title={t.label} />
          )
        })}
      </div>
      <div className="mt-2 text-sm font-bold text-center">
        {trafficLight === 'red' && '🤫 Silencio total'}
        {trafficLight === 'yellow' && '🗣️ Voz baja'}
        {trafficLight === 'green' && '💬 Diálogo libre'}
      </div>
    </WidgetContainer>
  )
})
TrafficLightWidget.displayName = 'TrafficLightWidget'
