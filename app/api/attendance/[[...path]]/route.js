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

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const url = new URL(request.url)
    const search = Object.fromEntries(url.searchParams)

    // /api/attendance
    if (parts.length === 0) {
      const { groupId, date, subject } = search
      if (!groupId || !date) return errorRes('groupId and date required')
      
      const records = await prisma.attendance.findMany({
        where: { 
          userId: TEACHER_ID, 
          groupId, 
          date: new Date(date),
          ...(subject ? { subject } : {})
        },
        include: { student: true }
      })
      
      // Adaptamos la respuesta a la estructura anterior para compatibilidad
      let mockSession = { 
        id: 'new', 
        teacher_id: TEACHER_ID, 
        group_id: groupId, 
        subject: subject || '', 
        date, 
        notes: '', 
        created_at: new Date().toISOString() 
      }
      
      if (records.length > 0) {
         mockSession.id = records[0].id // Identificador temporal representativo
         mockSession.notes = records[0].notes || ''
         mockSession.subject = records[0].subject || ''
      }
      
      return json({ session: mockSession, records })
    }

    // /api/attendance/history
    if (parts.length === 1 && parts[0] === 'history') {
      const { groupId, days = 30 } = search
      
      const filter = { userId: TEACHER_ID }
      if (groupId) filter.groupId = groupId
      
      const allRecords = await prisma.attendance.findMany({
         where: filter,
         orderBy: { date: 'desc' }
      })
      
      // Agrupar por fecha y subject en memoria
      const grouped = {}
      for (const rec of allRecords) {
         const dateStr = rec.date.toISOString().slice(0, 10)
         const key = `${dateStr}_${rec.subject || ''}_${rec.groupId}`
         
         if (!grouped[key]) {
            grouped[key] = {
              id: rec.id, // Solo un id genérico
              group_id: rec.groupId,
              date: dateStr,
              subject: rec.subject || '',
              notes: rec.notes || '',
              total: 0, presente: 0, falta: 0, retardo: 0, justificado: 0
            }
         }
         
         grouped[key].total++
         if (grouped[key][rec.status] !== undefined) {
             grouped[key][rec.status]++
         }
      }
      
      const summaries = Object.values(grouped)
        .sort((a,b) => new Date(b.date) - new Date(a.date))
        .slice(0, Number(days))
        
      return json(summaries)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Attendance GET Error:", error)
    return NextResponse.json({ error: "Error al obtener asistencia" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)

    // /api/attendance/save
    if (parts.length === 1 && parts[0] === 'save') {
      const { groupId, date, subject = '', records: rs = [], notes = '' } = body
      if (!groupId || !date) return errorRes('groupId and date required')
      
      // Validación de seguridad y relación
      const group = await prisma.group.findUnique({ where: { id: groupId } })
      if (!group || group.userId !== TEACHER_ID) {
         return errorRes('Grupo no válido o no autorizado', 403)
      }
      
      const dateObj = new Date(date)
      
      // Transacción atómica: Borrar registros anteriores y crear nuevos (Upsert masivo)
      const transaction = await prisma.$transaction([
        prisma.attendance.deleteMany({
          where: { userId: TEACHER_ID, groupId, date: dateObj, subject }
        }),
        prisma.attendance.createMany({
          data: rs.map(r => ({
            userId: TEACHER_ID,
            groupId,
            studentId: r.student_id,
            date: dateObj,
            subject,
            notes,
            status: r.status || 'presente',
            justification: r.justification || '',
            created_at: new Date()
          }))
        })
      ])
      
      return json({ ok: true, count: transaction[1].count })
    }

    // /api/attendance/nfc
    if (parts.length === 1 && parts[0] === 'nfc') {
      const { nfc_uid, groupId, date } = body
      if (!nfc_uid || !groupId || !date) return errorRes('Faltan datos para el registro NFC')

      const student = await prisma.student.findFirst({
         where: { nfc_uid, userId: TEACHER_ID }
      })
      if (!student) return errorRes('Esta tarjeta no está asignada a ningún alumno', 404)
      if (student.groupId !== groupId) return errorRes('El alumno no pertenece a este grupo', 400)

      const dateObj = new Date(date)
      
      // Transacción para reemplazar el registro NFC y asegurar unicidad de ese día
      await prisma.$transaction([
        prisma.attendance.deleteMany({
          where: { userId: TEACHER_ID, studentId: student.id, date: dateObj }
        }),
        prisma.attendance.create({
          data: {
            userId: TEACHER_ID,
            groupId,
            studentId: student.id,
            date: dateObj,
            status: 'presente',
            subject: '',
            notes: '',
            justification: ''
          }
        })
      ])

      return json({ 
        ok: true, 
        student_id: student.id, 
        student_name: `${student.first_name} ${student.last_name}` 
      })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Attendance POST Error:", error)
    return NextResponse.json({ error: "Error al guardar asistencia" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)

    // /api/attendance/[id]
    if (parts.length === 1 && parts[0] !== 'save' && parts[0] !== 'nfc' && parts[0] !== 'history') {
      const id = parts[0]
      const { status, justification, notes } = body
      
      const attendance = await prisma.attendance.findUnique({ where: { id } })
      if (!attendance || attendance.userId !== TEACHER_ID) {
         return errorRes('Registro no encontrado o no autorizado', 404)
      }
      
      const updateData = {}
      if (status !== undefined) updateData.status = status
      if (justification !== undefined) updateData.justification = justification
      if (notes !== undefined) updateData.notes = notes

      const updated = await prisma.attendance.update({
        where: { id },
        data: updateData
      })
      
      return json(updated)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Attendance PUT Error:", error)
    return NextResponse.json({ error: "Error al actualizar registro de asistencia" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []

    // /api/attendance/[id]
    if (parts.length === 1 && parts[0] !== 'save' && parts[0] !== 'nfc' && parts[0] !== 'history') {
      const id = parts[0]
      
      const attendance = await prisma.attendance.findUnique({ where: { id } })
      if (!attendance || attendance.userId !== TEACHER_ID) {
         return errorRes('Registro no encontrado o no autorizado', 404)
      }
      
      await prisma.attendance.delete({ where: { id } })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Attendance DELETE Error:", error)
    return NextResponse.json({ error: "Error al eliminar registro de asistencia" }, { status: 500 })
  }
}
