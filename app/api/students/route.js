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

    const url = new URL(request.url)
    const search = Object.fromEntries(url.searchParams)
    const db = await getDb()
    const col = db.collection('students')
    
    const filter = { teacher_id: TEACHER_ID }
    if (search.groupId) filter.group_id = search.groupId
    
    const list = await col.find(filter).sort({ student_number: 1, last_name: 1 }).toArray()
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
    const col = db.collection('students')
    const body = await readBody(request)
    
    const doc = {
      id: uuidv4(), teacher_id: TEACHER_ID,
      group_id: body.group_id,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      student_number: body.student_number || null,
      guardian_name: body.guardian_name || '',
      guardian_contact: body.guardian_contact || '',
      notes: body.notes || '',
      active: body.active !== false,
      nfc_uid: body.nfc_uid || null,
      created_at: new Date().toISOString(),
    }
    
    await col.insertOne(doc)
    return json(stripId(doc))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
