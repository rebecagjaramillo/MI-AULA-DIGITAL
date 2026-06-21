import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { PlansClient } from './PlansClient'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getLessonPlans() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  const list = await db.collection('lesson_plans')
    .find({ teacher_id: TEACHER_ID })
    .sort({ date: -1, created_at: -1 })
    .toArray()
    
  return list.map(stripId)
}

export default async function PlansPage() {
  const plans = await getLessonPlans()
  
  return <PlansClient serverPlans={plans} />
}
