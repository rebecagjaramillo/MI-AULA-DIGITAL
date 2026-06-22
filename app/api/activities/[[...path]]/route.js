import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { activitySchema, activityGradesSchema } from '@/lib/schemas/activitySchema'

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

    // /api/activities
    if (parts.length === 0) {
      const whereClause = { userId: TEACHER_ID }
      if (search.groupId) whereClause.groupId = search.groupId

      const activities = await prisma.activity.findMany({
        where: whereClause,
        orderBy: { due_date: 'desc' },
        include: {
          group: true,
          grades: true // Incluye entregas/calificaciones
        }
      })
      
      // Formatear fechas para compatibilidad con el frontend antiguo
      const formatted = activities.map(a => ({
        ...a,
        due_date: a.due_date ? a.due_date.toISOString() : null,
        created_at: a.created_at ? a.created_at.toISOString() : null
      }))
      
      return json(formatted)
    }

    // /api/activities/[id]/grades
    if (parts.length === 2 && parts[1] === 'grades') {
      const id = parts[0]
      const activity = await prisma.activity.findUnique({
        where: { id },
        include: {
          grades: true
        }
      })
      
      if (!activity || activity.userId !== TEACHER_ID) {
        return errorRes('Actividad no encontrada', 404)
      }
      
      return json({
        activity_id: activity.id,
        records: activity.grades.map(g => ({
           student_id: g.studentId,
           score: g.score,
           status: g.status,
           feedback: g.feedback
        }))
      })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Activity GET Error:", error)
    return NextResponse.json({ error: "Error al obtener actividades" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)

    // /api/activities
    if (parts.length === 0) {
      const validation = activitySchema.safeParse(body)
      if (!validation.success) {
        return errorRes(validation.error.format(), 400)
      }
      
      const { group_id, title, description, activity_type, due_date, trimestre, max_score, weight, status } = body
      
      // Validar existencia de grupo antes de crear (como se solicitó)
      if (!group_id) return errorRes('El ID del grupo es obligatorio', 400)
      
      try {
        const groupExists = await prisma.group.findUnique({ where: { id: group_id } })
        if (!groupExists || groupExists.userId !== TEACHER_ID) {
          return errorRes('El grupo especificado no existe o no tienes permisos', 400)
        }

        const newActivity = await prisma.activity.create({
          data: {
            userId: TEACHER_ID,
            groupId: group_id,
            title,
            description: description || null,
            activity_type: activity_type || null,
            due_date: due_date ? new Date(due_date) : null,
            trimestre: trimestre ? Number(trimestre) : null,
            max_score: max_score ? Number(max_score) : null,
            weight: weight ? Number(weight) : null,
            status: status || 'active',
            created_at: new Date()
          }
        })
        
        return json(newActivity)
      } catch (err) {
        if (err.code === 'P2023') return errorRes('ID de grupo inválido', 400)
        throw err
      }
    }

    // /api/activities/[id]/grades
    if (parts.length === 2 && parts[1] === 'grades') {
      const id = parts[0]
      const validation = activityGradesSchema.safeParse(body)
      if (!validation.success) {
        return errorRes(validation.error.format(), 400)
      }
      
      // Verificar actividad y ownership
      const activity = await prisma.activity.findUnique({ where: { id } })
      if (!activity || activity.userId !== TEACHER_ID) {
         return errorRes('Actividad no encontrada o sin permisos', 404)
      }
      
      const records = body.records || []
      let count = 0
      
      for (const rec of records) {
        // Upsert manual buscando primero
        const existing = await prisma.activityGrade.findFirst({
           where: { activityId: id, studentId: rec.student_id, userId: TEACHER_ID }
        })
        
        if (existing) {
           await prisma.activityGrade.update({
             where: { id: existing.id },
             data: {
               score: rec.score !== undefined ? Number(rec.score) : null,
               status: rec.status || 'pendiente',
               feedback: rec.feedback || ''
             }
           })
        } else {
           await prisma.activityGrade.create({
             data: {
               userId: TEACHER_ID,
               activityId: id,
               studentId: rec.student_id,
               score: rec.score !== undefined ? Number(rec.score) : null,
               status: rec.status || 'pendiente',
               feedback: rec.feedback || ''
             }
           })
        }
        count++
      }
      
      return json({ ok: true, count })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Activity POST Error:", error)
    return NextResponse.json({ error: "Error al procesar petición" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)

    // /api/activities/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const validation = activitySchema.safeParse(body)
      if (!validation.success) {
        return errorRes(validation.error.format(), 400)
      }
      
      const activity = await prisma.activity.findUnique({ where: { id } })
      if (!activity || activity.userId !== TEACHER_ID) {
         return errorRes('Actividad no encontrada o no autorizada', 404)
      }
      
      const updateData = {}
      if (body.title !== undefined) updateData.title = body.title
      if (body.description !== undefined) updateData.description = body.description
      if (body.activity_type !== undefined) updateData.activity_type = body.activity_type
      if (body.due_date !== undefined) updateData.due_date = body.due_date ? new Date(body.due_date) : null
      if (body.trimestre !== undefined) updateData.trimestre = body.trimestre ? Number(body.trimestre) : null
      if (body.max_score !== undefined) updateData.max_score = body.max_score ? Number(body.max_score) : null
      if (body.weight !== undefined) updateData.weight = body.weight ? Number(body.weight) : null
      if (body.status !== undefined) updateData.status = body.status
      if (body.group_id !== undefined) updateData.groupId = body.group_id

      const updated = await prisma.activity.update({
        where: { id },
        data: updateData
      })
      
      return json(updated)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Activity PUT Error:", error)
    return NextResponse.json({ error: "Error al actualizar actividad" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []

    // /api/activities/[id]
    if (parts.length === 1) {
      const id = parts[0]
      
      const activity = await prisma.activity.findUnique({ where: { id } })
      if (!activity || activity.userId !== TEACHER_ID) {
         return errorRes('Actividad no encontrada o no autorizada', 404)
      }
      
      await prisma.activity.delete({ where: { id } })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Activity DELETE Error:", error)
    return NextResponse.json({ error: "Error al eliminar actividad" }, { status: 500 })
  }
}
