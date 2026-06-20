import React, { useState } from 'react'
import { Plus, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
export function TodosWidget({ isDark }) {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Revisar tarea', done: false },
    { id: 2, text: 'Ejercicios de la página 45', done: false },
    { id: 3, text: 'Compartir respuestas en parejas', done: false },
  ])
  const [newTodo, setNewTodo] = useState('')

  const addTodo = () => {
    if (!newTodo.trim()) return
    setTodos(t => [...t, { id: Date.now(), text: newTodo, done: false }])
    setNewTodo('')
  }
  
  const toggleTodo = (id) => setTodos(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const removeTodo = (id) => setTodos(t => t.filter(x => x.id !== id))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-1 overflow-auto min-h-0 mb-2" onMouseDown={e => e.stopPropagation()}>
        {todos.map(t => (
          <div key={t.id} className={`flex items-center gap-2 p-1.5 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} group`}>
            <button onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); toggleTodo(t.id) }} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-emerald-500 border-emerald-500' : isDark ? 'border-white/40' : 'border-slate-300'}`}>
              {t.done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </button>
            <span className={`flex-1 text-sm ${t.done ? 'line-through opacity-50' : ''}`}>{t.text}</span>
            <button onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeTodo(t.id) }} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Input 
          value={newTodo} 
          onChange={e => setNewTodo(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && addTodo()} 
          placeholder="Nueva actividad..." 
          className={`h-8 text-sm ${isDark ? 'bg-white/10 border-white/10 text-white placeholder:text-white/40' : ''}`} 
        />
        <Button size="sm" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); addTodo() }} className="bg-sky-500 hover:bg-sky-600 h-8"><Plus className="w-4 h-4" /></Button>
      </div>
    </div>
  )
}
