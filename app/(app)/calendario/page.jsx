import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { CalendarClient } from './CalendarClient'

async function getCalendarData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const events = await prisma.event.findMany({
     where: { userId: TEACHER_EMAIL },
     orderBy: { date: 'asc' }
  })
    
  const groups = await prisma.group.findMany({
     where: { userId: TEACHER_EMAIL },
     orderBy: { created_at: 'asc' }
  })
    
  return {
    events: events.map(e => ({ ...e, start_date: e.date, end_date: e.date, event_type: e.type })),
    groups: groups
  }
}

export default async function CalendarPage() {
  const data = await getCalendarData()
  
  return <CalendarClient serverEvents={data.events} serverGroups={data.groups} />
}
