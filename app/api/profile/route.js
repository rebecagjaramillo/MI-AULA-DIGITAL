import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    // session.user.email is used as identifier
    const user = await prisma.user.findUnique({
       where: { email: session.user.email }
    })
    
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    
    // Eliminamos datos sensibles antes de enviarlo
    const { password, ...safeUser } = user
    return json(safeUser)
  } catch (error) {
    console.error("Prisma Profile GET Error:", error)
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await readBody(request)
    
    const updateData = { ...body }
    if (typeof updateData.subjects === 'string') {
      updateData.subjects = updateData.subjects.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (typeof updateData.education_levels === 'string') {
      updateData.education_levels = updateData.education_levels.split(',').map(s => s.trim()).filter(Boolean)
    }
    
    // No permitir actualizar campos protegidos directamente aquí
    delete updateData.id
    delete updateData.email
    delete updateData.password
    delete updateData.emailVerified

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData
    })
    
    const { password, ...safeUser } = updatedUser
    return json(safeUser)
  } catch (error) {
    console.error("Prisma Profile POST Error:", error)
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
  }
}

export async function PUT(request) {
  return POST(request)
}
