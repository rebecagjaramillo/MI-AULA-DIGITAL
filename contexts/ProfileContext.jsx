'use client'

import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'

// Este provider ahora solo se encarga de fetchear los datos iniciales y poblar Zustand
export function ProfileProvider({ children }) {
  const setProfileData = useStore(s => s.setProfileData)
  const setLoading = useStore(s => s.setLoading)
  const reloadGroups = useStore(s => s.reloadGroups)

  useEffect(() => {
    api('profile')
      .then(p => setProfileData(p))
      .catch(() => setLoading(false))
    
    reloadGroups()
  }, [setProfileData, setLoading, reloadGroups])

  return children
}

// Hook de compatibilidad para evitar que se rompa el resto de la app
// (Recomendado ir migrando los componentes a `useStore` directamente)
export function useProfile() {
  const profile = useStore(s => s.profile)
  const loading = useStore(s => s.loading)
  const activeSubject = useStore(s => s.activeSubject)
  const setActiveSubject = useStore(s => s.setActiveSubject)
  const updateProfile = useStore(s => s.setProfileData)

  return { profile, loading, activeSubject, setActiveSubject, updateProfile }
}
