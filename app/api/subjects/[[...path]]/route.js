import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const db = await getDb()
    const col = db.collection('subjects')
    const list = await col.find({ teacher_id: TEACHER_ID }).toArray()
    return json(list.map(stripId))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const db = await getDb()
    const col = db.collection('subjects')
    const body = await readBody(request)
    const now = new Date().toISOString()
    const doc = { id: uuidv4(), teacher_id: TEACHER_ID, ...body, created_at: now, updated_at: now }
    await col.insertOne(doc)
    return json(stripId(doc))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const { path } = params
    const id = path?.[0]
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const db = await getDb()
    const col = db.collection('subjects')
    const body = await readBody(request)
    const now = new Date().toISOString()
    await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: { ...body, updated_at: now } })
    const doc = await col.findOne({ id, teacher_id: TEACHER_ID })
    return json(stripId(doc))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const { path } = params
    const id = path?.[0]
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const db = await getDb()
    const col = db.collection('subjects')
    await col.deleteOne({ id, teacher_id: TEACHER_ID })
    return json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
