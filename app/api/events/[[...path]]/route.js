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

    // /api/events
    if (parts.length === 0) {
      const filter = { userId: TEACHER_EMAIL }
      if (search.from && search.to) {
         filter.date = { gte: search.from, lte: search.to }
      } else if (search.from) {
         filter.date = { gte: search.from }
      } else if (search.to) {
         filter.date = { lte: search.to }
      }

      const list = await prisma.event.findMany({
         where: filter,
         orderBy: { date: 'asc' }
      })
      // Map properties for UI backwards compatibility
      const uiList = list.map(e => ({
         ...e,
         start_date: e.date,
         end_date: e.date,
         event_type: e.type,
      }))

      return json(uiList)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Events GET Error:", error)
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

    // /api/events
    if (parts.length === 0) {
      const doc = await prisma.event.create({
         data: {
            userId: TEACHER_EMAIL,
            title: body.title || 'Evento',
            description: body.description || '',
            type: body.event_type || 'recordatorio',
            date: body.start_date, // Using simple string date
            color: body.color || '#3b82f6',
         }
      })
      
      const uiDoc = {
         ...doc,
         start_date: doc.date,
         end_date: doc.date,
         event_type: doc.type,
      }
      return json(uiDoc)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Events POST Error:", error)
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

    // /api/events/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const set = {}
      if (body.title !== undefined) set.title = body.title
      if (body.description !== undefined) set.description = body.description
      if (body.event_type !== undefined) set.type = body.event_type
      if (body.start_date !== undefined) set.date = body.start_date
      if (body.color !== undefined) set.color = body.color

      const doc = await prisma.event.updateMany({
         where: { id, userId: TEACHER_EMAIL },
         data: set
      })
      if (doc.count === 0) return errorRes('No autorizado', 403)
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Events PUT Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []

    // /api/events/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const doc = await prisma.event.deleteMany({
         where: { id, userId: TEACHER_EMAIL }
      })
      if (doc.count === 0) return errorRes('No autorizado o no existe', 403)
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma Events DELETE Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
