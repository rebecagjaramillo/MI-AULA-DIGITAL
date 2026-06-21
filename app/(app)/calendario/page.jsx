import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { CalendarClient } from './CalendarClient'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getCalendarData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  const events = await db.collection('calendar_events')
    .find({ teacher_id: TEACHER_ID })
    .sort({ start_date: 1 })
    .toArray()
    
  const groups = await db.collection('class_groups')
    .find({ teacher_id: TEACHER_ID })
    .sort({ created_at: 1 })
    .toArray()
    
  return {
    events: events.map(stripId),
    groups: groups.map(stripId)
  }
}

export default async function CalendarPage() {
  const data = await getCalendarData()
  
  return <CalendarClient serverEvents={data.events} serverGroups={data.groups} />
}
