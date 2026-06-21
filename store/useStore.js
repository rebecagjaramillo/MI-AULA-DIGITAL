import { create } from 'zustand'
import { api } from '@/lib/api'

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
    p.education_levels = p.education_level ? [p.education_level] : [];
  }
  return p;
};

export const useStore = create((set, get) => ({
  profile: null,
  loading: true,
  activeSubject: null,
  
  setProfileData: (rawProfile) => {
    const p = ensureArrays(rawProfile) || { subjects: [], education_levels: [] };
    const currentActive = get().activeSubject;
    const newActive = (p.subjects && p.subjects.length > 0 && (!currentActive || !p.subjects.includes(currentActive))) 
      ? p.subjects[0] 
      : currentActive;
      
    set({ profile: p, loading: false, activeSubject: newActive })
  },
  
  setActiveSubject: (subject) => set({ activeSubject: subject }),
  setLoading: (loading) => set({ loading }),

  // Groups Context Migration
  groups: [],
  subjects: [],
  loadingGroups: true,

  reloadGroups: async () => {
    set({ loadingGroups: true })
    try {
      const [gs, ss] = await Promise.all([api('groups'), api('subjects')])
      set({ groups: gs, subjects: ss, loadingGroups: false })
    } catch {
      set({ loadingGroups: false })
    }
  }
}))

export const useGreeting = () => {
  const profile = useStore(state => state.profile)
  if (!profile) return 'Maestro/a'
  
  const title = profile.title || (profile.gender === 'F' ? 'Profa.' : 'Prof.')
  const name = profile.display_name || profile.full_name || ''
  
  return name ? `${title} ${name}` : title
}
