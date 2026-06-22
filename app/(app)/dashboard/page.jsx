import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

async function getDashboardData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const user = await prisma.user.findUnique({ where: { email: TEACHER_EMAIL } })
  const profile = user ? { ...user, password: '' } : null

  const groups = await prisma.group.findMany({ where: { userId: TEACHER_EMAIL, archived: false } })
  const students = await prisma.student.findMany({ where: { userId: TEACHER_EMAIL, active: true } })
  const today = new Date().toISOString().slice(0,10)
  
  // We no longer have session collections, count unique dates or just fake today_sessions_count
  const todayStart = new Date(today); todayStart.setHours(0,0,0,0)
  const todayEnd = new Date(today); todayEnd.setHours(23,59,59,999)
  
  const todayRecords = await prisma.attendance.findMany({
     where: { userId: TEACHER_EMAIL, date: { gte: todayStart, lte: todayEnd } }
  })
  
  // Alerts: students with many faltas (>= 2) in last 30 days
  const since = new Date(); since.setDate(since.getDate() - 30)
  const recentRecords = await prisma.attendance.findMany({
     where: { userId: TEACHER_EMAIL, date: { gte: since } }
  })
  
  const byStudent = {}
  recentRecords.forEach(r => {
    if (!byStudent[r.studentId]) byStudent[r.studentId] = { falta: 0, retardo: 0, total: 0 }
    byStudent[r.studentId].total++
    if (r.status === 'falta') byStudent[r.studentId].falta++
    if (r.status === 'retardo') byStudent[r.studentId].retardo++
  })
  
  const alerts = []
  Object.entries(byStudent).forEach(([sid, c]) => {
    const stu = students.find(s => s.id === sid)
    if (!stu) return
    if (c.falta >= 3) alerts.push({ type: 'faltas', priority: 'high', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.groupId, description: `${c.falta} faltas en los ǧltimos 30 das`, suggested_action: 'Generar reporte individual / contactar tutor' })
    else if (c.falta >= 2) alerts.push({ type: 'faltas', priority: 'medium', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.groupId, description: `${c.falta} faltas recientes`, suggested_action: 'Hablar con el alumno' })
    if (c.retardo >= 3) alerts.push({ type: 'retardos', priority: 'medium', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.groupId, description: `${c.retardo} retardos recientes`, suggested_action: 'Hablar con el alumno' })
  })
  
  // Recent attendance summary
  const last7 = new Date(); last7.setDate(last7.getDate() - 7)
  const lastRecords = recentRecords.filter(r => r.date >= last7)
  const attendancePct = lastRecords.length
    ? Math.round(lastRecords.filter(r => ['presente','justificado'].includes(r.status) || r.status === 'retardo').length / lastRecords.length * 100)
    : null
  
  // Activities pending grading
  const activities = await prisma.activity.findMany({
     where: { userId: TEACHER_EMAIL },
     include: { grades: true }
  })
  
  let pendingGrading = 0
  let upcomingActivities = []
  for (const a of activities) {
    const groupStudents = students.filter(s => s.groupId === a.groupId).length
    const gradedCount = a.grades.filter(g => g.score !== null && g.score !== undefined).length
    if (gradedCount < groupStudents) pendingGrading += (groupStudents - gradedCount)
    if (a.due_date && a.due_date >= todayStart) upcomingActivities.push({ ...a, pending: Math.max(0, groupStudents - gradedCount) })
  }
  upcomingActivities = upcomingActivities.sort((x,y) => (x.due_date?.getTime()||0) - (y.due_date?.getTime()||0)).slice(0, 5)

  // fake distinct sessions count
  const distinctGroupsWithAttendanceToday = new Set(todayRecords.map(r => r.groupId)).size

  return {
    profile: profile || null,
    groups_count: groups.length,
    students_count: students.length,
    today_sessions_count: distinctGroupsWithAttendanceToday,
    today,
    groups: groups,
    alerts,
    attendance_pct_last7: attendancePct,
    recent_records_count: lastRecords.length,
    pending_grading: pendingGrading,
    upcoming_activities: upcomingActivities,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <DashboardClient rawData={data} />
}
