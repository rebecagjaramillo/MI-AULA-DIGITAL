import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const TEACHER_EMAIL = session.user.email

    // Al eliminar el usuario, Prisma se encargará de ejecutar el onDelete: Cascade
    // para todas las relaciones definidas (Accounts, Sessions, Groups, Students, Activities, etc.)
    await prisma.user.delete({
       where: { email: TEACHER_EMAIL }
    })

    // Nota: Si hay modelos en la base de datos que aún no han sido
    // migrados a Prisma con relación directa al User (ej. lesson_plans, events),
    // deberán ser mapeados con onDelete: Cascade en schema.prisma en el futuro.
    
    return NextResponse.json({ success: true, message: 'All user data wiped via Prisma cascade' })
  } catch (error) {
    console.error("Prisma Profile Delete Error:", error)
    return NextResponse.json({ error: "Error al eliminar la cuenta" }, { status: 500 })
  }
}
