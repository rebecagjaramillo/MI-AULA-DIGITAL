import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { GroupsClient } from './GroupsClient'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getGroupsData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  const col = db.collection('class_groups')
  const list = await col.find({ teacher_id: TEACHER_ID }).sort({ created_at: 1 }).toArray()
  
  // Augment with student count
  const studentsCol = db.collection('students')
  const augmented = await Promise.all(list.map(async (g) => {
    const count = await studentsCol.countDocuments({ teacher_id: TEACHER_ID, group_id: g.id, active: { $ne: false } })
    return { ...stripId(g), student_count: count }
  }))
  
  return augmented
}

export default async function GroupsPage() {
  const data = await getGroupsData()
  return <GroupsClient serverGroups={data} />
}
