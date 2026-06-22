import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { AttendanceClient } from './AttendanceClient'
import { todayISO } from '@/lib/helpers'
import { v4 as uuidv4 } from 'uuid'

async function getAttendanceData(paramGroupId, paramDate) {
  const sessionAuth = await getServerSession(authOptions)
  if (!sessionAuth) redirect('/login')
  
  const TEACHER_EMAIL = sessionAuth.user.email

  const resolvedGroupId = paramGroupId || ''

  const resolvedDate = paramDate || todayISO()

  if (!resolvedGroupId) {
    return { students: [], attendance: { session: null, records: [] }, resolvedGroupId: '', resolvedDate }
  }

  const students = await prisma.student.findMany({
     where: { userId: TEACHER_EMAIL, groupId: resolvedGroupId },
     orderBy: [ { student_number: 'asc' }, { last_name: 'asc' } ]
  })
  
  const fromDate = new Date(resolvedDate)
  const toDate = new Date(resolvedDate)
  toDate.setHours(23, 59, 59, 999)

  const recs = await prisma.attendance.findMany({
     where: {
        userId: TEACHER_EMAIL,
        groupId: resolvedGroupId,
        date: { gte: fromDate, lte: toDate }
     }
  })

  // We fake an attendance session to keep compatibility with UI
  const attSession = {
     id: 'session-' + resolvedDate,
     teacher_id: TEACHER_EMAIL,
     group_id: resolvedGroupId,
     subject: '',
     date: resolvedDate,
     notes: ''
  }

  return {
    students: students,
    attendance: { session: attSession, records: recs.map(r => ({ ...r, student_id: r.studentId })) },
    resolvedGroupId,
    resolvedDate
  }
}

export default async function AttendancePage({ searchParams }) {
  const paramGroupId = searchParams?.groupId
  const paramDate = searchParams?.date
  
  const data = await getAttendanceData(paramGroupId, paramDate)
  
  return (
    <AttendanceClient 
      serverStudents={data.students} 
      serverAttendance={data.attendance} 
      resolvedGroupId={data.resolvedGroupId} 
      resolvedDate={data.resolvedDate} 
    />
  )
}
