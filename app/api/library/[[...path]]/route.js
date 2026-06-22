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

    // /api/library
    if (parts.length === 0) {
      const filter = { userId: TEACHER_EMAIL }
      if (search.subject) filter.subject = search.subject
      
      const list = await prisma.libraryResource.findMany({
         where: filter,
         orderBy: { created_at: 'desc' }
      })
      // Our simple model doesn't have grade, favorite, etc. Keep it simple
      return json(list)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Library GET Error:", error)
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

    // /api/library
    if (parts.length === 0) {
      const doc = await prisma.libraryResource.create({
         data: {
            userId: TEACHER_EMAIL,
            title: body.title || 'Recurso',
            url: body.url || '',
            description: body.description || '',
            subject: body.subject || '',
            type: body.resource_type || 'pagina_web',
         }
      })
      return json(doc)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Library POST Error:", error)
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

    // /api/library/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const set = {}
      if (body.title !== undefined) set.title = body.title
      if (body.url !== undefined) set.url = body.url
      if (body.description !== undefined) set.description = body.description
      if (body.subject !== undefined) set.subject = body.subject
      if (body.resource_type !== undefined) set.type = body.resource_type

      const doc = await prisma.libraryResource.updateMany({
         where: { id, userId: TEACHER_EMAIL },
         data: set
      })
      if (doc.count === 0) return errorRes('No autorizado', 403)
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Library PUT Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []

    // /api/library/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const doc = await prisma.libraryResource.deleteMany({
         where: { id, userId: TEACHER_EMAIL }
      })
      if (doc.count === 0) return errorRes('No autorizado', 403)
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Library DELETE Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
