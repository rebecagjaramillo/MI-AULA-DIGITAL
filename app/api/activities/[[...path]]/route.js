import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"


// Default trimester ranges (MX SEP estándar): T1 Aug-Nov, T2 Dec-Mar, T3 Apr-Jul
const DEFAULT_TERM_DATES = {
  t1: { start_month: 8,  end_month: 11 }, // Ago-Nov
  t2: { start_month: 12, end_month: 3  }, // Dic-Mar
  t3: { start_month: 4,  end_month: 7  }, // Abr-Jul
}

function getTrimestreFromDate(dateStr, termDates) {
  if (!dateStr) return null
  const td = termDates || DEFAULT_TERM_DATES
  const m = new Date(dateStr).getMonth() + 1 // 1..12
  const inRange = (range) => {
    const { start_month: s, end_month: e } = range
    if (s <= e) return m >= s && m <= e
    return m >= s || m <= e // wraps year (e.g. Dec-Mar)
  }
  if (inRange(td.t1)) return 1
  if (inRange(td.t2)) return 2
  if (inRange(td.t3)) return 3
  return null
}

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

    // /api/activities
    if (parts.length === 0) {
      const col = db.collection('activities')
      const filter = { teacher_id: TEACHER_ID }
      if (search.groupId) filter.group_id = search.groupId
      if (search.subjectId) filter.subject_id = search.subjectId
      if (search.trimestre) filter.trimestre = Number(search.trimestre)
      if (search.from) filter.due_date = { ...(filter.due_date||{}), $gte: search.from }
      if (search.to)   filter.due_date = { ...(filter.due_date||{}), $lte: search.to }
      const list = await col.find(filter).sort({ due_date: -1, created_at: -1 }).toArray()
      
      const gradesCol = db.collection('activity_grades')
      const augmented = await Promise.all(list.map(async (a) => {
        const grades = await gradesCol.find({ activity_id: a.id }).toArray()
        const studentsCount = await db.collection('students').countDocuments({ teacher_id: TEACHER_ID, group_id: a.group_id, active: { $ne: false } })
        const graded = grades.filter(g => g.status === 'calificado' || (g.score !== null && g.score !== undefined && g.score !== '')).length
        return { ...stripId(a), graded_count: graded, students_count: studentsCount, pending: Math.max(0, studentsCount - graded) }
      }))
      return json(augmented)
    }

    // /api/activities/[id]/grades
    if (parts.length === 2 && parts[1] === 'grades') {
      const id = parts[0]
      const col = db.collection('activities')
      const activity = await col.findOne({ id, teacher_id: TEACHER_ID })
      if (!activity) return errorRes('Actividad no encontrada', 404)
      const students = await db.collection('students').find({ teacher_id: TEACHER_ID, group_id: activity.group_id, active: { $ne: false } }).sort({ student_number: 1, last_name: 1 }).toArray()
      const grades = await db.collection('activity_grades').find({ teacher_id: TEACHER_ID, activity_id: id }).toArray()
      const byStudent = {}
      grades.forEach(g => { byStudent[g.student_id] = stripId(g) })
      return json({ activity: stripId(activity), students: students.map(stripId), grades: byStudent })
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

    // /api/activities
    if (parts.length === 0) {
      const col = db.collection('activities')
      const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
      const due = body.due_date || new Date().toISOString().slice(0,10)
      const doc = {
        id: uuidv4(), teacher_id: TEACHER_ID,
        group_id: body.group_id,
        subject: body.subject || '',
        subject_id: body.subject_id || null,
        title: body.title || 'Actividad',
        description: body.description || '',
        activity_type: body.activity_type || 'tarea',
        due_date: due,
        trimestre: body.trimestre || getTrimestreFromDate(due, profile?.term_dates),
        max_score: body.max_score !== undefined ? Number(body.max_score) : 10,
        weight: body.weight !== undefined ? Number(body.weight) : 1,
        status: body.status || 'activa',
        created_at: new Date().toISOString(),
      }
      await col.insertOne(doc)
      return json(stripId(doc))
    }

    // /api/activities/[id]/grades
    if (parts.length === 2 && parts[1] === 'grades') {
      const id = parts[0]
      const records = body.records || []
      const gradesCol = db.collection('activity_grades')
      await gradesCol.deleteMany({ teacher_id: TEACHER_ID, activity_id: id })
      const docs = records.map(r => ({
        id: uuidv4(), teacher_id: TEACHER_ID, activity_id: id,
        student_id: r.student_id,
        score: (r.score === '' || r.score === null || r.score === undefined) ? null : Number(r.score),
        status: r.status || 'pendiente',
        feedback: r.feedback || '',
        created_at: new Date().toISOString(),
      }))
      if (docs.length) await gradesCol.insertMany(docs)
      return json({ ok: true, count: docs.length })
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

    // /api/activities/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const col = db.collection('activities')
      const set = {}
      ;['title','description','activity_type','due_date','max_score','weight','status','subject','subject_id','group_id','trimestre'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
      if (body.due_date && body.trimestre === undefined) {
        const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
        set.trimestre = getTrimestreFromDate(body.due_date, profile?.term_dates)
      }
      await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
      const a = await col.findOne({ id, teacher_id: TEACHER_ID })
      return json(stripId(a))
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

    // /api/activities/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const col = db.collection('activities')
      await col.deleteOne({ id, teacher_id: TEACHER_ID })
      await db.collection('activity_grades').deleteMany({ teacher_id: TEACHER_ID, activity_id: id })
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
