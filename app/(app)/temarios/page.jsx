import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { CurriculumClient } from './CurriculumClient'

async function getUnitsAndTopics() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const units = await prisma.curriculumUnit.findMany({
     where: { userId: TEACHER_EMAIL },
     orderBy: [ { order_index: 'asc' }, { created_at: 'asc' } ],
     include: {
        topics: {
           orderBy: [ { order_index: 'asc' }, { created_at: 'asc' } ]
        }
     }
  })
  
  return units
}

export default async function CurriculumPage() {
  const units = await getUnitsAndTopics()
  
  return <CurriculumClient serverUnits={units} />
}
