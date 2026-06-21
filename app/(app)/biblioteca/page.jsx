import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { LibraryClient } from './LibraryClient'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

async function getLibraryItems() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  const list = await db.collection('resource_library')
    .find({ teacher_id: TEACHER_ID })
    .sort({ favorite: -1, created_at: -1 })
    .toArray()
    
  return list.map(stripId)
}

export default async function LibraryPage() {
  const items = await getLibraryItems()
  
  return <LibraryClient serverItems={items} />
}
