import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    // El frontend original usaba session.user.email
    const TEACHER_ID = session.user.email

    // Prisma: findMany con include para traer estudiantes relacionados
    const groups = await prisma.group.findMany({
      where: { userId: TEACHER_ID },
      orderBy: { created_at: 'asc' },
      include: {
        students: true // Trae todos los estudiantes del grupo
      }
    })
    
    // Adaptamos la respuesta para el frontend:
    // El frontend viejo esperaba `student_count`. Prisma ya trae el array completo,
    // así que lo calculamos para mantener la compatibilidad.
    const augmented = groups.map((g) => {
      const student_count = g.students.filter(s => s.active !== false).length
      
      // Omitimos enviar el array completo de estudiantes para no saturar la respuesta,
      // a menos que el frontend lo necesite. Por ahora emulamos la respuesta original.
      const { students, ...rest } = g
      
      // Aseguramos que la fecha sea un string ISO (como antes)
      return { 
        ...rest, 
        student_count,
        // Prisma maneja las fechas nativamente, el frontend viejo esperaba strings:
        created_at: rest.created_at ? rest.created_at.toISOString() : new Date().toISOString()
      }
    })
    
    return json(augmented)
  } catch (error) {
    console.error("Prisma GET Error:", error)
    return NextResponse.json({ error: "Error al obtener los grupos" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const TEACHER_ID = session.user.email
    const body = await readBody(request)
    
    // Prisma valida los tipos estrictamente.
    const newGroup = await prisma.group.create({
      data: {
        userId: TEACHER_ID,
        level: body.level || 'Primaria',
        grade: body.grade || '',
        name: body.group_name || '', // En el schema Prisma pusimos @map("group_name")
        subject: body.subject || '',
        primary_subject_id: body.primary_subject_id || null,
        additional_subject_ids: Array.isArray(body.additional_subject_ids) ? body.additional_subject_ids : [],
        school_year: body.school_year || new Date().getFullYear() + '-' + (new Date().getFullYear()+1),
        color: body.color || '#3b82f6',
        notes: body.notes || '',
        archived: false,
        created_at: new Date()
      }
    })
    
    return json(newGroup)
  } catch (error) {
    console.error("Prisma POST Error:", error)
    return NextResponse.json({ error: "Error al crear el grupo" }, { status: 500 })
  }
}

