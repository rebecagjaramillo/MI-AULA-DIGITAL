import { ProfileProvider } from '@/contexts/ProfileContext'
import { GroupsProvider } from '@/contexts/GroupsContext'
import Sidebar from '@/components/layout/Sidebar'
import { MobileHeader, MobileBottomNav } from '@/components/layout/MobileNav'
import { OnboardingWrapper } from '@/components/layout/OnboardingWrapper'

export default function AppLayout({ children }) {
  return (
    <ProfileProvider>
      <GroupsProvider>
        <div className="min-h-screen bg-slate-50 flex">
          <Sidebar />
          
          <main className="flex-1 min-w-0">
            <MobileHeader />
            <MobileBottomNav />
            
            <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px] mx-auto">
              <OnboardingWrapper>
                {children}
              </OnboardingWrapper>
            </div>
          </main>
        </div>
      </GroupsProvider>
    </ProfileProvider>
  )
}
