import { ProfileProvider } from '@/contexts/ProfileContext'
import Sidebar from '@/components/layout/Sidebar'
import { MobileHeader, MobileBottomNav } from '@/components/layout/MobileNav'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import SessionProvider from '@/components/providers/SessionProvider'
import { getDb } from '@/lib/mongodb'

export default async function AppLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const db = await getDb()
  const profile = await db.collection('profiles').findOne({ teacher_id: session.user.email })

  if (!profile || !profile.setupCompleted) {
    redirect('/onboarding')
  }

  return (
    <SessionProvider session={session}>
      <ProfileProvider>
        <div className="min-h-screen bg-slate-50 flex">
          <Sidebar />
          
          <main className="flex-1 min-w-0">
            <MobileHeader />
            <MobileBottomNav />
            
            <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </ProfileProvider>
    </SessionProvider>
  )
}
