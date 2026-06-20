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

    // /api/curriculum/units
    if (parts.length === 1 && parts[0] === 'units') {
      const col = db.collection('curriculum_units')
      const filter = { teacher_id: TEACHER_ID }
      if (search.subject) filter.subject = search.subject
      if (search.grade) filter.grade = search.grade
      const list = await col.find(filter).sort({ order_index: 1, created_at: 1 }).toArray()
      
      // Topics
      const topicsCol = db.collection('curriculum_topics')
      const unitsWithTopics = await Promise.all(list.map(async (u) => {
        const topics = await topicsCol.find({ teacher_id: TEACHER_ID, unit_id: u.id }).sort({ order_index: 1, created_at: 1 }).toArray()
        return { ...stripId(u), topics: topics.map(stripId) }
      }))
      return json(unitsWithTopics)
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

    // /api/curriculum/units
    if (parts.length === 1 && parts[0] === 'units') {
      const doc = {
        id: uuidv4(), teacher_id: TEACHER_ID,
        subject: body.subject || '',
        grade: body.grade || '',
        title: body.title || 'Unidad',
        description: body.description || '',
        order_index: body.order_index || 0,
        created_at: new Date().toISOString(),
      }
      await db.collection('curriculum_units').insertOne(doc)
      return json(stripId(doc))
    }

    // /api/curriculum/topics
    if (parts.length === 1 && parts[0] === 'topics') {
      const doc = {
        id: uuidv4(), teacher_id: TEACHER_ID,
        unit_id: body.unit_id,
        title: body.title || 'Tema',
        learning_goal: body.learning_goal || '',
        status: body.status || 'no_iniciado',
        planned_date: body.planned_date || null,
        completed_date: body.completed_date || null,
        order_index: body.order_index || 0,
        created_at: new Date().toISOString(),
      }
      await db.collection('curriculum_topics').insertOne(doc)
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

    // /api/curriculum/units/[id]
    if (parts.length === 2 && parts[0] === 'units') {
      const id = parts[1]
      const col = db.collection('curriculum_units')
      const set = {}
      ;['title','description','subject','grade','order_index'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
      await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
      return json({ ok: true })
    }

    // /api/curriculum/topics/[id]
    if (parts.length === 2 && parts[0] === 'topics') {
      const id = parts[1]
      const col = db.collection('curriculum_topics')
      const set = {}
      ;['title','learning_goal','status','planned_date','completed_date','order_index'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
      if (body.status === 'visto' && !body.completed_date) set.completed_date = new Date().toISOString().slice(0,10)
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

    // /api/curriculum/units/[id]
    if (parts.length === 2 && parts[0] === 'units') {
      const id = parts[1]
      await db.collection('curriculum_units').deleteOne({ id, teacher_id: TEACHER_ID })
      await db.collection('curriculum_topics').deleteMany({ teacher_id: TEACHER_ID, unit_id: id })
      return json({ ok: true })
    }

    // /api/curriculum/topics/[id]
    if (parts.length === 2 && parts[0] === 'topics') {
      const id = parts[1]
      await db.collection('curriculum_topics').deleteOne({ id, teacher_id: TEACHER_ID })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
