import { getDb } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

// Default trimester ranges (MX SEP estándar): T1 Aug-Nov, T2 Dec-Mar, T3 Apr-Jul
const DEFAULT_TERM_DATES = {
  t1: { start_month: 8,  end_month: 11 }, // Ago-Nov
  t2: { start_month: 12, end_month: 3  }, // Dic-Mar
  t3: { start_month: 4,  end_month: 7  }, // Abr-Jul
}

function getTrimestreFromDate(dateStr, termDates) {
  if (!dateStr) return null
  const td = termDates || DEFAULT_TERM_DATES
  let m
  if (typeof dateStr === 'string' && dateStr.length >= 10 && dateStr.includes('-')) {
    m = parseInt(dateStr.substring(5, 7), 10)
  } else {
    m = new Date(dateStr).getMonth() + 1
  }
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

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

export async function getActivities(TEACHER_ID, search = {}) {
  const db = await getDb()
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
  return augmented
}

export async function getActivityGrades(TEACHER_ID, id) {
  const db = await getDb()
  const col = db.collection('activities')
  const activity = await col.findOne({ id, teacher_id: TEACHER_ID })
  if (!activity) return null
  const students = await db.collection('students').find({ teacher_id: TEACHER_ID, group_id: activity.group_id, active: { $ne: false } }).sort({ student_number: 1, last_name: 1 }).toArray()
  const grades = await db.collection('activity_grades').find({ teacher_id: TEACHER_ID, activity_id: id }).toArray()
  const byStudent = {}
  grades.forEach(g => { byStudent[g.student_id] = stripId(g) })
  return { activity: stripId(activity), students: students.map(stripId), grades: byStudent }
}

export async function createActivity(TEACHER_ID, body) {
  const db = await getDb()
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
  return stripId(doc)
}

export async function saveActivityGrades(TEACHER_ID, id, records) {
  const db = await getDb()
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
  return docs.length
}

export async function updateActivity(TEACHER_ID, id, body) {
  const db = await getDb()
  const col = db.collection('activities')
  const set = {}
  ;['title','description','activity_type','due_date','max_score','weight','status','subject','subject_id','group_id','trimestre'].forEach(k => { if (body[k] !== undefined) set[k] = body[k] })
  if (body.due_date && body.trimestre === undefined) {
    const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
    set.trimestre = getTrimestreFromDate(body.due_date, profile?.term_dates)
  }
  await col.updateOne({ id, teacher_id: TEACHER_ID }, { $set: set })
  const a = await col.findOne({ id, teacher_id: TEACHER_ID })
  return a ? stripId(a) : null
}

export async function deleteActivity(TEACHER_ID, id) {
  const db = await getDb()
  const col = db.collection('activities')
  await col.deleteOne({ id, teacher_id: TEACHER_ID })
  await db.collection('activity_grades').deleteMany({ teacher_id: TEACHER_ID, activity_id: id })
  return true
}
