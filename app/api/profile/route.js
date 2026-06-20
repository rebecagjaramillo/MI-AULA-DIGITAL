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
    const col = db.collection('profiles')
    const p = await col.findOne({ teacher_id: TEACHER_ID })
    return json(stripId(p) || null)
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
    const col = db.collection('profiles')
    const body = await readBody(request)
    const now = new Date().toISOString()
    const existing = await col.findOne({ teacher_id: TEACHER_ID })
    
    if (existing) {
      await col.updateOne({ teacher_id: TEACHER_ID }, { $set: { ...body, updated_at: now } })
    } else {
      await col.insertOne({ id: uuidv4(), teacher_id: TEACHER_ID, ...body, created_at: now, updated_at: now })
    }
    
    const p = await col.findOne({ teacher_id: TEACHER_ID })
    return json(stripId(p))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

  return POST(request) // The monolithic API handles POST and PUT identically for profile
}
