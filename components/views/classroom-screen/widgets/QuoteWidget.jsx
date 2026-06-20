import React, { useState } from 'react'
import { Lightbulb, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetContainer } from './WidgetContainer'

const QUOTES = [
  'La educación es el arma más poderosa para cambiar el mundo. — Nelson Mandela',
  'Enseñar es aprender dos veces. — Joseph Joubert',
  'El que aprende y aprende y no practica lo que sabe, es como el que ara y ara y no siembra. — Platón',
  'Los grandes maestros son aquellos que se convierten en puentes para que sus alumnos los crucen. — Nikos Kazantzakis',
  'La mente no es un recipiente que llenar, sino un fuego que encender. — Plutarco',
  'El éxito no es definitivo, el fracaso no es fatal: lo que cuenta es el valor para continuar. — W. Churchill',
  'Si puedes soñarlo, puedes hacerlo. — Walt Disney',
  'Aprende como si fueras a vivir para siempre. — Mahatma Gandhi',
]

export const QuoteWidget = React.forwardRef(({ id, isDark, editMode, onRemove, className, ...props }, ref) => {
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))

  return (
    <WidgetContainer ref={ref} id={id} title="Frase del día" icon="💡" isDark={isDark} editMode={editMode} onRemove={onRemove} className={className} {...props}>
      <div className="flex-1 flex flex-col items-center justify-center text-center relative min-h-0">
        <Lightbulb className={`w-6 h-6 mb-2 ${isDark ? 'text-amber-300' : 'text-amber-500'}`} />
        <p className="text-base md:text-lg italic font-medium leading-relaxed max-w-3xl">"{QUOTES[quoteIdx].split(' — ')[0]}"</p>
        <p className={`text-xs mt-1.5 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>— {QUOTES[quoteIdx].split(' — ')[1] || ''}</p>
        <Button size="sm" variant="outline" onClick={() => setQuoteIdx((quoteIdx + 1) % QUOTES.length)} className={`mt-2 h-7 text-xs ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''}`}>
          <Shuffle className="w-3 h-3 mr-1" /> Otra frase
        </Button>
      </div>
    </WidgetContainer>
  )
})
QuoteWidget.displayName = 'QuoteWidget'
