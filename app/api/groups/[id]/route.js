import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

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

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const { id } = params
    const db = await getDb()
    const col = db.collection('class_groups')
    const g = await col.findOne({ id, teacher_id: TEACHER_ID })
    if (!g) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
    return json(stripId(g))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const { id } = params
    const db = await getDb()
    const col = db.collection('class_groups')
    const body = await readBody(request)
    
    const set = {}
    ;['level','grade','group_name','subject','primary_subject_id','additional_subject_ids','school_year','color','notes','archived'].forEach(k => { 
      if (body[k] !== undefined) set[k] = body[k] 
    })
    
    await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
    const g = await col.findOne({ id, teacher_id: TEACHER_ID })
    return json(stripId(g))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const { id } = params
    const db = await getDb()
    const col = db.collection('class_groups')
    await col.deleteOne({ id, teacher_id: TEACHER_ID })
    await db.collection('students').deleteMany({ teacher_id: TEACHER_ID, group_id: id })
    return json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
