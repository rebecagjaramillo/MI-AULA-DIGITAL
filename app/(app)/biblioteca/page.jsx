import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import { LibraryClient } from './LibraryClient'

async function getLibraryItems() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_EMAIL = session.user.email

  const list = await prisma.libraryResource.findMany({
     where: { userId: TEACHER_EMAIL },
     orderBy: { created_at: 'desc' } // Note: 'favorite' field not supported by new simple schema
  })
    
  return list
}

export default async function LibraryPage() {
  const items = await getLibraryItems()
  
  return <LibraryClient serverItems={items} />
}
