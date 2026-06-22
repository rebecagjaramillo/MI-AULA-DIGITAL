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
    
    const TEACHER_ID = session.user.email
    const url = new URL(request.url)
    const search = Object.fromEntries(url.searchParams)
    
    // Filtro base
    const whereClause = { userId: TEACHER_ID }
    if (search.groupId) whereClause.groupId = search.groupId

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: [
        { student_number: 'asc' },
        { last_name: 'asc' }
      ],
      include: {
        group: true // Requerido: incluye la info del grupo
      }
    })
    
    // Adaptación para que el formato concuerde con lo esperado por el frontend
    const formattedStudents = students.map(s => ({
      ...s,
      created_at: s.created_at ? s.created_at.toISOString() : new Date().toISOString()
    }))

    return json(formattedStudents)
  } catch (error) {
    console.error("Prisma Student GET Error:", error)
    return NextResponse.json({ error: "Error al obtener estudiantes" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const TEACHER_ID = session.user.email
    const body = await request.json()
    
    if (!body.group_id) {
      return NextResponse.json({ error: "El ID del grupo (group_id) es obligatorio" }, { status: 400 })
    }

    // Prisma validará internamente que group_id sea un ObjectId válido para la relación
    // y que el grupo exista.
    const newStudent = await prisma.student.create({
      data: {
        userId: TEACHER_ID,
        groupId: body.group_id, // Prisma lo asignará al campo `group_id` en MongoDB y verificará la relación
        first_name: body.first_name || '',
        last_name: body.last_name || '',
        student_number: body.student_number ? Number(body.student_number) : null,
        guardian_name: body.guardian_name || '',
        guardian_contact: body.guardian_contact || '',
        notes: body.notes || '',
        active: body.active !== false,
        nfc_uid: body.nfc_uid || null,
        created_at: new Date()
      }
    })
    
    return json(newStudent)
  } catch (error) {
    console.error("Prisma Student POST Error:", error)
    
    // Error típico de Prisma cuando un ObjectId está mal formado o falla una restricción de foreign key
    if (error.code === 'P2023') {
       return NextResponse.json({ error: "El ID del grupo proporcionado no es válido." }, { status: 400 })
    }
    if (error.code === 'P2025') {
       return NextResponse.json({ error: "El grupo especificado no existe." }, { status: 400 })
    }

    return NextResponse.json({ error: "Error interno al crear el estudiante" }, { status: 500 })
  }
}
