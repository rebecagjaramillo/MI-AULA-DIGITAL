import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { ActivitiesClient } from './ActivitiesClient'

async function getActivitiesPrisma(TEACHER_EMAIL, search) {
  const filter = { userId: TEACHER_EMAIL }
  if (search.groupId) filter.groupId = search.groupId
  if (search.subjectId) filter.subject_id = search.subjectId
  if (search.trimestre) filter.trimestre = Number(search.trimestre)
  if (search.from) filter.due_date = { gte: new Date(search.from) }
  if (search.to) filter.due_date = { ...filter.due_date, lte: new Date(search.to) }

  const list = await prisma.activity.findMany({
     where: filter,
     orderBy: [ { due_date: 'desc' }, { created_at: 'desc' } ],
     include: {
        grades: true,
        group: {
           include: { _count: { select: { students: { where: { active: true } } } } }
        }
     }
  })
  
  const augmented = list.map(a => {
     const studentsCount = a.group?._count?.students || 0
     const graded = a.grades.filter(g => g.status === 'calificado' || (g.score !== null && g.score !== undefined)).length
     return { ...a, group_id: a.groupId, graded_count: graded, students_count: studentsCount, pending: Math.max(0, studentsCount - graded) }
  })
  return augmented
}

export default async function ActivitiesPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const activities = await getActivitiesPrisma(TEACHER_EMAIL, searchParams || {})

  return <ActivitiesClient serverActivities={activities} />
}
