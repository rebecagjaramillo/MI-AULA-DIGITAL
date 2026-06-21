import { describe, it, expect } from 'vitest'
import { getTrimestre } from '@/lib/helpers'

describe('Helpers: getTrimestre', () => {
  it('calculates standard trimester boundaries correctly', () => {
    // T1: 8-11 (Aug-Nov)
    expect(getTrimestre('2023-08-01')).toBe(1)
    expect(getTrimestre('2023-11-30')).toBe(1)
    
    // T2: 12-3 (Dec-Mar) wraps around new year!
    expect(getTrimestre('2023-12-15')).toBe(2)
    expect(getTrimestre('2024-01-01')).toBe(2)
    expect(getTrimestre('2024-03-31')).toBe(2)
    
    // T3: 4-7 (Apr-Jul)
    expect(getTrimestre('2024-04-01')).toBe(3)
    expect(getTrimestre('2024-07-31')).toBe(3)
  })

  it('handles custom term dates correctly', () => {
    const customDates = {
      t1: { start_month: 1, end_month: 4 },
      t2: { start_month: 5, end_month: 8 },
      t3: { start_month: 9, end_month: 12 },
    }
    expect(getTrimestre('2023-01-15', customDates)).toBe(1)
    expect(getTrimestre('2023-05-15', customDates)).toBe(2)
    expect(getTrimestre('2023-10-15', customDates)).toBe(3)
  })

  it('returns null for missing dates', () => {
    expect(getTrimestre(null)).toBeNull()
    expect(getTrimestre('')).toBeNull()
  })
})
