import { describe, it, expect } from 'vitest'
import { activitySchema } from '@/lib/schemas/activitySchema'

describe('Schemas: activitySchema', () => {
  it('validates a correct activity object', () => {
    const validData = {
      title: 'Examen de Matemáticas',
      due_date: '2023-10-15',
      max_score: 10,
      weight: 1,
      trimestre: 1,
    }
    const result = activitySchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects empty titles', () => {
    const result = activitySchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toContain('El título no puede estar vacío')
  })

  it('rejects invalid or malformed dates', () => {
    const result = activitySchema.safeParse({ due_date: 'fecha-invalida' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toContain('Debe ser una fecha válida')
  })

  it('rejects negative scores and zero/negative weights', () => {
    const res1 = activitySchema.safeParse({ max_score: -5 })
    expect(res1.success).toBe(false)
    
    const res2 = activitySchema.safeParse({ weight: 0 })
    expect(res2.success).toBe(false)
  })

  it('transforms string numbers correctly for max_score and weight', () => {
    const result = activitySchema.safeParse({ max_score: '100', weight: '2.5' })
    expect(result.success).toBe(true)
    expect(result.data.max_score).toBe(100)
    expect(result.data.weight).toBe(2.5)
  })
})
