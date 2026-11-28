/** Minutos que faltan para un instante ISO (negativo si ya pasó). */
export function minutesUntil(value: string, now: Date = new Date()): number {
  return Math.round((new Date(value).getTime() - now.getTime()) / 60_000)
}

/** "ahora", "en 25 min", "en 2 h 5 min", "en 3 d". */
export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'ahora'
  if (minutes < 60) return `en ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24) return rest > 0 ? `en ${hours} h ${rest} min` : `en ${hours} h`
  const days = Math.floor(hours / 24)
  return `en ${days} d`
}

export interface OffsetOption {
  value: number | null
  label: string
}

export const REMINDER_OFFSETS: OffsetOption[] = [
  { value: null, label: 'Sin recordatorio' },
  { value: 5, label: '5 min antes' },
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
  { value: 60, label: '1 h antes' },
  { value: 120, label: '2 h antes' },
  { value: 1440, label: '1 día antes' },
  { value: 2880, label: '2 días antes' },
  { value: 10080, label: '1 semana antes' },
]

export function offsetLabel(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'Sin recordatorio'
  return (
    REMINDER_OFFSETS.find((option) => option.value === minutes)?.label ?? `${minutes} min antes`
  )
}
