import { NextResponse } from 'next/server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

  return NextResponse.json({ error: 'API has been modularized. This catch-all route is no longer in use.' }, { status: 404 })
}

export async function POST(request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

  return NextResponse.json({ error: 'API has been modularized.' }, { status: 404 })
}

export async function PUT(request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

  return NextResponse.json({ error: 'API has been modularized.' }, { status: 404 })
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

  return NextResponse.json({ error: 'API has been modularized.' }, { status: 404 })
}
