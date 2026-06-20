import { ProfileProvider } from '@/contexts/ProfileContext'
import { GroupsProvider } from '@/contexts/GroupsContext'

export default function ClassroomScreenLayout({ children }) {
  return (
    <ProfileProvider>
      <GroupsProvider>
        {children}
      </GroupsProvider>
    </ProfileProvider>
  )
}
