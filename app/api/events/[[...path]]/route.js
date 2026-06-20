import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"


function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

function errorRes(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
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
    const db = await getDb()

    // /api/events
    if (parts.length === 0) {
      const col = db.collection('calendar_events')
      const filter = { teacher_id: TEACHER_ID }
      if (search.from) filter.start_date = { ...(filter.start_date || {}), $gte: search.from }
      if (search.to)   filter.start_date = { ...(filter.start_date || {}), $lte: search.to }
      const list = await col.find(filter).sort({ start_date: 1 }).toArray()
      return json(list.map(stripId))
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const db = await getDb()
    const body = await readBody(request)

    // /api/events
    if (parts.length === 0) {
      const col = db.collection('calendar_events')
      const doc = {
        id: uuidv4(), teacher_id: TEACHER_ID,
        group_id: body.group_id || null,
        title: body.title || 'Evento',
        description: body.description || '',
        event_type: body.event_type || 'recordatorio',
        start_date: body.start_date,
        end_date: body.end_date || body.start_date,
        color: body.color || '#3b82f6',
        created_at: new Date().toISOString(),
      }
      await col.insertOne(doc)
      return json(stripId(doc))
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const db = await getDb()
    const body = await readBody(request)

    // /api/events/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const col = db.collection('calendar_events')
      const set = {}
      ;['title','description','event_type','start_date','end_date','color','group_id'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
      await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const db = await getDb()

    // /api/events/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const col = db.collection('calendar_events')
      await col.deleteOne({ id, teacher_id: TEACHER_ID })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
