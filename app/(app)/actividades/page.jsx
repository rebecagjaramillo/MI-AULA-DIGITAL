import { getActivities } from '@/lib/services/activityService'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { ActivitiesClient } from './ActivitiesClient'

export default async function ActivitiesPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email

  // Obtenemos las actividades desde el backend.
  // Si searchParams.groupId viene en la URL, se filtrarán nativamente en MongoDB.
  // Si no, cargará todas y el Client Component aplicará el filtro por la materia activa.
  const activities = await getActivities(TEACHER_ID, searchParams || {})

  return <ActivitiesClient serverActivities={activities} />
}
