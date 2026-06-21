import { ProfileProvider } from '@/contexts/ProfileContext'

export default function ClassroomScreenLayout({ children }) {
  return (
    <ProfileProvider>
      {children}
    </ProfileProvider>
  )
}
