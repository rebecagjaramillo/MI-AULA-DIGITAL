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

    // /api/attendance
    if (parts.length === 0) {
      const { groupId, date, subject } = search
      if (!groupId || !date) return errorRes('groupId and date required')
      const sessions = db.collection('attendance_sessions')
      const records = db.collection('attendance_records')
      let session = await sessions.findOne({ teacher_id: TEACHER_ID, group_id: groupId, date, subject: subject || '' })
      if (!session) {
        session = { id: uuidv4(), teacher_id: TEACHER_ID, group_id: groupId, subject: subject || '', date, notes: '', created_at: new Date().toISOString() }
      }
      const recs = await records.find({ teacher_id: TEACHER_ID, session_id: session.id }).toArray()
      return json({ session: stripId(session), records: recs.map(stripId) })
    }

    // /api/attendance/history
    if (parts.length === 1 && parts[0] === 'history') {
      const { groupId, days = 30 } = search
      const sessionsCol = db.collection('attendance_sessions')
      const recordsCol = db.collection('attendance_records')
      const filter = { teacher_id: TEACHER_ID }
      if (groupId) filter.group_id = groupId
      const sessions = await sessionsCol.find(filter).sort({ date: -1 }).limit(Number(days)).toArray()
      const summaries = await Promise.all(sessions.map(async (s) => {
        const recs = await recordsCol.find({ session_id: s.id }).toArray()
        const counts = { presente: 0, falta: 0, retardo: 0, justificado: 0 }
        recs.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })
        return { ...stripId(s), total: recs.length, ...counts }
      }))
      return json(summaries)
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

    // /api/attendance/save
    if (parts.length === 1 && parts[0] === 'save') {
      const { groupId, date, subject = '', records: rs = [], notes = '' } = body
      if (!groupId || !date) return errorRes('groupId and date required')
      const sessions = db.collection('attendance_sessions')
      const records = db.collection('attendance_records')
      let session = await sessions.findOne({ teacher_id: TEACHER_ID, group_id: groupId, date, subject })
      if (!session) {
        session = { id: uuidv4(), teacher_id: TEACHER_ID, group_id: groupId, subject, date, notes, created_at: new Date().toISOString() }
        await sessions.insertOne(session)
      } else {
        await sessions.updateOne({ id: session.id }, { $set: { notes } })
      }
      
      await records.deleteMany({ teacher_id: TEACHER_ID, session_id: session.id })
      const docs = rs.map(r => ({
        id: uuidv4(), teacher_id: TEACHER_ID, session_id: session.id,
        group_id: groupId, student_id: r.student_id,
        status: r.status || 'presente',
        justification: r.justification || '',
        date,
        created_at: new Date().toISOString(),
      }))
      if (docs.length) await records.insertMany(docs)
      return json({ ok: true, session_id: session.id, count: docs.length })
    }

    // /api/attendance/nfc
    if (parts.length === 1 && parts[0] === 'nfc') {
      const { nfc_uid, groupId, date } = body
      if (!nfc_uid || !groupId || !date) return errorRes('Faltan datos para el registro NFC')

      const student = await db.collection('students').findOne({ nfc_uid: nfc_uid, teacher_id: TEACHER_ID })
      if (!student) return errorRes('Esta tarjeta no está asignada a ningún alumno', 404)
      if (student.group_id !== groupId) return errorRes('El alumno no pertenece a este grupo', 400)

      const sessions = db.collection('attendance_sessions')
      const records = db.collection('attendance_records')
      let session = await sessions.findOne({ teacher_id: TEACHER_ID, group_id: groupId, date: date })
      
      if (!session) {
        session = { id: uuidv4(), teacher_id: TEACHER_ID, group_id: groupId, subject: '', date: date, notes: '', created_at: new Date().toISOString() }
        await sessions.insertOne(session)
      }

      const recordDoc = {
        id: uuidv4(), teacher_id: TEACHER_ID, session_id: session.id,
        group_id: groupId, student_id: student.id,
        status: 'presente',
        justification: '',
        date: date,
        created_at: new Date().toISOString(),
      }

      await records.deleteOne({ teacher_id: TEACHER_ID, session_id: session.id, student_id: student.id })
      await records.insertOne(recordDoc)

      return json({ 
        ok: true, 
        student_id: student.id, 
        student_name: `${student.first_name} ${student.last_name}` 
      })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
