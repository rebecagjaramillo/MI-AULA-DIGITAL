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
    const db = await getDb()
    
    // /api/students/[id]/stats
    if (parts.length === 2 && parts[1] === 'stats') {
      const id = parts[0]
      const recs = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, student_id: id }).toArray()
      const total = recs.length
      const presente = recs.filter(r => r.status === 'presente').length
      const falta = recs.filter(r => r.status === 'falta').length
      const retardo = recs.filter(r => r.status === 'retardo').length
      const justificado = recs.filter(r => r.status === 'justificado').length
      const pct = total ? Math.round((presente + justificado + retardo*0.5) / total * 100) : 100
      return json({ total, presente, falta, retardo, justificado, attendance_pct: pct })
    }
    
    // /api/students/[id]/detail
    if (parts.length === 2 && parts[1] === 'detail') {
      const id = parts[0]
      const student = await db.collection('students').findOne({ id, teacher_id: TEACHER_ID })
      if (!student) return errorRes('No encontrado', 404)
      
      const group = await db.collection('class_groups').findOne({ id: student.group_id, teacher_id: TEACHER_ID })
      const recs = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, student_id: id }).sort({ date: -1 }).toArray()
      const total = recs.length
      const presente = recs.filter(r => r.status === 'presente').length
      const falta = recs.filter(r => r.status === 'falta').length
      const retardo = recs.filter(r => r.status === 'retardo').length
      const justificado = recs.filter(r => r.status === 'justificado').length
      const att_pct = total ? Math.round((presente + justificado + retardo*0.5) / total * 100) : null

      const activities = await db.collection('activities').find({ teacher_id: TEACHER_ID, group_id: student.group_id }).sort({ due_date: -1 }).toArray()
      const grades = await db.collection('activity_grades').find({ teacher_id: TEACHER_ID, student_id: id }).toArray()
      const gradeRows = activities.map(a => {
        const g = grades.find(gg => gg.activity_id === a.id)
        return { activity_id: a.id, title: a.title, type: a.activity_type, due_date: a.due_date, max_score: a.max_score, score: g?.score ?? null, status: g?.status || 'pendiente', feedback: g?.feedback || '' }
      })
      const scored = gradeRows.filter(r => r.score !== null && r.score !== undefined)
      const avg = scored.length ? (scored.reduce((s,r) => s + (Number(r.score)/Number(r.max_score))*10, 0) / scored.length).toFixed(1) : null
      const activities_done = scored.length
      const activities_pending = Math.max(0, activities.length - activities_done)

      const points = await db.collection('student_points').find({ teacher_id: TEACHER_ID, student_id: id }).sort({ date: -1 }).toArray()
      const points_positive = points.filter(p => p.points > 0).reduce((s,p) => s + p.points, 0)
      const points_negative = points.filter(p => p.points < 0).reduce((s,p) => s + p.points, 0)

      const observations = await db.collection('student_observations').find({ teacher_id: TEACHER_ID, student_id: id }).sort({ created_at: -1 }).toArray()

      return json({
        student: stripId(student),
        group: stripId(group),
        stats: { total, presente, falta, retardo, justificado, attendance_pct: att_pct, activities_done, activities_pending, average: avg, points_positive, points_negative, points_total: points_positive + points_negative },
        attendance_records: recs.map(stripId),
        grades: gradeRows,
        points: points.map(stripId),
        observations: observations.map(stripId),
      })
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
    
    // /api/students/bulk
    if (parts.length === 1 && parts[0] === 'bulk') {
      const col = db.collection('students')
      const names = (body.names || '').split('\n').map(s => s.trim()).filter(Boolean)
      const docs = names.map((name, i) => {
        const nameParts = name.split(' ')
        const first = nameParts[0] || ''
        const last = nameParts.slice(1).join(' ') || ''
        return {
          id: uuidv4(), teacher_id: TEACHER_ID, group_id: body.group_id,
          first_name: first, last_name: last,
          student_number: (body.start_number || 1) + i,
          guardian_name: '', guardian_contact: '', notes: '', active: true,
          created_at: new Date().toISOString(),
        }
      })
      if (docs.length) await col.insertMany(docs)
      return json({ inserted: docs.length, students: docs })
    }

    // /api/students/[id]/points
    if (parts.length === 2 && parts[1] === 'points') {
      const id = parts[0]
      const doc = {
        id: uuidv4(), teacher_id: TEACHER_ID, student_id: id,
        category: body.category || 'Otro',
        points: Number(body.points || 0),
        note: body.note || '',
        date: body.date || new Date().toISOString().slice(0,10),
        created_at: new Date().toISOString(),
      }
      await db.collection('student_points').insertOne(doc)
      return json(stripId(doc))
    }

    // /api/students/[id]/observations
    if (parts.length === 2 && parts[1] === 'observations') {
      const id = parts[0]
      const doc = {
        id: uuidv4(), teacher_id: TEACHER_ID, student_id: id,
        text: body.text || '',
        type: body.type || 'general',
        created_at: new Date().toISOString(),
      }
      await db.collection('student_observations').insertOne(doc)
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
    
    // /api/students/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const col = db.collection('students')
      const set = {}
      ;['first_name','last_name','student_number','guardian_name','guardian_contact','notes','active','group_id','nfc_uid'].forEach(k => { 
        if (body[k] !== undefined) set[k] = body[k] 
      })
      await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
      const s = await col.findOne({ id, teacher_id: TEACHER_ID })
      return json(stripId(s))
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
    
    // /api/students/[id]
    if (parts.length === 1) {
      const id = parts[0]
      await db.collection('students').deleteOne({ id, teacher_id: TEACHER_ID })
      return json({ ok: true })
    }

    // /api/students/[id]/points/[pointId]
    if (parts.length === 3 && parts[1] === 'points') {
      const id = parts[0]
      const pointId = parts[2]
      await db.collection('student_points').deleteOne({ id: pointId, teacher_id: TEACHER_ID, student_id: id })
      return json({ ok: true })
    }

    // /api/students/[id]/observations/[obsId]
    if (parts.length === 3 && parts[1] === 'observations') {
      const id = parts[0]
      const obsId = parts[2]
      await db.collection('student_observations').deleteOne({ id: obsId, teacher_id: TEACHER_ID, student_id: id })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
