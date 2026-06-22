import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

function errorRes(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    const url = new URL(request.url)
    const search = Object.fromEntries(url.searchParams)
    
    // /api/reports/group
    if (parts.length === 1 && parts[0] === 'group') {
      const { groupId, from, to } = search
      if (!groupId) return errorRes('groupId required')
      
      const fromDate = from ? new Date(from) : new Date('1900-01-01')
      const toDate = to ? new Date(to) : new Date('2999-12-31')
      // Ajustar toDate para incluir todo el día
      toDate.setHours(23, 59, 59, 999)

      const user = await prisma.user.findUnique({ where: { email: TEACHER_EMAIL } })
      const { password, ...profile } = user || {}
      
      const group = await prisma.group.findUnique({ where: { id: groupId } })
      if (!group || group.userId !== TEACHER_EMAIL) return errorRes('Grupo no encontrado o no autorizado', 404)

      const students = await prisma.student.findMany({ 
         where: { userId: TEACHER_EMAIL, groupId, active: true },
         orderBy: [{ student_number: 'asc' }, { last_name: 'asc' }]
      })

      const attRecords = await prisma.attendance.findMany({ 
         where: { 
            userId: TEACHER_EMAIL, 
            groupId, 
            date: { gte: fromDate, lte: toDate } 
         } 
      })

      const activities = await prisma.activity.findMany({ 
         where: { 
            userId: TEACHER_EMAIL, 
            groupId, 
            due_date: { gte: fromDate, lte: toDate } 
         },
         include: { grades: true }
      })

      const enriched = students.map(s => {
        const recs = attRecords.filter(r => r.studentId === s.id)
        const total = recs.length
        const presente = recs.filter(r => r.status === 'presente').length
        const falta = recs.filter(r => r.status === 'falta').length
        const retardo = recs.filter(r => r.status === 'retardo').length
        const justificado = recs.filter(r => r.status === 'justificado').length
        const att_pct = total ? Math.round(((presente + justificado + retardo*0.5) / total) * 100) : null
        
        let totalScore = 0
        let sGradesCount = 0

        activities.forEach(act => {
           const g = act.grades.find(gr => gr.studentId === s.id)
           if (g && g.score !== null && g.score !== undefined) {
              totalScore += (Number(g.score) / Number(act.max_score || 10)) * 10
              sGradesCount++
           }
        })
        
        const avg = sGradesCount ? (totalScore / sGradesCount).toFixed(1) : null
        const activities_done = sGradesCount
        const activities_pending = Math.max(0, activities.length - activities_done)
        
        return { 
           ...s, 
           total_sessions: total, presente, falta, retardo, justificado, 
           attendance_pct: att_pct, average: avg, activities_done, activities_pending 
        }
      })

      return json({
        profile: profile,
        group: group,
        from: from || '1900-01-01', to: to || '2999-12-31',
        students: enriched,
        activities: activities,
        summary: {
          total_students: students.length,
          total_sessions: new Set(attRecords.map(r => new Date(r.date).toISOString().slice(0,10))).size,
          total_activities: activities.length,
          avg_attendance: enriched.filter(e => e.attendance_pct !== null).reduce((a,b) => a+b.attendance_pct, 0) / Math.max(1, enriched.filter(e => e.attendance_pct !== null).length) || 0,
        }
      })
    }

    // /api/reports/student
    if (parts.length === 1 && parts[0] === 'student') {
      const { studentId, from, to } = search
      if (!studentId) return errorRes('studentId required')
      
      const fromDate = from ? new Date(from) : new Date('1900-01-01')
      const toDate = to ? new Date(to) : new Date('2999-12-31')
      toDate.setHours(23, 59, 59, 999)

      const user = await prisma.user.findUnique({ where: { email: TEACHER_EMAIL } })
      const { password, ...profile } = user || {}
      
      const student = await prisma.student.findUnique({ where: { id: studentId } })
      if (!student || student.userId !== TEACHER_EMAIL) return errorRes('Alumno no encontrado', 404)
      
      const group = await prisma.group.findUnique({ where: { id: student.groupId } })
      
      const attRecords = await prisma.attendance.findMany({ 
         where: { 
            userId: TEACHER_EMAIL, 
            studentId, 
            date: { gte: fromDate, lte: toDate } 
         },
         orderBy: { date: 'desc' }
      })

      const activities = await prisma.activity.findMany({ 
         where: { 
            userId: TEACHER_EMAIL, 
            groupId: student.groupId, 
            due_date: { gte: fromDate, lte: toDate } 
         },
         include: {
            grades: { where: { studentId: studentId } }
         }
      })

      const total = attRecords.length
      const presente = attRecords.filter(r => r.status === 'presente').length
      const falta = attRecords.filter(r => r.status === 'falta').length
      const retardo = attRecords.filter(r => r.status === 'retardo').length
      const justificado = attRecords.filter(r => r.status === 'justificado').length
      const att_pct = total ? Math.round(((presente + justificado + retardo*0.5) / total) * 100) : null

      const gradeRows = activities.map(a => {
        const g = a.grades[0]
        return {
          activity_id: a.id, title: a.title, type: a.activity_type, due_date: a.due_date, max_score: a.max_score,
          score: g?.score ?? null, status: g?.status || 'pendiente', feedback: g?.feedback || ''
        }
      })
      
      const scored = gradeRows.filter(r => r.score !== null && r.score !== undefined)
      const avg = scored.length ? (scored.reduce((s,r) => s + (Number(r.score)/Number(r.max_score || 10))*10, 0) / scored.length).toFixed(1) : null

      return json({
        profile,
        student,
        group,
        from: from || '1900-01-01', to: to || '2999-12-31',
        attendance: { total, presente, falta, retardo, justificado, attendance_pct: att_pct, records: attRecords },
        grades: gradeRows,
        average: avg,
      })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Reports GET Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
