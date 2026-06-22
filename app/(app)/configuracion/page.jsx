import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

async function getProfileData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const user = await prisma.user.findUnique({
     where: { email: TEACHER_EMAIL }
  })
    
  if (!user) return {}

  const { password, ...profile } = user
  return profile
}

export default async function SettingsPage() {
  const profile = await getProfileData()
  
  return <SettingsClient serverProfile={profile} />
}
