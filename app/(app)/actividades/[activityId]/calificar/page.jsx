import { getActivityGrades } from '@/lib/services/activityService'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { GradeClient } from './GradeClient'

export default async function GradingPage({ params }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const activityId = params.activityId

  // Obtenemos todos los datos (actividad, alumnos y calificaciones) desde el servidor
  const data = await getActivityGrades(TEACHER_ID, activityId)

  // Si la actividad no existe o no pertenece al profesor
  if (!data) {
    redirect('/actividades')
  }

  return (
    <GradeClient 
      activity={data.activity} 
      students={data.students} 
      serverGrades={data.grades} 
    />
  )
}
