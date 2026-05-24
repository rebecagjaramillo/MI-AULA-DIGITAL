// PDF report generation utilities using jsPDF
// All functions are async because jsPDF is dynamically imported (heavy lib)

const PRIMARY = [59, 130, 246] // sky-500
const DARK = [15, 23, 42]      // slate-900
const MUTED = [100, 116, 139]  // slate-500
const SUCCESS = [16, 185, 129] // emerald-500
const DANGER = [239, 68, 68]   // rose-500

async function loadJsPDF() {
  const { jsPDF } = await import('jspdf')
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule.default || autoTableModule.autoTable
  return { jsPDF, autoTable }
}

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return d }
}

function shortDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }) }
  catch { return d }
}

function drawHeader(doc, title, subtitle, profile, group, period) {
  const W = doc.internal.pageSize.getWidth()
  // Top brand band
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, W, 28, 'F')
  doc.setFontSize(11); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold')
  doc.text('MI AULA DIGITAL', 14, 12)
  doc.setFontSize(8); doc.setFont('helvetica','normal')
  doc.text('Plataforma para docentes', 14, 18)
  doc.setFontSize(8)
  doc.text(`Generado: ${formatDate(new Date())}`, W - 14, 12, { align: 'right' })

  // Title
  doc.setTextColor(...DARK)
  doc.setFontSize(18); doc.setFont('helvetica','bold')
  doc.text(title, 14, 42)
  doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED)
  doc.text(subtitle, 14, 49)

  // Info row (school, teacher, group, period)
  let y = 60
  doc.setFontSize(9); doc.setTextColor(...DARK); doc.setFont('helvetica','bold')
  const rows = [
    ['Maestro/a:', profile?.display_name || profile?.full_name || '—'],
    ['Escuela:', profile?.school_name || '—'],
    ['Grupo:', group ? `${group.grade} ${group.group_name}${group.subject ? ' · ' + group.subject : ''}` : '—'],
    ['Ciclo:', group?.school_year || '—'],
    ['Periodo:', period || '—'],
  ]
  rows.forEach((r, i) => {
    const col = i % 2
    const row = Math.floor(i/2)
    const x = 14 + col * 95
    const yy = y + row * 6
    doc.setFont('helvetica','bold'); doc.setTextColor(...MUTED)
    doc.text(r[0], x, yy)
    doc.setFont('helvetica','normal'); doc.setTextColor(...DARK)
    doc.text(String(r[1]).slice(0,60), x + 22, yy)
  })
  return y + Math.ceil(rows.length/2) * 6 + 4
}

function drawFooter(doc) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFontSize(8); doc.setTextColor(...MUTED)
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, H - 14, W - 14, H - 14)
    doc.text('MI AULA DIGITAL · miauladigital.app', 14, H - 8)
    doc.text(`Página ${i} de ${totalPages}`, W - 14, H - 8, { align: 'right' })
  }
}

export async function generateGroupReportPDF(data) {
  const { jsPDF, autoTable } = await loadJsPDF()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const { profile, group, from, to, students, summary } = data
  const period = `${formatDate(from)} — ${formatDate(to)}`
  let y = drawHeader(doc, 'Reporte Grupal', 'Concentrado del grupo · Asistencia y desempeño', profile, group, period)

  // Summary cards (drawn as boxes)
  const W = doc.internal.pageSize.getWidth()
  const cardW = (W - 28 - 18) / 4
  const cards = [
    { label: 'Alumnos', value: summary.total_students, color: PRIMARY },
    { label: 'Sesiones', value: summary.total_sessions, color: [139,92,246] },
    { label: 'Actividades', value: summary.total_activities, color: [245,158,11] },
    { label: 'Asistencia prom.', value: (summary.avg_attendance || 0).toFixed(0) + '%', color: SUCCESS },
  ]
  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 6)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'F')
    doc.setFillColor(...c.color); doc.setDrawColor(...c.color)
    doc.roundedRect(x, y, 3, 18, 1, 1, 'F')
    doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK)
    doc.text(String(c.value), x + 6, y + 9)
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED)
    doc.text(c.label, x + 6, y + 14)
  })
  y += 24

  doc.autoTable = (opts) => autoTable(doc, opts)

  // Students table
  doc.autoTable({
    startY: y,
    head: [['N°', 'Alumno', 'Asist.', 'Faltas', 'Retardos', 'Just.', 'Asist. %', 'Hechas', 'Pendien.', 'Promedio']],
    body: students.map(s => [
      String(s.student_number || ''),
      `${s.first_name} ${s.last_name}`,
      s.presente,
      s.falta,
      s.retardo,
      s.justificado,
      s.attendance_pct !== null ? s.attendance_pct + '%' : '—',
      s.activities_done,
      s.activities_pending,
      s.average ?? '—',
    ]),
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 6) { // attendance pct
          const v = parseInt(data.cell.text[0])
          if (!isNaN(v)) {
            if (v < 70) data.cell.styles.textColor = DANGER
            else if (v >= 90) data.cell.styles.textColor = SUCCESS
          }
        }
        if (data.column.index === 9) { // average
          const v = parseFloat(data.cell.text[0])
          if (!isNaN(v)) {
            if (v < 7) data.cell.styles.textColor = DANGER
            else if (v >= 9) data.cell.styles.textColor = SUCCESS
          }
        }
      }
    },
  })

  drawFooter(doc)
  return doc
}

export async function generateStudentReportPDF(data) {
  const { jsPDF, autoTable } = await loadJsPDF()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.autoTable = (opts) => autoTable(doc, opts)
  const { profile, student, group, from, to, attendance, grades, average } = data
  const period = `${formatDate(from)} — ${formatDate(to)}`
  let y = drawHeader(doc, `Reporte Individual: ${student.first_name} ${student.last_name}`, `N° de lista: ${student.student_number || '—'}`, profile, group, period)

  // Big stat boxes: asistencia %, promedio, faltas, retardos
  const W = doc.internal.pageSize.getWidth()
  const cardW = (W - 28 - 18) / 4
  const cards = [
    { label: 'Asistencia', value: attendance.attendance_pct !== null ? attendance.attendance_pct + '%' : '—', color: PRIMARY },
    { label: 'Promedio', value: average ?? '—', color: SUCCESS },
    { label: 'Faltas', value: attendance.falta, color: DANGER },
    { label: 'Retardos', value: attendance.retardo, color: [245, 158, 11] },
  ]
  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 6)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'F')
    doc.setFillColor(...c.color)
    doc.roundedRect(x, y, 3, 22, 1, 1, 'F')
    doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK)
    doc.text(String(c.value), x + 6, y + 11)
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED)
    doc.text(c.label, x + 6, y + 17)
  })
  y += 28

  // Calificaciones
  doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK)
  doc.text('Calificaciones', 14, y); y += 4

  if (grades.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica','italic'); doc.setTextColor(...MUTED)
    doc.text('Sin actividades registradas en el periodo.', 14, y + 4); y += 10
  } else {
    doc.autoTable({
      startY: y,
      head: [['Actividad', 'Tipo', 'Entrega', 'Estado', 'Puntaje', 'Retroalimentación']],
      body: grades.map(g => [
        g.title,
        g.type,
        shortDate(g.due_date),
        g.status,
        g.score !== null && g.score !== undefined ? `${g.score} / ${g.max_score}` : '—',
        (g.feedback || '').slice(0, 80),
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // Asistencia detalle
  doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK)
  doc.text('Historial de asistencia', 14, y); y += 4
  if (attendance.records.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica','italic'); doc.setTextColor(...MUTED)
    doc.text('Sin registros de asistencia en el periodo.', 14, y + 4)
  } else {
    doc.autoTable({
      startY: y,
      head: [['Fecha', 'Estado', 'Justificación']],
      body: attendance.records.map(r => [shortDate(r.date), r.status, r.justification || '']),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // Observations & signature area
  if (y > 240) { doc.addPage(); y = 20 }
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK)
  doc.text('Observaciones y recomendaciones', 14, y); y += 6
  doc.setDrawColor(226, 232, 240)
  for (let i = 0; i < 4; i++) { doc.line(14, y + i*7, W - 14, y + i*7) }
  y += 35
  // Signature
  const sx = W - 80
  doc.line(sx, y, sx + 60, y)
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED)
  doc.text(profile?.display_name || profile?.full_name || 'Maestro/a', sx + 30, y + 5, { align: 'center' })
  doc.text('Firma del docente', sx + 30, y + 10, { align: 'center' })

  drawFooter(doc)
  return doc
}

export async function generateLessonPlanPDF(data) {
  const { jsPDF, autoTable } = await loadJsPDF()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.autoTable = (opts) => autoTable(doc, opts)
  const { profile, plan, group } = data
  const period = formatDate(plan.date)
  let y = drawHeader(doc, 'Planeación de Clase', plan.title || plan.topic, profile, group, period)

  const W = doc.internal.pageSize.getWidth()
  // Meta strip
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y, W - 28, 16, 2, 2, 'F')
  doc.setFontSize(9); doc.setTextColor(...MUTED); doc.setFont('helvetica','bold')
  doc.text('Materia:', 18, y + 6); doc.setFont('helvetica','normal'); doc.setTextColor(...DARK); doc.text(plan.subject || '—', 32, y + 6)
  doc.setFont('helvetica','bold'); doc.setTextColor(...MUTED); doc.text('Grado:', 80, y + 6); doc.setFont('helvetica','normal'); doc.setTextColor(...DARK); doc.text(plan.grade || '—', 92, y + 6)
  doc.setFont('helvetica','bold'); doc.setTextColor(...MUTED); doc.text('Duración:', 130, y + 6); doc.setFont('helvetica','normal'); doc.setTextColor(...DARK); doc.text(`${plan.duration_minutes || '—'} min`, 150, y + 6)
  doc.setFont('helvetica','bold'); doc.setTextColor(...MUTED); doc.text('Tema:', 18, y + 12); doc.setFont('helvetica','normal'); doc.setTextColor(...DARK); doc.text(String(plan.topic || '—').slice(0,90), 28, y + 12)
  y += 22

  const sections = [
    ['Objetivo',                plan.objective],
    ['Aprendizaje esperado',    plan.learning_goal],
    ['Inicio',                  plan.start_activity],
    ['Desarrollo',              plan.development_activity],
    ['Cierre',                  plan.closing_activity],
    ['Materiales',              plan.materials],
    ['Evaluación',              plan.evaluation],
    ['Adecuaciones',            plan.accommodations],
    ['Observaciones',           plan.observations],
  ]
  for (const [label, text] of sections) {
    if (!text) continue
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFillColor(...PRIMARY)
    doc.rect(14, y - 3, 3, 6, 'F')
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK)
    doc.text(label, 20, y + 2); y += 5
    doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(50,60,70)
    const lines = doc.splitTextToSize(String(text), W - 28)
    doc.text(lines, 14, y + 3)
    y += lines.length * 5 + 5
  }

  // Signature
  if (y > 250) { doc.addPage(); y = 20 }
  y += 8
  const sx = W - 80
  doc.setDrawColor(180, 188, 200); doc.line(sx, y, sx + 60, y)
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED)
  doc.text(profile?.display_name || profile?.full_name || 'Maestro/a', sx + 30, y + 5, { align: 'center' })
  doc.text('Firma del docente', sx + 30, y + 10, { align: 'center' })

  drawFooter(doc)
  return doc
}

export async function generateAttendanceListPDF(data) {
  const { jsPDF, autoTable } = await loadJsPDF()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.autoTable = (opts) => autoTable(doc, opts)
  const { profile, group, from, to, students } = data
  const period = `${formatDate(from)} — ${formatDate(to)}`
  let y = drawHeader(doc, 'Reporte de Asistencia', 'Concentrado del periodo', profile, group, period)

  doc.autoTable({
    startY: y,
    head: [['N°', 'Alumno', 'Presentes', 'Faltas', 'Retardos', 'Justif.', 'Asistencia %']],
    body: students.map(s => [
      s.student_number || '',
      `${s.first_name} ${s.last_name}`,
      s.presente, s.falta, s.retardo, s.justificado,
      s.attendance_pct !== null ? s.attendance_pct + '%' : '—',
    ]),
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  drawFooter(doc)
  return doc
}
