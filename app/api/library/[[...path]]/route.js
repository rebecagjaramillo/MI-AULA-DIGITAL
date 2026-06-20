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

    // /api/library
    if (parts.length === 0) {
      const col = db.collection('resource_library')
      const filter = { teacher_id: TEACHER_ID }
      if (search.subject) filter.subject = search.subject
      if (search.grade) filter.grade = search.grade
      const list = await col.find(filter).sort({ favorite: -1, created_at: -1 }).toArray()
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

    // /api/library
    if (parts.length === 0) {
      const col = db.collection('resource_library')
      const doc = {
        id: uuidv4(), teacher_id: TEACHER_ID,
        title: body.title || 'Recurso',
        url: body.url || '',
        description: body.description || '',
        subject: body.subject || '',
        grade: body.grade || '',
        resource_type: body.resource_type || 'pagina_web',
        tags: body.tags || '',
        notes: body.notes || '',
        favorite: !!body.favorite,
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

    // /api/library/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const col = db.collection('resource_library')
      const set = {}
      ;['title','url','description','subject','grade','resource_type','tags','notes','favorite'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
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

    // /api/library/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const col = db.collection('resource_library')
      await col.deleteOne({ id, teacher_id: TEACHER_ID })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
