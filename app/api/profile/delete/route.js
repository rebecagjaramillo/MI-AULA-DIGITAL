import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const db = await getDb()

    const collections = [
      'profiles',
      'groups',
      'students',
      'student_points',
      'student_observations',
      'activities',
      'activity_grades',
      'attendance_sessions',
      'attendance_records',
      'curriculum_units',
      'curriculum_topics',
      'lesson_plans',
      'events',
      'library',
      'subjects'
    ]

    for (const colName of collections) {
      await db.collection(colName).deleteMany({ teacher_id: TEACHER_ID })
    }

    return NextResponse.json({ success: true, message: 'All user data wiped' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
