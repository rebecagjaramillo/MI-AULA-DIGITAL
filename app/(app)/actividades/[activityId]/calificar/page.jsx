import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { GradeClient } from './GradeClient'

async function getActivityGradesPrisma(TEACHER_EMAIL, activityId) {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } })
  if (!activity || activity.userId !== TEACHER_EMAIL) return null
  
  const students = await prisma.student.findMany({ 
     where: { userId: TEACHER_EMAIL, groupId: activity.groupId, active: true }, 
     orderBy: [{student_number: 'asc'}, {last_name:'asc'}] 
  })
  
  const grades = await prisma.activityGrade.findMany({ 
     where: { userId: TEACHER_EMAIL, activityId } 
  })
  
  const byStudent = {}
  grades.forEach(g => { byStudent[g.studentId] = { ...g, student_id: g.studentId } })
  
  return { 
     activity: { ...activity, group_id: activity.groupId }, 
     students: students, 
     grades: byStudent 
  }
}

export default async function GradingPage({ params }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email
  const activityId = params.activityId

  const data = await getActivityGradesPrisma(TEACHER_EMAIL, activityId)

  if (!data) {
    redirect('/actividades')
  }

  return (
    <GradeClient 
      activity={data.activity} 
      students={data.students} 
      serverGrades={data.grades} 
    />
  )
}
