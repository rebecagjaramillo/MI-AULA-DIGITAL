import { DEFAULT_TERM_DATES } from '@/lib/constants'

/** Devuelve las iniciales de un nombre (máx 2 letras) */
export function initials(s = '') {
  return s.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}

export function todayISO() { 
  return new Date().toISOString().slice(0,10) 
}

/** Calcula el trimestre (1, 2 o 3) a partir de una fecha y los rangos configurados */
export function getTrimestre(dateStr, termDates) {
  if (!dateStr) return null
  const td = termDates || DEFAULT_TERM_DATES
  
  let m
  if (typeof dateStr === 'string' && dateStr.length >= 10 && dateStr.includes('-')) {
    m = parseInt(dateStr.substring(5, 7), 10)
  } else {
    m = new Date(dateStr).getMonth() + 1
  }
  const inRange = (r) => {
    const { start_month: s, end_month: e } = r
    if (s <= e) return m >= s && m <= e
    return m >= s || m <= e
  }
  if (inRange(td.t1)) return 1
  if (inRange(td.t2)) return 2
  if (inRange(td.t3)) return 3
  return null
}
