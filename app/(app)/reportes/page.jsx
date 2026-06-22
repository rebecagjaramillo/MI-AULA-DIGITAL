import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { ReportsClient } from './ReportsClient'

async function getReportsInitialData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const groups = await prisma.group.findMany({
     where: { userId: TEACHER_EMAIL },
     orderBy: { created_at: 'asc' }
  })
    
  const students = await prisma.student.findMany({
     where: { userId: TEACHER_EMAIL, active: true },
     orderBy: [ { student_number: 'asc' }, { last_name: 'asc' } ]
  })
  
  return {
    groups: groups,
    students: students
  }
}

export default async function ReportsPage() {
  const data = await getReportsInitialData()
  
  return (
    <ReportsClient 
      serverGroups={data.groups} 
      serverStudents={data.students} 
    />
  )
}
