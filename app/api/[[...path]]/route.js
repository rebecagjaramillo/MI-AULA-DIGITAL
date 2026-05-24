import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

const TEACHER_ID = 'default-teacher'

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

// ============ ROUTER ============
async function handle(request, { params }) {
  const path = (params?.path || []).join('/')
  const method = request.method
  const url = new URL(request.url)
  const search = Object.fromEntries(url.searchParams)

  try {
    const db = await getDb()

    // Health
    if (path === '' || path === '/') {
      return json({ message: 'MI AULA DIGITAL API is running', version: '1.0.0' })
    }

    // ---------- RESET ----------
    if (path === 'reset' && method === 'POST') {
      const collections = ['profiles','subjects','class_groups','students','attendance_sessions','attendance_records','activities','activity_grades','student_points','student_observations','curriculum_units','curriculum_topics','lesson_plans','calendar_events','resource_library','classroom_screens','alerts','generated_documents','pdf_templates','group_subjects']
      for (const c of collections) {
        await db.collection(c).deleteMany({ teacher_id: TEACHER_ID })
      }
      return json({ ok: true, message: 'Datos borrados' })
    }

    // ---------- PROFILE ----------
    if (path === 'profile') {
      const col = db.collection('profiles')
      if (method === 'GET') {
        const p = await col.findOne({ teacher_id: TEACHER_ID })
        return json(stripId(p) || null)
      }
      if (method === 'POST' || method === 'PUT') {
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
      }
    }

    // ---------- SUBJECTS ----------
    if (path === 'subjects') {
      const col = db.collection('subjects')
      if (method === 'GET') {
        const list = await col.find({ teacher_id: TEACHER_ID }).sort({ created_at: 1 }).toArray()
        return json(list.map(stripId))
      }
      if (method === 'POST') {
        const body = await readBody(request)
        const doc = { id: uuidv4(), teacher_id: TEACHER_ID, name: body.name, color: body.color || '#3b82f6', created_at: new Date().toISOString() }
        await col.insertOne(doc)
        return json(stripId(doc))
      }
    }
    if (path.startsWith('subjects/')) {
      const id = path.split('/')[1]
      const col = db.collection('subjects')
      if (method === 'PUT') {
        const body = await readBody(request)
        await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: { name: body.name, color: body.color } })
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        await col.deleteOne({ id, teacher_id: TEACHER_ID })
        return json({ ok: true })
      }
    }

    // ---------- GROUPS ----------
    if (path === 'groups') {
      const col = db.collection('class_groups')
      if (method === 'GET') {
        const list = await col.find({ teacher_id: TEACHER_ID }).sort({ created_at: 1 }).toArray()
        // Augment with student count
        const studentsCol = db.collection('students')
        const augmented = await Promise.all(list.map(async (g) => {
          const count = await studentsCol.countDocuments({ teacher_id: TEACHER_ID, group_id: g.id, active: { $ne: false } })
          return { ...stripId(g), student_count: count }
        }))
        return json(augmented)
      }
      if (method === 'POST') {
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
      }
    }
    if (path.startsWith('groups/')) {
      const parts = path.split('/')
      const id = parts[1]
      const col = db.collection('class_groups')
      if (parts.length === 2 && method === 'PUT') {
        const body = await readBody(request)
        const set = {}
        ;['level','grade','group_name','subject','primary_subject_id','additional_subject_ids','school_year','color','notes','archived'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
        await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
        const g = await col.findOne({ id, teacher_id: TEACHER_ID })
        return json(stripId(g))
      }
      if (parts.length === 2 && method === 'DELETE') {
        await col.deleteOne({ id, teacher_id: TEACHER_ID })
        await db.collection('students').deleteMany({ teacher_id: TEACHER_ID, group_id: id })
        return json({ ok: true })
      }
      if (parts.length === 2 && method === 'GET') {
        const g = await col.findOne({ id, teacher_id: TEACHER_ID })
        return json(stripId(g))
      }
    }

    // ---------- STUDENTS ----------
    if (path === 'students') {
      const col = db.collection('students')
      if (method === 'GET') {
        const filter = { teacher_id: TEACHER_ID }
        if (search.groupId) filter.group_id = search.groupId
        const list = await col.find(filter).sort({ student_number: 1, last_name: 1 }).toArray()
        return json(list.map(stripId))
      }
      if (method === 'POST') {
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
      }
    }
    if (path === 'students/bulk' && method === 'POST') {
      const body = await readBody(request)
      const col = db.collection('students')
      const names = (body.names || '').split('\n').map(s => s.trim()).filter(Boolean)
      const docs = names.map((name, i) => {
        const parts = name.split(' ')
        const first = parts[0] || ''
        const last = parts.slice(1).join(' ') || ''
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
    if (path.startsWith('students/')) {
      const parts = path.split('/')
      const id = parts[1]
      const col = db.collection('students')
      if (parts.length === 2 && method === 'PUT') {
        const body = await readBody(request)
        const set = {}
        ;['first_name','last_name','student_number','guardian_name','guardian_contact','notes','active','group_id','nfc_uid'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
        await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
        const s = await col.findOne({ id, teacher_id: TEACHER_ID })
        return json(stripId(s))
      }
      if (parts.length === 2 && method === 'DELETE') {
        await col.deleteOne({ id, teacher_id: TEACHER_ID })
        return json({ ok: true })
      }
      if (parts.length === 3 && parts[2] === 'stats' && method === 'GET') {
        // Stats for student card: attendance %, faltas, retardos
        const recs = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, student_id: id }).toArray()
        const total = recs.length
        const presente = recs.filter(r => r.status === 'presente').length
        const falta = recs.filter(r => r.status === 'falta').length
        const retardo = recs.filter(r => r.status === 'retardo').length
        const justificado = recs.filter(r => r.status === 'justificado').length
        const pct = total ? Math.round((presente + justificado + retardo*0.5) / total * 100) : 100
        return json({ total, presente, falta, retardo, justificado, attendance_pct: pct })
      }
      if (parts.length === 3 && parts[2] === 'detail' && method === 'GET') {
        const student = await col.findOne({ id, teacher_id: TEACHER_ID })
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
      if (parts.length === 3 && parts[2] === 'points' && method === 'POST') {
        const body = await readBody(request)
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
      if (parts.length === 4 && parts[2] === 'points' && method === 'DELETE') {
        await db.collection('student_points').deleteOne({ id: parts[3], teacher_id: TEACHER_ID, student_id: id })
        return json({ ok: true })
      }
      if (parts.length === 3 && parts[2] === 'observations' && method === 'POST') {
        const body = await readBody(request)
        const doc = {
          id: uuidv4(), teacher_id: TEACHER_ID, student_id: id,
          text: body.text || '',
          type: body.type || 'general',
          created_at: new Date().toISOString(),
        }
        await db.collection('student_observations').insertOne(doc)
        return json(stripId(doc))
      }
      if (parts.length === 4 && parts[2] === 'observations' && method === 'DELETE') {
        await db.collection('student_observations').deleteOne({ id: parts[3], teacher_id: TEACHER_ID, student_id: id })
        return json({ ok: true })
      }
    }

    // ---------- ATTENDANCE ----------
    // GET /attendance?groupId=&date=  -> returns { session, records: [{student_id,status}] }
    if (path === 'attendance' && method === 'GET') {
      const { groupId, date, subject } = search
      if (!groupId || !date) return errorRes('groupId and date required')
      const sessions = db.collection('attendance_sessions')
      const records = db.collection('attendance_records')
      let session = await sessions.findOne({ teacher_id: TEACHER_ID, group_id: groupId, date, subject: subject || '' })
      if (!session) {
        session = { id: uuidv4(), teacher_id: TEACHER_ID, group_id: groupId, subject: subject || '', date, notes: '', created_at: new Date().toISOString() }
        // Don't insert yet, only on save
      }
      const recs = await records.find({ teacher_id: TEACHER_ID, session_id: session.id }).toArray()
      return json({ session: stripId(session), records: recs.map(stripId) })
    }
    // POST /attendance/save  body: { groupId, date, subject, records: [{student_id, status, justification?}], notes }
    if (path === 'attendance/save' && method === 'POST') {
      const body = await readBody(request)
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
      // Replace records
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
    // GET /attendance/history?groupId=&days=30  -> list of sessions with summary
    if (path === 'attendance/history' && method === 'GET') {
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

    // POST /attendance/nfc  body: { nfc_uid, groupId, date }
    if (path === 'attendance/nfc' && method === 'POST') {
      const body = await readBody(request)
      const { nfc_uid, groupId, date } = body
      
      if (!nfc_uid || !groupId || !date) return errorRes('Faltan datos para el registro NFC')

      // 1. Buscar al alumno por el UID de su tarjeta NFC
      const student = await db.collection('students').findOne({ nfc_uid: nfc_uid, teacher_id: TEACHER_ID })
      if (!student) return errorRes('Esta tarjeta no está asignada a ningún alumno', 404)
      
      // Validar que el alumno pertenezca al grupo seleccionado
      if (student.group_id !== groupId) return errorRes('El alumno no pertenece a este grupo', 400)

      // 2. Buscar o crear la sesión de asistencia del día
      const sessions = db.collection('attendance_sessions')
      const records = db.collection('attendance_records')
      let session = await sessions.findOne({ teacher_id: TEACHER_ID, group_id: groupId, date: date })
      
      if (!session) {
        session = { id: uuidv4(), teacher_id: TEACHER_ID, group_id: groupId, subject: '', date: date, notes: '', created_at: new Date().toISOString() }
        await sessions.insertOne(session)
      }

      // 3. Registrar o actualizar la asistencia a "presente"
      const recordDoc = {
        id: uuidv4(), teacher_id: TEACHER_ID, session_id: session.id,
        group_id: groupId, student_id: student.id,
        status: 'presente',
        justification: '',
        date: date,
        created_at: new Date().toISOString(),
      }

      // Borramos un posible registro previo y lo insertamos como presente
      await records.deleteOne({ teacher_id: TEACHER_ID, session_id: session.id, student_id: student.id })
      await records.insertOne(recordDoc)

      return json({ 
        ok: true, 
        student_id: student.id, 
        student_name: `${student.first_name} ${student.last_name}` 
      })
    }

    // ---------- ACTIVITIES ----------
    if (path === 'activities') {
      const col = db.collection('activities')
      if (method === 'GET') {
        const filter = { teacher_id: TEACHER_ID }
        if (search.groupId) filter.group_id = search.groupId
        if (search.subjectId) filter.subject_id = search.subjectId
        if (search.trimestre) filter.trimestre = Number(search.trimestre)
        if (search.from) filter.due_date = { ...(filter.due_date||{}), $gte: search.from }
        if (search.to)   filter.due_date = { ...(filter.due_date||{}), $lte: search.to }
        const list = await col.find(filter).sort({ due_date: -1, created_at: -1 }).toArray()
        // Add quick stats (graded count)
        const gradesCol = db.collection('activity_grades')
        const augmented = await Promise.all(list.map(async (a) => {
          const grades = await gradesCol.find({ activity_id: a.id }).toArray()
          const studentsCount = await db.collection('students').countDocuments({ teacher_id: TEACHER_ID, group_id: a.group_id, active: { $ne: false } })
          const graded = grades.filter(g => g.status === 'calificado' || (g.score !== null && g.score !== undefined && g.score !== '')).length
          return { ...stripId(a), graded_count: graded, students_count: studentsCount, pending: Math.max(0, studentsCount - graded) }
        }))
        return json(augmented)
      }
      if (method === 'POST') {
        const body = await readBody(request)
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
    }
    if (path.startsWith('activities/')) {
      const parts = path.split('/')
      const id = parts[1]
      const col = db.collection('activities')
      if (parts.length === 2 && method === 'PUT') {
        const body = await readBody(request)
        const set = {}
        ;['title','description','activity_type','due_date','max_score','weight','status','subject','subject_id','group_id','trimestre'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
        // Recalc trimestre if due_date changed but trimestre not provided
        if (body.due_date && body.trimestre === undefined) {
          const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
          set.trimestre = getTrimestreFromDate(body.due_date, profile?.term_dates)
        }
        await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
        const a = await col.findOne({ id, teacher_id: TEACHER_ID })
        return json(stripId(a))
      }
      if (parts.length === 2 && method === 'DELETE') {
        await col.deleteOne({ id, teacher_id: TEACHER_ID })
        await db.collection('activity_grades').deleteMany({ teacher_id: TEACHER_ID, activity_id: id })
        return json({ ok: true })
      }
      if (parts.length === 3 && parts[2] === 'grades' && method === 'GET') {
        const activity = await col.findOne({ id, teacher_id: TEACHER_ID })
        if (!activity) return errorRes('Actividad no encontrada', 404)
        const students = await db.collection('students').find({ teacher_id: TEACHER_ID, group_id: activity.group_id, active: { $ne: false } }).sort({ student_number: 1, last_name: 1 }).toArray()
        const grades = await db.collection('activity_grades').find({ teacher_id: TEACHER_ID, activity_id: id }).toArray()
        const byStudent = {}
        grades.forEach(g => { byStudent[g.student_id] = stripId(g) })
        return json({ activity: stripId(activity), students: students.map(stripId), grades: byStudent })
      }
      if (parts.length === 3 && parts[2] === 'grades' && method === 'POST') {
        const body = await readBody(request)
        const records = body.records || []
        const gradesCol = db.collection('activity_grades')
        // Replace grades for this activity
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
    }

    // ---------- REPORTS ----------
    // GET /reports/group?groupId=&from=&to=
    if (path === 'reports/group' && method === 'GET') {
      const { groupId, from, to } = search
      if (!groupId) return errorRes('groupId required')
      const fromDate = from || '1900-01-01'
      const toDate = to || '2999-12-31'
      const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
      const group = await db.collection('class_groups').findOne({ id: groupId, teacher_id: TEACHER_ID })
      const students = await db.collection('students').find({ teacher_id: TEACHER_ID, group_id: groupId, active: { $ne: false } }).sort({ student_number: 1, last_name: 1 }).toArray()
      const attRecords = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, group_id: groupId, date: { $gte: fromDate, $lte: toDate } }).toArray()
      const activities = await db.collection('activities').find({ teacher_id: TEACHER_ID, group_id: groupId, due_date: { $gte: fromDate, $lte: toDate } }).toArray()
      const grades = await db.collection('activity_grades').find({ teacher_id: TEACHER_ID, activity_id: { $in: activities.map(a => a.id) } }).toArray()

      const enriched = students.map(s => {
        const recs = attRecords.filter(r => r.student_id === s.id)
        const total = recs.length
        const presente = recs.filter(r => r.status === 'presente').length
        const falta = recs.filter(r => r.status === 'falta').length
        const retardo = recs.filter(r => r.status === 'retardo').length
        const justificado = recs.filter(r => r.status === 'justificado').length
        const att_pct = total ? Math.round(((presente + justificado + retardo*0.5) / total) * 100) : null
        const sGrades = grades.filter(g => g.student_id === s.id && g.score !== null && g.score !== undefined)
        const totalScore = sGrades.reduce((sum, g) => {
          const act = activities.find(a => a.id === g.activity_id)
          return sum + (act ? (Number(g.score) / Number(act.max_score)) * 10 : 0)
        }, 0)
        const avg = sGrades.length ? (totalScore / sGrades.length).toFixed(1) : null
        const activities_done = sGrades.length
        const activities_pending = Math.max(0, activities.length - activities_done)
        return { ...stripId(s), total_sessions: total, presente, falta, retardo, justificado, attendance_pct: att_pct, average: avg, activities_done, activities_pending }
      })

      return json({
        profile: stripId(profile),
        group: stripId(group),
        from: fromDate, to: toDate,
        students: enriched,
        activities: activities.map(stripId),
        summary: {
          total_students: students.length,
          total_sessions: new Set(attRecords.map(r => r.date)).size,
          total_activities: activities.length,
          avg_attendance: enriched.filter(e => e.attendance_pct !== null).reduce((a,b) => a+b.attendance_pct, 0) / Math.max(1, enriched.filter(e => e.attendance_pct !== null).length) || 0,
        }
      })
    }
    // GET /reports/student?studentId=&from=&to=
    if (path === 'reports/student' && method === 'GET') {
      const { studentId, from, to } = search
      if (!studentId) return errorRes('studentId required')
      const fromDate = from || '1900-01-01'
      const toDate = to || '2999-12-31'
      const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
      const student = await db.collection('students').findOne({ id: studentId, teacher_id: TEACHER_ID })
      if (!student) return errorRes('Alumno no encontrado', 404)
      const group = await db.collection('class_groups').findOne({ id: student.group_id, teacher_id: TEACHER_ID })
      const attRecords = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, student_id: studentId, date: { $gte: fromDate, $lte: toDate } }).sort({ date: -1 }).toArray()
      const activities = await db.collection('activities').find({ teacher_id: TEACHER_ID, group_id: student.group_id, due_date: { $gte: fromDate, $lte: toDate } }).toArray()
      const grades = await db.collection('activity_grades').find({ teacher_id: TEACHER_ID, student_id: studentId, activity_id: { $in: activities.map(a => a.id) } }).toArray()

      const total = attRecords.length
      const presente = attRecords.filter(r => r.status === 'presente').length
      const falta = attRecords.filter(r => r.status === 'falta').length
      const retardo = attRecords.filter(r => r.status === 'retardo').length
      const justificado = attRecords.filter(r => r.status === 'justificado').length
      const att_pct = total ? Math.round(((presente + justificado + retardo*0.5) / total) * 100) : null

      const gradeRows = activities.map(a => {
        const g = grades.find(gg => gg.activity_id === a.id)
        return {
          activity_id: a.id, title: a.title, type: a.activity_type, due_date: a.due_date, max_score: a.max_score,
          score: g?.score ?? null, status: g?.status || 'pendiente', feedback: g?.feedback || ''
        }
      })
      const scored = gradeRows.filter(r => r.score !== null && r.score !== undefined)
      const avg = scored.length ? (scored.reduce((s,r) => s + (Number(r.score)/Number(r.max_score))*10, 0) / scored.length).toFixed(1) : null

      return json({
        profile: stripId(profile),
        student: stripId(student),
        group: stripId(group),
        from: fromDate, to: toDate,
        attendance: { total, presente, falta, retardo, justificado, attendance_pct: att_pct, records: attRecords.map(stripId) },
        grades: gradeRows,
        average: avg,
      })
    }

    // ---------- LIBRARY (Resource links) ----------
    if (path === 'library') {
      const col = db.collection('resource_library')
      if (method === 'GET') {
        const filter = { teacher_id: TEACHER_ID }
        if (search.subject) filter.subject = search.subject
        if (search.grade) filter.grade = search.grade
        const list = await col.find(filter).sort({ favorite: -1, created_at: -1 }).toArray()
        return json(list.map(stripId))
      }
      if (method === 'POST') {
        const body = await readBody(request)
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
    }
    if (path.startsWith('library/')) {
      const id = path.split('/')[1]
      const col = db.collection('resource_library')
      if (method === 'PUT') {
        const body = await readBody(request)
        const set = {}
        ;['title','url','description','subject','grade','resource_type','tags','notes','favorite'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
        await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        await col.deleteOne({ id, teacher_id: TEACHER_ID })
        return json({ ok: true })
      }
    }

    // ---------- CALENDAR EVENTS ----------
    if (path === 'events') {
      const col = db.collection('calendar_events')
      if (method === 'GET') {
        const filter = { teacher_id: TEACHER_ID }
        if (search.from) filter.start_date = { ...(filter.start_date || {}), $gte: search.from }
        if (search.to)   filter.start_date = { ...(filter.start_date || {}), $lte: search.to }
        const list = await col.find(filter).sort({ start_date: 1 }).toArray()
        return json(list.map(stripId))
      }
      if (method === 'POST') {
        const body = await readBody(request)
        const doc = {
          id: uuidv4(), teacher_id: TEACHER_ID,
          group_id: body.group_id || null,
          title: body.title || 'Evento',
          description: body.description || '',
          event_type: body.event_type || 'recordatorio',
          start_date: body.start_date,
          end_date: body.end_date || body.start_date,
          color: body.color || '#3b82f6',
          created_at: new Date().toISOString(),
        }
        await col.insertOne(doc)
        return json(stripId(doc))
      }
    }
    if (path.startsWith('events/')) {
      const id = path.split('/')[1]
      const col = db.collection('calendar_events')
      if (method === 'PUT') {
        const body = await readBody(request)
        const set = {}
        ;['title','description','event_type','start_date','end_date','color','group_id'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
        await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        await col.deleteOne({ id, teacher_id: TEACHER_ID })
        return json({ ok: true })
      }
    }

    // ---------- CURRICULUM (Temarios) ----------
    // Units list
    if (path === 'curriculum/units') {
      const col = db.collection('curriculum_units')
      if (method === 'GET') {
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
      if (method === 'POST') {
        const body = await readBody(request)
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
    }
    if (path.startsWith('curriculum/units/')) {
      const id = path.split('/')[2]
      const col = db.collection('curriculum_units')
      if (method === 'PUT') {
        const body = await readBody(request)
        const set = {}
        ;['title','description','subject','grade','order_index'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
        await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        await col.deleteOne({ id, teacher_id: TEACHER_ID })
        await db.collection('curriculum_topics').deleteMany({ teacher_id: TEACHER_ID, unit_id: id })
        return json({ ok: true })
      }
    }
    if (path === 'curriculum/topics') {
      if (method === 'POST') {
        const body = await readBody(request)
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
    }
    if (path.startsWith('curriculum/topics/')) {
      const id = path.split('/')[2]
      const col = db.collection('curriculum_topics')
      if (method === 'PUT') {
        const body = await readBody(request)
        const set = {}
        ;['title','learning_goal','status','planned_date','completed_date','order_index'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
        if (body.status === 'visto' && !body.completed_date) set.completed_date = new Date().toISOString().slice(0,10)
        await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        await col.deleteOne({ id, teacher_id: TEACHER_ID })
        return json({ ok: true })
      }
    }

// ---------- LESSON PLANS ----------
    if (path === 'lesson-plans') {
      const col = db.collection('lesson_plans')
      if (method === 'GET') {
        const filter = { teacher_id: TEACHER_ID }
        if (search.groupId) filter.group_id = search.groupId
        const list = await col.find(filter).sort({ date: -1, created_at: -1 }).toArray()
        return json(list.map(stripId))
      }
      if (method === 'POST') {
        const body = await readBody(request)
        const doc = {
          id: uuidv4(),
          teacher_id: TEACHER_ID,
          group_id: body.group_id || null,
          subject: body.subject || '',
          grade: body.grade || '',
          topic: body.topic || '',
          title: body.title || (body.topic || 'Planeación'),
          date: body.date || new Date().toISOString().slice(0, 10),
          duration_minutes: body.duration_minutes || 50,
          objective: body.objective || '',
          learning_goal: body.learning_goal || '',
          start_activity: body.start_activity || '',
          development_activity: body.development_activity || '',
          closing_activity: body.closing_activity || '',
          materials: body.materials || '',
          evaluation: body.evaluation || '',
          accommodations: body.accommodations || '',
          observations: body.observations || '',
          status: body.status || 'borrador',
          created_at: new Date().toISOString(),
        }
        await col.insertOne(doc)
        return json(stripId(doc))
      }
    }

if (path === 'lesson-plans/generate-ai' && method === 'POST') {
      const body = await readBody(request)
      const { subject, grade, topic } = body
      
      const webhookUrl = process.env.N8N_WEBHOOK_URL
      if (!webhookUrl) return errorRes('Por favor, configura N8N_WEBHOOK_URL en tu archivo .env', 500)

      try {
        // 1. ¡MAGIA! Buscamos el temario específico de este maestro, materia y grado
        const unitsCol = db.collection('curriculum_units')
        const topicsCol = db.collection('curriculum_topics')
        
        const units = await unitsCol.find({ teacher_id: TEACHER_ID, subject: subject, grade: grade }).sort({ order_index: 1 }).toArray()
        
        let temario_del_curso = "Temario no disponible. Basa la clase en conocimientos generales de la materia."
        
        if (units.length > 0) {
          temario_del_curso = ""
          for (const u of units) {
            temario_del_curso += `Unidad: ${u.title}\n`
            const topics = await topicsCol.find({ teacher_id: TEACHER_ID, unit_id: u.id }).sort({ order_index: 1 }).toArray()
            topics.forEach(t => {
              temario_del_curso += `  - Tema: ${t.title} (Objetivo: ${t.learning_goal})\n`
            })
          }
        }

        // 2. Empaquetamos todo (datos del formulario + el temario completo)
        const payloadParaIA = {
          ...body,
          temario_del_curso: temario_del_curso
        }

        // 3. Lo enviamos a tu n8n / Webhook
        const webhookResp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadParaIA) 
        })
        
        if (!webhookResp.ok) {
          const txt = await webhookResp.text()
          return errorRes('Error en tu Webhook/n8n: ' + txt, 500)
        }
        
        const data = await webhookResp.json()
        return json({ generated: data })
      } catch (e) {
        return errorRes('Error conectando con el Webhook: ' + e.message, 500)
      }
    }
    
    // ---------- DASHBOARD ----------
    if (path === 'dashboard' && method === 'GET') {
      const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
      const groups = await db.collection('class_groups').find({ teacher_id: TEACHER_ID, archived: { $ne: true } }).toArray()
      const students = await db.collection('students').find({ teacher_id: TEACHER_ID, active: { $ne: false } }).toArray()
      const today = new Date().toISOString().slice(0,10)
      const todaySessions = await db.collection('attendance_sessions').find({ teacher_id: TEACHER_ID, date: today }).toArray()
      // Alerts: students with many faltas (>= 2) in last 30 days
      const since = new Date(); since.setDate(since.getDate() - 30)
      const sinceStr = since.toISOString().slice(0,10)
      const recentRecords = await db.collection('attendance_records').find({ teacher_id: TEACHER_ID, date: { $gte: sinceStr } }).toArray()
      const byStudent = {}
      recentRecords.forEach(r => {
        if (!byStudent[r.student_id]) byStudent[r.student_id] = { falta: 0, retardo: 0, total: 0 }
        byStudent[r.student_id].total++
        if (r.status === 'falta') byStudent[r.student_id].falta++
        if (r.status === 'retardo') byStudent[r.student_id].retardo++
      })
      const alerts = []
      Object.entries(byStudent).forEach(([sid, c]) => {
        const stu = students.find(s => s.id === sid)
        if (!stu) return
        if (c.falta >= 3) alerts.push({ type: 'faltas', priority: 'high', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.group_id, description: `${c.falta} faltas en los últimos 30 días`, suggested_action: 'Generar reporte individual / contactar tutor' })
        else if (c.falta >= 2) alerts.push({ type: 'faltas', priority: 'medium', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.group_id, description: `${c.falta} faltas recientes`, suggested_action: 'Hablar con el alumno' })
        if (c.retardo >= 3) alerts.push({ type: 'retardos', priority: 'medium', student_id: sid, student_name: `${stu.first_name} ${stu.last_name}`, group_id: stu.group_id, description: `${c.retardo} retardos recientes`, suggested_action: 'Hablar con el alumno' })
      })
      // Recent attendance summary
      const last7 = new Date(); last7.setDate(last7.getDate() - 7)
      const last7Str = last7.toISOString().slice(0,10)
      const lastRecords = recentRecords.filter(r => r.date >= last7Str)
      const attendancePct = lastRecords.length
        ? Math.round(lastRecords.filter(r => ['presente','justificado'].includes(r.status) || r.status === 'retardo').length / lastRecords.length * 100)
        : null
      // Activities pending grading
      const activities = await db.collection('activities').find({ teacher_id: TEACHER_ID }).toArray()
      const gradesCol = db.collection('activity_grades')
      let pendingGrading = 0
      let upcomingActivities = []
      for (const a of activities) {
        const grades = await gradesCol.find({ activity_id: a.id }).toArray()
        const groupStudents = students.filter(s => s.group_id === a.group_id).length
        const gradedCount = grades.filter(g => g.score !== null && g.score !== undefined).length
        if (gradedCount < groupStudents) pendingGrading += (groupStudents - gradedCount)
        if (a.due_date >= today) upcomingActivities.push({ ...stripId(a), pending: Math.max(0, groupStudents - gradedCount) })
      }
      upcomingActivities = upcomingActivities.sort((x,y) => x.due_date.localeCompare(y.due_date)).slice(0, 5)

      return json({
        profile: stripId(profile) || null,
        groups_count: groups.length,
        students_count: students.length,
        today_sessions_count: todaySessions.length,
        today,
        groups: groups.map(stripId),
        alerts,
        attendance_pct_last7: attendancePct,
        recent_records_count: lastRecords.length,
        pending_grading: pendingGrading,
        upcoming_activities: upcomingActivities,
      })
    }

    return errorRes('Not found: ' + path, 404)
  } catch (e) {
    console.error('API Error:', e)
    return errorRes(e.message || 'Server error', 500)
  }
}

export async function GET(request, ctx) { return handle(request, ctx) }
export async function POST(request, ctx) { return handle(request, ctx) }
export async function PUT(request, ctx) { return handle(request, ctx) }
export async function DELETE(request, ctx) { return handle(request, ctx) }
export async function PATCH(request, ctx) { return handle(request, ctx) }
