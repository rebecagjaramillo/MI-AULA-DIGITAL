import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getProfileData() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  const profile = await db.collection('profiles').findOne({ teacher_id: TEACHER_ID })
    
  return profile ? stripId(profile) : {}
}

export default async function SettingsPage() {
  const profile = await getProfileData()
  
  return <SettingsClient serverProfile={profile} />
}
