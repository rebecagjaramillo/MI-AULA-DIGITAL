import React, { useState } from 'react'
export function TrafficLightWidget() {
  const [trafficLight, setTrafficLight] = useState('green') // green, yellow, red

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-2 items-center justify-center min-h-0">
        {[
          { color: 'red',    bg: 'bg-rose-500',    label: 'Silencio total' },
          { color: 'yellow', bg: 'bg-amber-400',   label: 'Voz baja' },
          { color: 'green',  bg: 'bg-emerald-500', label: 'Diálogo libre' },
        ].map(t => {
          const active = trafficLight === t.color
          return (
            <button key={t.color} onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setTrafficLight(t.color) }} className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${t.bg} transition-all ${active ? 'scale-110 ring-4 ring-white shadow-2xl' : 'opacity-30 grayscale'}`} title={t.label} />
          )
        })}
      </div>
      <div className="mt-2 text-sm font-bold text-center">
        {trafficLight === 'red' && '🤫 Silencio total'}
        {trafficLight === 'yellow' && '🗣️ Voz baja'}
        {trafficLight === 'green' && '💬 Diálogo libre'}
      </div>
    </div>
  )
}
