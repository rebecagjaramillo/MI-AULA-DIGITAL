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

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const { id } = params
    const g = await prisma.group.findUnique({ where: { id } })
    if (!g || g.userId !== TEACHER_EMAIL) return NextResponse.json({ error: 'Grupo no encontrado o no autorizado' }, { status: 404 })
    return json(g)
  } catch (error) {
    console.error("Prisma Group ID GET Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const { id } = params
    const body = await readBody(request)
    
    const set = {}
    ;['level','grade','subject','primary_subject_id','additional_subject_ids','school_year','color','notes','archived'].forEach(k => { 
      if (body[k] !== undefined) set[k] = body[k] 
    })
    if (body.group_name !== undefined) set.name = body.group_name
    
    const doc = await prisma.group.updateMany({
       where: { id, userId: TEACHER_EMAIL },
       data: set
    })
    if (doc.count === 0) return NextResponse.json({ error: 'No autorizado o no existe' }, { status: 403 })

    const g = await prisma.group.findUnique({ where: { id } })
    return json(g)
  } catch (error) {
    console.error("Prisma Group ID PUT Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const { id } = params
    
    const doc = await prisma.group.deleteMany({
       where: { id, userId: TEACHER_EMAIL }
    })
    if (doc.count === 0) return NextResponse.json({ error: 'No autorizado o no existe' }, { status: 403 })
    
    // Students and other relations are automatically cascade deleted by Prisma
    return json({ ok: true })
  } catch (error) {
    console.error("Prisma Group ID DELETE Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
