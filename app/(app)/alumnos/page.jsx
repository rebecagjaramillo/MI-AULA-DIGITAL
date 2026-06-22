import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { StudentsClient } from './StudentsClient'

async function getStudentsData(level, grade, groupName, groupId) {
  const sessionAuth = await getServerSession(authOptions)
  if (!sessionAuth) redirect('/login')
  
  const TEACHER_EMAIL = sessionAuth.user.email

  // If nothing is selected, return empty
  if (!level && !grade && !groupName && !groupId) {
    return { students: [], filterState: { level: '', grade: '', groupName: '', groupId: '' } }
  }

  const groupFilter = { userId: TEACHER_EMAIL }
  if (groupId) groupFilter.id = groupId
  if (level) groupFilter.level = level
  if (grade) groupFilter.grade = grade
  if (groupName) groupFilter.name = groupName

  const matchingGroups = await prisma.group.findMany({ where: groupFilter, select: { id: true } })
  const groupIds = matchingGroups.map(g => g.id)

  const list = await prisma.student.findMany({
     where: { userId: TEACHER_EMAIL, groupId: { in: groupIds } },
     orderBy: [
        { student_number: 'asc' },
        { last_name: 'asc' }
     ]
  })
  
  return { 
    students: list, 
    filterState: { level: level || '', grade: grade || '', groupName: groupName || '', groupId: groupId || '' }
  }
}

export default async function StudentsPage({ searchParams }) {
  const data = await getStudentsData(searchParams?.level, searchParams?.grade, searchParams?.groupName, searchParams?.groupId)
  
  return <StudentsClient serverStudents={data.students} serverFilter={data.filterState} />
}
