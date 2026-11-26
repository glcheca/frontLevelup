const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

/** 1 = lunes … 7 = domingo (igual que `class_block.day_of_week`). */
export function isoWeekday(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

export function startOfWeek(date: Date): Date {
  const copy = startOfDay(date)
  return addDays(copy, 1 - isoWeekday(copy))
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6))
}

export function startOfMonth(date: Date): Date {
  const copy = startOfDay(date)
  copy.setDate(1)
  return copy
}

export function endOfMonth(date: Date): Date {
  const copy = startOfDay(date)
  copy.setMonth(copy.getMonth() + 1, 0)
  return endOfDay(copy)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Clave local `YYYY-MM-DD` para agrupar por día sin líos de zona horaria. */
export function dayKey(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${value.getFullYear()}-${month}-${day}`
}

/** Semanas del mes (lunes a domingo) para la vista mensual; incluye días de meses vecinos. */
export function monthGrid(month: Date): Date[][] {
  const first = startOfWeek(startOfMonth(month))
  const last = endOfWeek(endOfMonth(month))
  const weeks: Date[][] = []
  let cursor = first
  while (cursor <= last) {
    const week: Date[] = []
    for (let i = 0; i < 7; i += 1) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }
  return weeks
}

export function formatTime(value: string | Date, options: { withSeconds?: boolean } = {}): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const formatted = date.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
    ...(options.withSeconds ? { second: '2-digit' } : {}),
  })
  return formatted
}

/** "08:00" (LocalTime del backend) → "08:00"; recorta los segundos. */
export function shortTime(value: string): string {
  return value.slice(0, 5)
}

export function formatDayLong(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const formatted = value.toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatDayShort(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return value.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export function weekdayName(dayOfWeek: number): string {
  return WEEKDAYS[dayOfWeek - 1] ?? ''
}

export function weekdayShort(dayOfWeek: number): string {
  return weekdayName(dayOfWeek).slice(0, 3)
}

/** Etiqueta amable para vencimientos: "Hoy", "Mañana", "En 3 días" o la fecha. */
export function formatDueLabel(value: string | null): string {
  if (!value) return 'Sin fecha'
  const due = startOfDay(new Date(value))
  const today = startOfDay(new Date())
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  if (diff > 1 && diff <= 7) return `En ${diff} días`
  if (diff < -1) return `Hace ${Math.abs(diff)} días`
  return formatDayShort(due)
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${formatDayShort(date)} · ${formatTime(date)}`
}

/** `datetime-local` (hora local del navegador) → ISO en UTC para la API. */
export function localInputToIso(value: string): string {
  return new Date(value).toISOString()
}

/** ISO de la API → valor para un input `datetime-local`. */
export function isoToLocalInput(value: string): string {
  const date = new Date(value)
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** ISO de la API → valor para un input `date`. */
export function isoToDateInput(value: string): string {
  return isoToLocalInput(value).slice(0, 10)
}

/** `date` (YYYY-MM-DD) → ISO a medianoche local (para que el backend normalice el día). */
export function dateInputToIso(value: string): string {
  return new Date(`${value}T00:00`).toISOString()
}

/** `time` (HH:mm) → `HH:mm:00` como espera el backend. */
export function timeInputToApi(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}
