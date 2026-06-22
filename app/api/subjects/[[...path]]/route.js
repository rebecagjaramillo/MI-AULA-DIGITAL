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
    const TEACHER_EMAIL = session.user.email

    const list = await prisma.subject.findMany({
       where: { userId: TEACHER_EMAIL }
    })
    return json(list)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const body = await readBody(request)
    
    const doc = await prisma.subject.create({
       data: {
          userId: TEACHER_EMAIL,
          name: body.name || 'Sin Nombre',
          color: body.color || '#3b82f6',
          level: body.level || 'Primaria',
       }
    })
    return json(doc)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const { path } = params
    const id = path?.[0]
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const body = await readBody(request)
    
    const doc = await prisma.subject.updateMany({
       where: { id: id, userId: TEACHER_EMAIL },
       data: {
          name: body.name,
          color: body.color,
          level: body.level,
       }
    })
    
    if (doc.count === 0) return NextResponse.json({ error: 'Subject not found or not authorized' }, { status: 404 })

    const updated = await prisma.subject.findUnique({ where: { id: id } })
    return json(updated)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const { path } = params
    const id = path?.[0]
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const doc = await prisma.subject.deleteMany({
       where: { id: id, userId: TEACHER_EMAIL }
    })
    
    if (doc.count === 0) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    return json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
