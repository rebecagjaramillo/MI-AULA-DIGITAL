import { getDb } from '@/lib/mongodb'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
}

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-900 text-slate-400 gap-4">
    <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
    <p className="text-sm font-medium tracking-wide">Iniciando interfaz dinámica...</p>
  </div>
)

// ScreenContent must be loaded purely on the client because of react-grid-layout
const ScreenContent = dynamic(() => import('@/components/views/pantalla-clase/ScreenContent'), {
  ssr: false,
  loading: () => <LoadingFallback />
})

async function getStudentsData(paramGroupId) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  
  const TEACHER_ID = session.user.email
  const db = await getDb()

  let resolvedGroupId = paramGroupId
  
  if (!resolvedGroupId) {
    const groups = await db.collection('class_groups').find({ teacher_id: TEACHER_ID }).sort({ created_at: 1 }).limit(1).toArray()
    if (groups.length > 0) {
      resolvedGroupId = groups[0].id
    }
  }

  if (!resolvedGroupId) return { students: [], resolvedGroupId: '' }

  const list = await db.collection('students').find({ teacher_id: TEACHER_ID, group_id: resolvedGroupId, active: { $ne: false } }).sort({ student_number: 1, last_name: 1 }).toArray()
  return { students: list.map(stripId), resolvedGroupId }
}

export default async function ClassroomScreenPage({ searchParams }) {
  const paramGroupId = searchParams?.groupId
  const data = await getStudentsData(paramGroupId)

  return (
    <ScreenContent 
      serverStudents={data.students} 
      resolvedGroupId={data.resolvedGroupId} 
    />
  )
}
