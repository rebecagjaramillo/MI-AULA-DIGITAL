import React, { useState } from 'react'
import { Dices } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetContainer } from './WidgetContainer'

export const DiceWidget = React.forwardRef(({ id, isDark, editMode, onRemove, className, ...props }, ref) => {
  const [diceValue, setDiceValue] = useState(1)
  const [diceRolling, setDiceRolling] = useState(false)

  const rollDice = () => {
    setDiceRolling(true)
    let n = 0
    const id = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      n++
      if (n > 12) { clearInterval(id); setDiceRolling(false) }
    }, 80)
  }

  return (
    <WidgetContainer ref={ref} id={id} title="Dado" icon="🎲" isDark={isDark} editMode={editMode} onRemove={onRemove} className={className} {...props}>
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className={`w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center font-bold text-5xl md:text-6xl shadow-xl transition-transform ${diceRolling ? 'animate-bounce' : ''} ${isDark ? 'bg-white/15 text-white' : 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white'}`}>
          {diceValue}
        </div>
      </div>
      <Button onClick={rollDice} disabled={diceRolling} className="mt-2 bg-sky-500 hover:bg-sky-600 h-8">
        <Dices className="w-4 h-4 mr-1.5" /> {diceRolling ? 'Tirando...' : 'Tirar dado'}
      </Button>
    </WidgetContainer>
  )
})
DiceWidget.displayName = 'DiceWidget'
