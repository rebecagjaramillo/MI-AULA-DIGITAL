import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

function errorRes(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    
    // /api/students/[id]/stats
    if (parts.length === 2 && parts[1] === 'stats') {
      const id = parts[0]
      const recs = await prisma.attendance.findMany({ where: { userId: TEACHER_EMAIL, studentId: id } })
      const total = recs.length
      const presente = recs.filter(r => r.status === 'presente').length
      const falta = recs.filter(r => r.status === 'falta').length
      const retardo = recs.filter(r => r.status === 'retardo').length
      const justificado = recs.filter(r => r.status === 'justificado').length
      const pct = total ? Math.round((presente + justificado + retardo*0.5) / total * 100) : 100
      return json({ total, presente, falta, retardo, justificado, attendance_pct: pct })
    }
    
    // /api/students/[id]/detail
    if (parts.length === 2 && parts[1] === 'detail') {
      const id = parts[0]
      const student = await prisma.student.findUnique({ where: { id } })
      if (!student || student.userId !== TEACHER_EMAIL) return errorRes('No encontrado', 404)
      
      const group = await prisma.group.findUnique({ where: { id: student.groupId } })
      
      const recs = await prisma.attendance.findMany({ 
         where: { userId: TEACHER_EMAIL, studentId: id },
         orderBy: { date: 'desc' }
      })
      const total = recs.length
      const presente = recs.filter(r => r.status === 'presente').length
      const falta = recs.filter(r => r.status === 'falta').length
      const retardo = recs.filter(r => r.status === 'retardo').length
      const justificado = recs.filter(r => r.status === 'justificado').length
      const att_pct = total ? Math.round((presente + justificado + retardo*0.5) / total * 100) : null

      const activities = await prisma.activity.findMany({
         where: { userId: TEACHER_EMAIL, groupId: student.groupId },
         orderBy: { due_date: 'desc' },
         include: {
            grades: { where: { studentId: id } }
         }
      })
      
      const gradeRows = activities.map(a => {
        const g = a.grades[0]
        return { 
           activity_id: a.id, title: a.title, type: a.activity_type, due_date: a.due_date, 
           max_score: a.max_score, score: g?.score ?? null, status: g?.status || 'pendiente', feedback: g?.feedback || '' 
        }
      })
      
      const scored = gradeRows.filter(r => r.score !== null && r.score !== undefined)
      const avg = scored.length ? (scored.reduce((s,r) => s + (Number(r.score)/Number(r.max_score))*10, 0) / scored.length).toFixed(1) : null
      const activities_done = scored.length
      const activities_pending = Math.max(0, activities.length - activities_done)

      const points = await prisma.studentPoint.findMany({
         where: { userId: TEACHER_EMAIL, studentId: id },
         orderBy: { created_at: 'desc' }
      })
      
      const points_positive = points.filter(p => p.points > 0).reduce((s,p) => s + p.points, 0)
      const points_negative = points.filter(p => p.points < 0).reduce((s,p) => s + p.points, 0)

      const observations = await prisma.studentObservation.findMany({
         where: { userId: TEACHER_EMAIL, studentId: id },
         orderBy: { created_at: 'desc' }
      })

      return json({
        student,
        group,
        stats: { total, presente, falta, retardo, justificado, attendance_pct: att_pct, activities_done, activities_pending, average: avg, points_positive, points_negative, points_total: points_positive + points_negative },
        attendance_records: recs,
        grades: gradeRows,
        points,
        observations,
      })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Student GET Detail Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)
    
    // /api/students/bulk
    if (parts.length === 1 && parts[0] === 'bulk') {
      const names = (body.names || '').split('\n').map(s => s.trim()).filter(Boolean)
      const docs = names.map((name, i) => {
        const nameParts = name.split(' ')
        const first = nameParts[0] || ''
        const last = nameParts.slice(1).join(' ') || ''
        return {
          userId: TEACHER_EMAIL, 
          groupId: body.group_id,
          first_name: first, 
          last_name: last,
          student_number: (body.start_number || 1) + i,
          guardian_name: '', guardian_contact: '', notes: '', active: true,
          created_at: new Date(),
        }
      })
      
      if (docs.length > 0) {
         const result = await prisma.student.createMany({ data: docs })
         return json({ inserted: result.count })
      }
      return json({ inserted: 0 })
    }

    // /api/students/[id]/points
    if (parts.length === 2 && parts[1] === 'points') {
      const id = parts[0]
      const newPoint = await prisma.studentPoint.create({
         data: {
            userId: TEACHER_EMAIL,
            studentId: id,
            category: body.category || 'Otro',
            points: Number(body.points || 0),
            note: body.note || '',
            date: body.date || new Date().toISOString().slice(0,10),
         }
      })
      return json(newPoint)
    }

    // /api/students/[id]/observations
    if (parts.length === 2 && parts[1] === 'observations') {
      const id = parts[0]
      const newObs = await prisma.studentObservation.create({
         data: {
            userId: TEACHER_EMAIL,
            studentId: id,
            text: body.text || '',
            type: body.type || 'general',
         }
      })
      return json(newObs)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Student POST Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    
    // /api/students/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const body = await readBody(request)
      
      const updateData = {}
      if (body.first_name !== undefined) updateData.first_name = body.first_name
      if (body.last_name !== undefined) updateData.last_name = body.last_name
      if (body.student_number !== undefined) updateData.student_number = body.student_number ? Number(body.student_number) : null
      if (body.guardian_name !== undefined) updateData.guardian_name = body.guardian_name
      if (body.guardian_contact !== undefined) updateData.guardian_contact = body.guardian_contact
      if (body.notes !== undefined) updateData.notes = body.notes
      if (body.active !== undefined) updateData.active = body.active
      if (body.nfc_uid !== undefined) updateData.nfc_uid = body.nfc_uid
      if (body.group_id !== undefined) updateData.groupId = body.group_id

      try {
        const student = await prisma.student.findUnique({ where: { id } })
        if (!student || student.userId !== TEACHER_EMAIL) return errorRes('No autorizado', 403)

        const updatedStudent = await prisma.student.update({
          where: { id },
          data: updateData
        })
        return json(updatedStudent)
      } catch (err) {
        if (err.code === 'P2025') return errorRes('Estudiante no encontrado', 404)
        throw err;
      }
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Student PUT Error:", error)
    return NextResponse.json({ error: "Error al actualizar el estudiante" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    
    // /api/students/[id]
    if (parts.length === 1) {
      const id = parts[0]
      try {
        const student = await prisma.student.findUnique({ where: { id: id } })
        if (!student) return errorRes('Estudiante no encontrado', 404)
        if (student.userId !== TEACHER_EMAIL) return errorRes('No autorizado', 403)
        
        await prisma.student.delete({ where: { id: id } })
        return json({ ok: true })
      } catch (err) {
        if (err.code === 'P2025') return errorRes('Estudiante no encontrado', 404)
        if (err.code === 'P2023') return errorRes('Formato de ID inválido', 400)
        throw err;
      }
    }

    // /api/students/[id]/points/[pointId]
    if (parts.length === 3 && parts[1] === 'points') {
      const pointId = parts[2]
      const point = await prisma.studentPoint.findUnique({ where: { id: pointId } })
      if (!point || point.userId !== TEACHER_EMAIL) return errorRes('No autorizado', 403)
      await prisma.studentPoint.delete({ where: { id: pointId } })
      return json({ ok: true })
    }

    // /api/students/[id]/observations/[obsId]
    if (parts.length === 3 && parts[1] === 'observations') {
      const obsId = parts[2]
      const obs = await prisma.studentObservation.findUnique({ where: { id: obsId } })
      if (!obs || obs.userId !== TEACHER_EMAIL) return errorRes('No autorizado', 403)
      await prisma.studentObservation.delete({ where: { id: obsId } })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Student DELETE Error:", error)
    return NextResponse.json({ error: "Error al eliminar el estudiante" }, { status: 500 })
  }
}
