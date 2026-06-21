import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { ReportsClient } from './ReportsClient'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getReportsInitialData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  const groups = await db.collection('class_groups')
    .find({ teacher_id: TEACHER_ID })
    .sort({ created_at: 1 })
    .toArray()
    
  const students = await db.collection('students')
    .find({ teacher_id: TEACHER_ID, active: { $ne: false } })
    .sort({ student_number: 1, last_name: 1 })
    .toArray()
  
  return {
    groups: groups.map(stripId),
    students: students.map(stripId)
  }
}

export default async function ReportsPage() {
  const data = await getReportsInitialData()
  
  return (
    <ReportsClient 
      serverGroups={data.groups} 
      serverStudents={data.students} 
    />
  )
}
