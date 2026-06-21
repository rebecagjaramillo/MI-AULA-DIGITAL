import { z } from 'zod'

export const studentSchema = z.object({
  student_number: z.union([
    z.number().positive("El número de lista debe ser válido"),
    z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Debe ser un número válido")
  ]).transform(Number).optional().nullable(),
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "Los apellidos son requeridos"),
  group_id: z.string().optional(), // Injected in onSubmit
  active: z.boolean().optional().default(true),
  guardian_name: z.string().optional(),
  guardian_contact: z.string().optional(),
  nfc_uid: z.string().optional().nullable(),
  notes: z.string().optional()
})
