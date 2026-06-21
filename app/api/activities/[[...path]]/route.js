import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import * as activityService from '@/lib/services/activityService'
import { activitySchema, activityGradesSchema } from '@/lib/schemas/activitySchema'

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

function errorRes(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const url = new URL(request.url)
    const search = Object.fromEntries(url.searchParams)

    // /api/activities
    if (parts.length === 0) {
      const activities = await activityService.getActivities(TEACHER_ID, search)
      return json(activities)
    }

    // /api/activities/[id]/grades
    if (parts.length === 2 && parts[1] === 'grades') {
      const id = parts[0]
      const data = await activityService.getActivityGrades(TEACHER_ID, id)
      if (!data) return errorRes('Actividad no encontrada', 404)
      return json(data)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)

    // /api/activities
    if (parts.length === 0) {
      const validation = activitySchema.safeParse(body)
      if (!validation.success) {
        return errorRes(validation.error.format(), 400)
      }
      
      const doc = await activityService.createActivity(TEACHER_ID, body)
      return json(doc)
    }

    // /api/activities/[id]/grades
    if (parts.length === 2 && parts[1] === 'grades') {
      const id = parts[0]
      const validation = activityGradesSchema.safeParse(body)
      if (!validation.success) {
        return errorRes(validation.error.format(), 400)
      }
      
      const count = await activityService.saveActivityGrades(TEACHER_ID, id, body.records || [])
      return json({ ok: true, count })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)

    // /api/activities/[id]
    if (parts.length === 1) {
      const id = parts[0]
      const validation = activitySchema.safeParse(body)
      if (!validation.success) {
        return errorRes(validation.error.format(), 400)
      }
      
      const doc = await activityService.updateActivity(TEACHER_ID, id, body)
      if (!doc) return errorRes('Actividad no encontrada', 404)
      return json(doc)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email

    const parts = params?.path || []

    // /api/activities/[id]
    if (parts.length === 1) {
      const id = parts[0]
      await activityService.deleteActivity(TEACHER_ID, id)
      return json({ ok: true })
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
