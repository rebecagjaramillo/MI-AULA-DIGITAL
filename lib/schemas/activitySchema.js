import { z } from 'zod'

export const activitySchema = z.object({
  group_id: z.string().optional(),
  subject: z.string().optional(),
  subject_id: z.string().nullable().optional(),
  title: z.string().min(1, "El título no puede estar vacío").optional(),
  description: z.string().optional(),
  activity_type: z.string().optional(),
  due_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Debe ser una fecha válida",
  }).optional(),
  trimestre: z.number().int().min(1).max(4).nullable().optional(),
  max_score: z.union([z.number().positive("La calificación máxima debe ser positiva"), z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Debe ser un número positivo")]).transform(Number).optional(),
  weight: z.union([z.number().positive("El peso debe ser positivo"), z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Debe ser un número positivo")]).transform(Number).optional(),
  status: z.string().optional(),
})

export const activityGradesSchema = z.object({
  records: z.array(z.object({
    student_id: z.string(),
    score: z.union([z.number(), z.string(), z.null()]).optional(),
    status: z.string().optional(),
    feedback: z.string().optional()
  })).optional()
})
