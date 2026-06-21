import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { CurriculumClient } from './CurriculumClient'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getUnitsAndTopics() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  const unitsCol = db.collection('curriculum_units')
  const list = await unitsCol.find({ teacher_id: TEACHER_ID }).sort({ order_index: 1, created_at: 1 }).toArray()
  
  const topicsCol = db.collection('curriculum_topics')
  const unitsWithTopics = await Promise.all(list.map(async (u) => {
    const topics = await topicsCol.find({ teacher_id: TEACHER_ID, unit_id: u.id }).sort({ order_index: 1, created_at: 1 }).toArray()
    return { ...stripId(u), topics: topics.map(stripId) }
  }))
  
  return unitsWithTopics
}

export default async function CurriculumPage() {
  const units = await getUnitsAndTopics()
  
  return <CurriculumClient serverUnits={units} />
}
