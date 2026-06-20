/**
 * Helper para llamadas a la API interna.
 * Todas las rutas se resuelven a /api/<path>.
 */
export function api(path, opts = {}) {
  return fetch('/api/' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  }).then(async r => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || 'Error')
    return data
  })
}

/** Devuelve la fecha de hoy en formato YYYY-MM-DD */
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Fecha legible en español: "jueves 19 de junio de 2025" */
export function formatDateLong(d = new Date()) {
  return d.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
