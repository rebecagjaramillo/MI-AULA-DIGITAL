import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { GroupsClient } from './GroupsClient'

async function getGroupsData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const list = await prisma.group.findMany({
     where: { userId: TEACHER_EMAIL },
     orderBy: { created_at: 'asc' },
     include: {
        _count: {
           select: { students: { where: { active: true } } }
        }
     }
  })
  
  // Augment with student count
  const augmented = list.map(g => {
    return { ...g, student_count: g._count.students }
  })
  
  return augmented
}

export default async function GroupsPage() {
  const data = await getGroupsData()
  return <GroupsClient serverGroups={data} />
}
