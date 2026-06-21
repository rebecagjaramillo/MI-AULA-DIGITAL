import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { StudentsClient } from './StudentsClient'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getStudentsData(paramGroupId) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  let resolvedGroupId = paramGroupId
  
  // Si no hay groupId en la URL, buscamos el primer grupo del profesor
  if (!resolvedGroupId) {
    const groups = await db.collection('class_groups').find({ teacher_id: TEACHER_ID }).sort({ created_at: 1 }).limit(1).toArray()
    if (groups.length > 0) {
      resolvedGroupId = groups[0].id
    }
  }

  const filter = { teacher_id: TEACHER_ID }
  if (resolvedGroupId) filter.group_id = resolvedGroupId

  const list = await db.collection('students').find(filter).sort({ student_number: 1, last_name: 1 }).toArray()
  
  return { 
    students: list.map(stripId), 
    resolvedGroupId 
  }
}

export default async function StudentsPage({ searchParams }) {
  const paramGroupId = searchParams?.groupId
  const data = await getStudentsData(paramGroupId)
  
  return <StudentsClient serverStudents={data.students} resolvedGroupId={data.resolvedGroupId} />
}
