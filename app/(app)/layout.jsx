import { ProfileProvider } from '@/contexts/ProfileContext'
import Sidebar from '@/components/layout/Sidebar'
import { MobileHeader, MobileBottomNav } from '@/components/layout/MobileNav'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import SessionProvider from '@/components/providers/SessionProvider'
import { prisma } from '@/lib/prisma'

export default async function AppLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  // Simplificamos: si el user tiene name ya está setup. Si antes usábamos profile.setupCompleted, 
  // ahora podemos basarnos en un campo del User o asumir que está configurado si tiene school_name o name.
  // Ajuste según tu lógica actual:
  const profileSetup = user && user.school_name

  if (!profileSetup) {
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
