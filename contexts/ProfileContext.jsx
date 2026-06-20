'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSubject, setActiveSubject] = useState(null)

  const ensureArrays = (p) => {
    if (!p) return p;
    if (typeof p.subjects === 'string') {
      p.subjects = p.subjects.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(p.subjects)) {
      p.subjects = [];
    }
    if (typeof p.education_levels === 'string') {
      p.education_levels = p.education_levels.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(p.education_levels)) {
      p.education_levels = p.education_level ? [p.education_level] : []; // Migrate old string
    }
    return p;
  };

  useEffect(() => {
    api('profile')
      .then(p => { 
        const validP = ensureArrays(p);
        setProfile(validP || { subjects: [], education_levels: [] }); 
        if (validP?.subjects && validP.subjects.length > 0) {
          setActiveSubject(validP.subjects[0])
        }
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [])

  const updateProfile = useCallback((newProfile) => {
    const validProfile = ensureArrays(newProfile);
    setProfile(validProfile)
    if (validProfile?.subjects && validProfile.subjects.length > 0 && (!activeSubject || !validProfile.subjects.includes(activeSubject))) {
      setActiveSubject(validProfile.subjects[0])
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
