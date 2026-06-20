import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"


function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

function errorRes(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function stripId(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return rest
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
    const db = await getDb()

    // /api/lesson-plans
    if (parts.length === 0) {
      const col = db.collection('lesson_plans')
      const filter = { teacher_id: TEACHER_ID }
      if (search.groupId) filter.group_id = search.groupId
      const list = await col.find(filter).sort({ date: -1, created_at: -1 }).toArray()
      return json(list.map(stripId))
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
    const db = await getDb()
    const body = await readBody(request)

    // /api/lesson-plans
    if (parts.length === 0) {
      const col = db.collection('lesson_plans')
      const doc = {
        id: uuidv4(),
        teacher_id: TEACHER_ID,
        group_id: body.group_id || null,
        subject: body.subject || '',
        grade: body.grade || '',
        topic: body.topic || '',
        title: body.title || (body.topic || 'Planeación'),
        date: body.date || new Date().toISOString().slice(0, 10),
        duration_minutes: body.duration_minutes || 50,
        objective: body.objective || '',
        learning_goal: body.learning_goal || '',
        start_activity: body.start_activity || '',
        development_activity: body.development_activity || '',
        closing_activity: body.closing_activity || '',
        materials: body.materials || '',
        evaluation: body.evaluation || '',
        accommodations: body.accommodations || '',
        observations: body.observations || '',
        status: body.status || 'borrador',
        created_at: new Date().toISOString(),
      }
      await col.insertOne(doc)
      return json(stripId(doc))
    }

    // /api/lesson-plans/generate-ai
    if (parts.length === 1 && parts[0] === 'generate-ai') {
      const { subject, grade, topic } = body
      
      const webhookUrl = process.env.N8N_WEBHOOK_URL
      if (!webhookUrl) return errorRes('Por favor, configura N8N_WEBHOOK_URL en tu archivo .env', 500)

      try {
        const unitsCol = db.collection('curriculum_units')
        const topicsCol = db.collection('curriculum_topics')
        
        const units = await unitsCol.find({ teacher_id: TEACHER_ID, subject: subject, grade: grade }).sort({ order_index: 1 }).toArray()
        
        let temario_del_curso = "Temario no disponible. Basa la clase en conocimientos generales de la materia."
        
        if (units.length > 0) {
          temario_del_curso = ""
          for (const u of units) {
            temario_del_curso += `Unidad: ${u.title}\n`
            const topics = await topicsCol.find({ teacher_id: TEACHER_ID, unit_id: u.id }).sort({ order_index: 1 }).toArray()
            topics.forEach(t => {
              temario_del_curso += `  - Tema: ${t.title} (Objetivo: ${t.learning_goal})\n`
            })
          }
        }

        const payloadParaIA = {
          ...body,
          temario_del_curso: temario_del_curso
        }

        const webhookResp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadParaIA) 
        })
        
        if (!webhookResp.ok) {
          const txt = await webhookResp.text()
          return errorRes('Error en tu Webhook/n8n: ' + txt, 500)
        }
        
        const data = await webhookResp.json()
        return json({ generated: data })
      } catch (e) {
        return errorRes('Error conectando con el Webhook: ' + e.message, 500)
      }
    }

    return errorRes('Not found', 404)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
