import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { PlansClient } from './PlansClient'

async function getLessonPlans() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const list = await prisma.lessonPlan.findMany({
     where: { userId: TEACHER_EMAIL },
     orderBy: [ { date: 'desc' }, { created_at: 'desc' } ]
  })
    
  return list
}

export default async function PlansPage() {
  const plans = await getLessonPlans()
  
  return <PlansClient serverPlans={plans} />
}
