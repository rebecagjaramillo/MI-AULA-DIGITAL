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

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const url = new URL(request.url)
    const search = Object.fromEntries(url.searchParams)
    const db = await getDb()

    // /api/reports/group
    if (parts.length === 1 && parts[0] === 'group') {
      const { groupId, from, to } = search
      if (!groupId) return errorRes('groupId required')
      const fromDate = from || '1900-01-01'
      const toDate = to || '2999-12-31'
      const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
      const group = await db.collection('class_groups').findOne({ id: groupId, teacher_id: TEACHER_ID })
      const students = await db.collection('students').find({ teacher_id: TEACHER_ID, group_id: groupId, active: { $ne: false } }).sort({ student_number: 1, last_name: 1 }).toArray()
      const attRecords = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, group_id: groupId, date: { $gte: fromDate, $lte: toDate } }).toArray()
      const activities = await db.collection('activities').find({ teacher_id: TEACHER_ID, group_id: groupId, due_date: { $gte: fromDate, $lte: toDate } }).toArray()
      const grades = await db.collection('activity_grades').find({ teacher_id: TEACHER_ID, activity_id: { $in: activities.map(a => a.id) } }).toArray()

      const enriched = students.map(s => {
        const recs = attRecords.filter(r => r.student_id === s.id)
        const total = recs.length
        const presente = recs.filter(r => r.status === 'presente').length
        const falta = recs.filter(r => r.status === 'falta').length
        const retardo = recs.filter(r => r.status === 'retardo').length
        const justificado = recs.filter(r => r.status === 'justificado').length
        const att_pct = total ? Math.round(((presente + justificado + retardo*0.5) / total) * 100) : null
        const sGrades = grades.filter(g => g.student_id === s.id && g.score !== null && g.score !== undefined)
        const totalScore = sGrades.reduce((sum, g) => {
          const act = activities.find(a => a.id === g.activity_id)
          return sum + (act ? (Number(g.score) / Number(act.max_score)) * 10 : 0)
        }, 0)
        const avg = sGrades.length ? (totalScore / sGrades.length).toFixed(1) : null
        const activities_done = sGrades.length
        const activities_pending = Math.max(0, activities.length - activities_done)
        return { ...stripId(s), total_sessions: total, presente, falta, retardo, justificado, attendance_pct: att_pct, average: avg, activities_done, activities_pending }
      })

      return json({
        profile: stripId(profile),
        group: stripId(group),
        from: fromDate, to: toDate,
        students: enriched,
        activities: activities.map(stripId),
        summary: {
          total_students: students.length,
          total_sessions: new Set(attRecords.map(r => r.date)).size,
          total_activities: activities.length,
          avg_attendance: enriched.filter(e => e.attendance_pct !== null).reduce((a,b) => a+b.attendance_pct, 0) / Math.max(1, enriched.filter(e => e.attendance_pct !== null).length) || 0,
        }
      })
    }

    // /api/reports/student
    if (parts.length === 1 && parts[0] === 'student') {
      const { studentId, from, to } = search
      if (!studentId) return errorRes('studentId required')
      const fromDate = from || '1900-01-01'
      const toDate = to || '2999-12-31'
      const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
      const student = await db.collection('students').findOne({ id: studentId, teacher_id: TEACHER_ID })
      if (!student) return errorRes('Alumno no encontrado', 404)
      const group = await db.collection('class_groups').findOne({ id: student.group_id, teacher_id: TEACHER_ID })
      const attRecords = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, student_id: studentId, date: { $gte: fromDate, $lte: toDate } }).sort({ date: -1 }).toArray()
      const activities = await db.collection('activities').find({ teacher_id: TEACHER_ID, group_id: student.group_id, due_date: { $gte: fromDate, $lte: toDate } }).toArray()
      const grades = await db.collection('activity_grades').find({ teacher_id: TEACHER_ID, student_id: studentId, activity_id: { $in: activities.map(a => a.id) } }).toArray()

      const total = attRecords.length
      const presente = attRecords.filter(r => r.status === 'presente').length
      const falta = attRecords.filter(r => r.status === 'falta').length
      const retardo = attRecords.filter(r => r.status === 'retardo').length
      const justificado = attRecords.filter(r => r.status === 'justificado').length
      const att_pct = total ? Math.round(((presente + justificado + retardo*0.5) / total) * 100) : null

      const gradeRows = activities.map(a => {
        const g = grades.find(gg => gg.activity_id === a.id)
        return {
          activity_id: a.id, title: a.title, type: a.activity_type, due_date: a.due_date, max_score: a.max_score,
          score: g?.score ?? null, status: g?.status || 'pendiente', feedback: g?.feedback || ''
        }
      })
      const scored = gradeRows.filter(r => r.score !== null && r.score !== undefined)
      const avg = scored.length ? (scored.reduce((s,r) => s + (Number(r.score)/Number(r.max_score))*10, 0) / scored.length).toFixed(1) : null

      return json({
        profile: stripId(profile),
        student: stripId(student),
        group: stripId(group),
        from: fromDate, to: toDate,
        attendance: { total, presente, falta, retardo, justificado, attendance_pct: att_pct, records: attRecords.map(stripId) },
        grades: gradeRows,
        average: avg,
      })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
