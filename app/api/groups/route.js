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
    const col = db.collection('class_groups')
    const list = await col.find({ teacher_id: TEACHER_ID }).sort({ created_at: 1 }).toArray()
    
    // Augment with student count
    const studentsCol = db.collection('students')
    const augmented = await Promise.all(list.map(async (g) => {
      const count = await studentsCol.countDocuments({ teacher_id: TEACHER_ID, group_id: g.id, active: { $ne: false } })
      return { ...stripId(g), student_count: count }
    }))
    
    return json(augmented)
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
    const col = db.collection('class_groups')
    const body = await readBody(request)
    const doc = {
      id: uuidv4(), teacher_id: TEACHER_ID,
      level: body.level || 'Primaria',
      grade: body.grade || '',
      group_name: body.group_name || '',
      subject: body.subject || '',
      primary_subject_id: body.primary_subject_id || null,
      additional_subject_ids: Array.isArray(body.additional_subject_ids) ? body.additional_subject_ids : [],
      school_year: body.school_year || new Date().getFullYear() + '-' + (new Date().getFullYear()+1),
      color: body.color || '#3b82f6',
      notes: body.notes || '',
      archived: false,
      created_at: new Date().toISOString(),
    }
    await col.insertOne(doc)
    return json(stripId(doc))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
