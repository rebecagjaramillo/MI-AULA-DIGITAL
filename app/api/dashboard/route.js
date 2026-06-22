import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const TEACHER_EMAIL = session.user.email

    // Perfil
    const user = await prisma.user.findUnique({
      where: { email: TEACHER_EMAIL }
    })
    const { password, ...profile } = user || {}

    // Conteos y listados de grupos y estudiantes
    const groups = await prisma.group.findMany({
      where: { userId: TEACHER_EMAIL, archived: false }
    })
    
    const students = await prisma.student.findMany({
      where: { userId: TEACHER_EMAIL, active: true }
    })
    
    // Sesiones de Asistencia de Hoy
    const today = new Date()
    today.setHours(0,0,0,0) // Inicio de hoy
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        userId: TEACHER_EMAIL,
        date: { gte: today, lt: tomorrow }
      },
      select: { groupId: true, subject: true }
    })
    // Una sesión para el dashboard se cuenta por grupo y subject distintos de hoy
    const uniqueSessions = new Set(todayAttendances.map(a => `${a.groupId}_${a.subject}`))
    const today_sessions_count = uniqueSessions.size

    // Alertas y Asistencia Reciente (últimos 30 días)
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
      
      if (c.falta >= 3) {
         alerts.push({ type: 'faltas', priority: 'high', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.groupId, description: `${c.falta} faltas en los últimos 30 días`, suggested_action: 'Generar reporte individual / contactar tutor' })
      } else if (c.falta >= 2) {
         alerts.push({ type: 'faltas', priority: 'medium', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.groupId, description: `${c.falta} faltas recientes`, suggested_action: 'Hablar con el alumno' })
      }
      
      if (c.retardo >= 3) {
         alerts.push({ type: 'retardos', priority: 'medium', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.groupId, description: `${c.retardo} retardos recientes`, suggested_action: 'Hablar con el alumno' })
      }
    })
    
    // Porcentaje de asistencia (últimos 7 días)
    const last7 = new Date(); last7.setDate(last7.getDate() - 7)
    const lastRecords = recentRecords.filter(r => r.date >= last7)
    const attendancePct = lastRecords.length
      ? Math.round(lastRecords.filter(r => ['presente','justificado', 'retardo'].includes(r.status)).length / lastRecords.length * 100)
      : null
    
    // Actividades Pendientes por Calificar y Próximas
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
      
      if (a.due_date && a.due_date >= today) {
         upcomingActivities.push({ 
            ...a,
            pending: Math.max(0, groupStudents - gradedCount)
         })
      }
    }
    
    // Ordenar próximas por fecha y tomar 5
    upcomingActivities = upcomingActivities
      .sort((x,y) => x.due_date - y.due_date)
      .slice(0, 5)

    return json({
      profile: profile || null,
      groups_count: groups.length,
      students_count: students.length,
      today_sessions_count,
      today: new Date().toISOString().slice(0,10),
      groups,
      alerts,
      attendance_pct_last7: attendancePct,
      recent_records_count: lastRecords.length,
      pending_grading: pendingGrading,
      upcoming_activities: upcomingActivities,
    })

  } catch (error) {
    console.error("Prisma Dashboard GET Error:", error)
    return NextResponse.json({ error: "Error al cargar dashboard" }, { status: 500 })
  }
}
