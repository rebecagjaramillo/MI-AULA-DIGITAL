import { describe, it, expect, vi } from 'vitest'
import { getActivities } from '@/lib/services/activityService'

vi.mock('@/lib/mongodb', () => {
  const mockDb = {
    collection: vi.fn((colName) => {
      if (colName === 'activities') {
        return {
          find: () => ({
            sort: () => ({
              toArray: async () => [{ id: 'a1', group_id: 'g1' }]
            })
          })
        }
      }
      if (colName === 'activity_grades') {
        return {
          find: () => ({
            toArray: async () => [
              { status: 'calificado', score: null }, // Graded (status explicitly says calificado)
              { status: 'pendiente', score: 10 },    // Graded (has valid score)
              { status: 'pendiente', score: 0 },     // Graded (0 is a valid score)
              { status: 'pendiente', score: null },  // Not graded
              { status: 'pendiente', score: '' }     // Not graded
            ]
          })
        }
      }
      if (colName === 'students') {
        return {
          countDocuments: async () => 10
        }
      }
    })
  }
  return { getDb: async () => mockDb }
})

describe('Service: activityService', () => {
  it('calculates graded_count and pending counts correctly', async () => {
    const result = await getActivities('TEACHER_123')
    
    expect(result).toHaveLength(1)
    expect(result[0].students_count).toBe(10)
    
    // Out of 5 mock records, exactly 3 meet the criteria:
    // status === 'calificado' OR (score !== null && score !== undefined && score !== '')
    expect(result[0].graded_count).toBe(3)
    
    // Pending should be students_count (10) - graded_count (3) = 7
    expect(result[0].pending).toBe(7)
  })
})
