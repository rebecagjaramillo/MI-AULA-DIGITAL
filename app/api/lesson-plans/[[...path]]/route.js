import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

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
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    const url = new URL(request.url)
    const search = Object.fromEntries(url.searchParams)

    // /api/lesson-plans
    if (parts.length === 0) {
      const filter = { userId: TEACHER_EMAIL }
      // NOTE: Our simple model doesn't store group_id currently (kept it simple). We just return all.
      const list = await prisma.lessonPlan.findMany({
         where: filter,
         orderBy: [{ date: 'desc' }, { created_at: 'desc' }]
      })
      return json(list)
    }

    return errorRes('Not found', 404)
  } catch (error) {
    console.error("Prisma LessonPlans GET Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_EMAIL = session.user.email

    const parts = params?.path || []
    const body = await readBody(request)

    // /api/lesson-plans
    if (parts.length === 0) {
      const doc = await prisma.lessonPlan.create({
         data: {
            userId: TEACHER_EMAIL,
            subject: body.subject || '',
            title: body.title || (body.topic || 'Planeación'),
            date: body.date || new Date().toISOString().slice(0, 10),
            content: body.content || '',
         }
      })
      return json(doc)
    }

    // /api/lesson-plans/generate-ai
    if (parts.length === 1 && parts[0] === 'generate-ai') {
      const { subject, grade, topic } = body
      
      const webhookUrl = process.env.N8N_WEBHOOK_URL
      if (!webhookUrl) return errorRes('Por favor, configura N8N_WEBHOOK_URL en tu archivo .env', 500)

      try {
        const units = await prisma.curriculumUnit.findMany({ 
           where: { userId: TEACHER_EMAIL, subject: subject, grade: grade },
           orderBy: { order_index: 'asc' }
        })
        
        let temario_del_curso = "Temario no disponible. Basa la clase en conocimientos generales de la materia."
        
        if (units.length > 0) {
          temario_del_curso = ""
          for (const u of units) {
            temario_del_curso += `Unidad: ${u.title}\n`
            const topics = await prisma.curriculumTopic.findMany({ 
               where: { userId: TEACHER_EMAIL, unitId: u.id },
               orderBy: { order_index: 'asc' }
            })
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
    console.error("Prisma LessonPlans POST Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
