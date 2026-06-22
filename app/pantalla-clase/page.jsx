import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

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
  
  const TEACHER_EMAIL = session.user.email

  let resolvedGroupId = paramGroupId
  
  if (!resolvedGroupId) {
    const groups = await prisma.group.findMany({
       where: { userId: TEACHER_EMAIL },
       orderBy: { created_at: 'asc' },
       take: 1
    })
    if (groups.length > 0) {
      resolvedGroupId = groups[0].id
    }
  }

  if (!resolvedGroupId) return { students: [], resolvedGroupId: '' }

  const list = await prisma.student.findMany({
     where: { userId: TEACHER_EMAIL, groupId: resolvedGroupId, active: true },
     orderBy: [ { student_number: 'asc' }, { last_name: 'asc' } ]
  })
  return { students: list, resolvedGroupId }
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
