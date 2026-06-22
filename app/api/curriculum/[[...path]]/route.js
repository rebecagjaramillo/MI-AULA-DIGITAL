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
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    const url = new URL(request.url)
    const search = Object.fromEntries(url.searchParams)
    
    // /api/curriculum/units
    if (parts.length === 1 && parts[0] === 'units') {
      const filter = { userId: TEACHER_EMAIL }
      if (search.subject) filter.subject = search.subject
      if (search.grade) filter.grade = search.grade
      
      const unitsWithTopics = await prisma.curriculumUnit.findMany({
         where: filter,
         orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
         include: {
            topics: {
               orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }]
            }
         }
      })
      
      return json(unitsWithTopics)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Curriculum GET Error:", error)
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

    // /api/curriculum/units
    if (parts.length === 1 && parts[0] === 'units') {
      const doc = await prisma.curriculumUnit.create({
         data: {
            userId: TEACHER_EMAIL,
            subject: body.subject || '',
            grade: body.grade || '',
            title: body.title || 'Unidad',
            description: body.description || '',
            order_index: body.order_index || 0,
         }
      })
      return json(doc)
    }

    // /api/curriculum/topics
    if (parts.length === 1 && parts[0] === 'topics') {
      const doc = await prisma.curriculumTopic.create({
         data: {
            userId: TEACHER_EMAIL,
            unitId: body.unit_id,
            title: body.title || 'Tema',
            learning_goal: body.learning_goal || '',
            status: body.status || 'no_iniciado',
            planned_date: body.planned_date || null,
            completed_date: body.completed_date || null,
            order_index: body.order_index || 0,
         }
      })
      return json(doc)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Curriculum POST Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)

    // /api/curriculum/units/[id]
    if (parts.length === 2 && parts[0] === 'units') {
      const id = parts[1]
      const set = {}
      ;['title','description','subject','grade','order_index'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
      
      const doc = await prisma.curriculumUnit.updateMany({
         where: { id, userId: TEACHER_EMAIL },
         data: set
      })
      if (doc.count === 0) return errorRes('No autorizado', 403)
      return json({ ok: true })
    }

    // /api/curriculum/topics/[id]
    if (parts.length === 2 && parts[0] === 'topics') {
      const id = parts[1]
      const set = {}
      ;['title','learning_goal','status','planned_date','completed_date','order_index'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
      if (body.status === 'visto' && !body.completed_date) set.completed_date = new Date().toISOString().slice(0,10)
      
      const doc = await prisma.curriculumTopic.updateMany({
         where: { id, userId: TEACHER_EMAIL },
         data: set
      })
      if (doc.count === 0) return errorRes('No autorizado', 403)
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Curriculum PUT Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []

    // /api/curriculum/units/[id]
    if (parts.length === 2 && parts[0] === 'units') {
      const id = parts[1]
      const doc = await prisma.curriculumUnit.deleteMany({
         where: { id, userId: TEACHER_EMAIL }
      })
      if (doc.count === 0) return errorRes('No autorizado o no existe', 403)
      // Prisma onCascade deleting unit will delete its topics automatically
      return json({ ok: true })
    }

    // /api/curriculum/topics/[id]
    if (parts.length === 2 && parts[0] === 'topics') {
      const id = parts[1]
      const doc = await prisma.curriculumTopic.deleteMany({
         where: { id, userId: TEACHER_EMAIL }
      })
      if (doc.count === 0) return errorRes('No autorizado', 403)
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Curriculum DELETE Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
