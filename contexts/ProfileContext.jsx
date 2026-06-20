'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSubject, setActiveSubject] = useState(null)

  useEffect(() => {
    api('profile')
      .then(p => { 
        setProfile(p); 
        if (p?.subjects && p.subjects.length > 0) {
          setActiveSubject(p.subjects[0])
        }
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [])

  const updateProfile = useCallback((newProfile) => {
    setProfile(newProfile)
    if (newProfile?.subjects && newProfile.subjects.length > 0 && (!activeSubject || !newProfile.subjects.includes(activeSubject))) {
      setActiveSubject(newProfile.subjects[0])
    }
  }, [activeSubject])

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, activeSubject, setActiveSubject }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile debe usarse dentro de <ProfileProvider>')
  return ctx
}
