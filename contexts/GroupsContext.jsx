'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

const GroupsContext = createContext(null)

export function GroupsProvider({ children }) {
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    return Promise.all([api('groups'), api('subjects')])
      .then(([gs, ss]) => { setGroups(gs); setSubjects(ss) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <GroupsContext.Provider value={{ groups, subjects, loading, reload }}>
      {children}
    </GroupsContext.Provider>
  )
}

export function useGroups() {
  const ctx = useContext(GroupsContext)
  if (!ctx) throw new Error('useGroups debe usarse dentro de <GroupsProvider>')
  return ctx
}
