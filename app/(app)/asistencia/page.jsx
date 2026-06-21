import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { AttendanceClient } from './AttendanceClient'
import { todayISO } from '@/lib/helpers'
import { v4 as uuidv4 } from 'uuid'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getAttendanceData(paramGroupId, paramDate) {
  const sessionAuth = await getServerSession(authOptions)
  if (!sessionAuth) redirect('/login')
  
  const TEACHER_ID = sessionAuth.user.email
  const db = await getDb()

  let resolvedGroupId = paramGroupId
  
  if (!resolvedGroupId) {
    const groups = await db.collection('class_groups').find({ teacher_id: TEACHER_ID }).sort({ created_at: 1 }).limit(1).toArray()
    if (groups.length > 0) {
      resolvedGroupId = groups[0].id
    }
  }

  const resolvedDate = paramDate || todayISO()

  if (!resolvedGroupId) {
    return { students: [], attendance: { session: null, records: [] }, resolvedGroupId: '', resolvedDate }
  }

  const students = await db.collection('students').find({ teacher_id: TEACHER_ID, group_id: resolvedGroupId }).sort({ student_number: 1, last_name: 1 }).toArray()
  
  const sessions = db.collection('attendance_sessions')
  const records = db.collection('attendance_records')
  
  let attSession = await sessions.findOne({ teacher_id: TEACHER_ID, group_id: resolvedGroupId, date: resolvedDate, subject: '' })
  if (!attSession) {
    attSession = { id: uuidv4(), teacher_id: TEACHER_ID, group_id: resolvedGroupId, subject: '', date: resolvedDate, notes: '', created_at: new Date().toISOString() }
  }
  
  const recs = await records.find({ teacher_id: TEACHER_ID, session_id: attSession.id }).toArray()

  return {
    students: students.map(stripId),
    attendance: { session: stripId(attSession), records: recs.map(stripId) },
    resolvedGroupId,
    resolvedDate
  }
}

export default async function AttendancePage({ searchParams }) {
  const paramGroupId = searchParams?.groupId
  const paramDate = searchParams?.date
  
  const data = await getAttendanceData(paramGroupId, paramDate)
  
  return (
    <AttendanceClient 
      serverStudents={data.students} 
      serverAttendance={data.attendance} 
      resolvedGroupId={data.resolvedGroupId} 
      resolvedDate={data.resolvedDate} 
    />
  )
}
