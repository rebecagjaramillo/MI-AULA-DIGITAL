import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"


function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

function errorRes(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const db = await getDb()

    const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
    const groups = await db.collection('class_groups').find({ teacher_id: TEACHER_ID, archived: { $ne: true } }).toArray()
    const students = await db.collection('students').find({ teacher_id: TEACHER_ID, active: { $ne: false } }).toArray()
    const today = new Date().toISOString().slice(0,10)
    const todaySessions = await db.collection('attendance_sessions').find({ teacher_id: TEACHER_ID, date: today }).toArray()
    
    // Alerts: students with many faltas (>= 2) in last 30 days
    const since = new Date(); since.setDate(since.getDate() - 30)
    const sinceStr = since.toISOString().slice(0,10)
    const recentRecords = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, date: { $gte: sinceStr } }).toArray()
    const byStudent = {}
    recentRecords.forEach(r => {
      if (!byStudent[r.student_id]) byStudent[r.student_id] = { falta: 0, retardo: 0, total: 0 }
      byStudent[r.student_id].total++
      if (r.status === 'falta') byStudent[r.student_id].falta++
      if (r.status === 'retardo') byStudent[r.student_id].retardo++
    })
    const alerts = []
    Object.entries(byStudent).forEach(([sid, c]) => {
      const stu = students.find(s => s.id === sid)
      if (!stu) return
      if (c.falta >= 3) alerts.push({ type: 'faltas', priority: 'high', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.group_id, description: `${c.falta} faltas en los últimos 30 días`, suggested_action: 'Generar reporte individual / contactar tutor' })
      else if (c.falta >= 2) alerts.push({ type: 'faltas', priority: 'medium', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.group_id, description: `${c.falta} faltas recientes`, suggested_action: 'Hablar con el alumno' })
      if (c.retardo >= 3) alerts.push({ type: 'retardos', priority: 'medium', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.group_id, description: `${c.retardo} retardos recientes`, suggested_action: 'Hablar con el alumno' })
    })
    
    // Recent attendance summary
    const last7 = new Date(); last7.setDate(last7.getDate() - 7)
    const last7Str = last7.toISOString().slice(0,10)
    const lastRecords = recentRecords.filter(r => r.date >= last7Str)
    const attendancePct = lastRecords.length
      ? Math.round(lastRecords.filter(r => ['presente','justificado'].includes(r.status) || r.status === 'retardo').length / lastRecords.length * 100)
      : null
    
    // Activities pending grading
    const activities = await db.collection('activities').find({ teacher_id: TEACHER_ID }).toArray()
    const gradesCol = db.collection('activity_grades')
    let pendingGrading = 0
    let upcomingActivities = []
    for (const a of activities) {
      const grades = await gradesCol.find({ activity_id: a.id }).toArray()
      const groupStudents = students.filter(s => s.group_id === a.group_id).length
      const gradedCount = grades.filter(g => g.score !== null && g.score !== undefined).length
      if (gradedCount < groupStudents) pendingGrading += (groupStudents - gradedCount)
      if (a.due_date >= today) upcomingActivities.push({ ...stripId(a), pending: Math.max(0, groupStudents - gradedCount) })
    }
    upcomingActivities = upcomingActivities.sort((x,y) => x.due_date.localeCompare(y.due_date)).slice(0, 5)

    return json({
      profile: stripId(profile) || null,
      groups_count: groups.length,
      students_count: students.length,
      today_sessions_count: todaySessions.length,
      today,
      groups: groups.map(stripId),
      alerts,
      attendance_pct_last7: attendancePct,
      recent_records_count: lastRecords.length,
      pending_grading: pendingGrading,
      upcoming_activities: upcomingActivities,
    })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
