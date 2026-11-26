import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayKey,
  formatDueLabel,
  isSameDay,
  isoWeekday,
  isoToLocalInput,
  monthGrid,
  shortTime,
  startOfWeek,
  timeInputToApi,
  weekdayName,
} from './dates'

describe('dates', () => {
  it('usa lunes como primer día de la semana', () => {
    // 2026-11-26 es jueves.
    const thursday = new Date(2026, 10, 26)
    expect(isoWeekday(thursday)).toBe(4)
    expect(weekdayName(4)).toBe('jueves')
    expect(dayKey(startOfWeek(thursday))).toBe('2026-11-23')
    expect(isoWeekday(startOfWeek(thursday))).toBe(1)
    expect(isoWeekday(new Date(2026, 10, 29))).toBe(7)
  })

  it('genera la rejilla del mes completa por semanas', () => {
    const weeks = monthGrid(new Date(2026, 10, 15))
    expect(weeks[0]![0]!.getDate()).toBe(26)
    expect(weeks.at(-1)!.at(-1)!.getMonth()).toBeGreaterThanOrEqual(10)
    for (const week of weeks) {
      expect(week).toHaveLength(7)
    }
  })

  it('compara días y suma días sin cruzar mal el cambio de mes', () => {
    expect(isSameDay(new Date(2026, 10, 26, 9), new Date(2026, 10, 26, 23))).toBe(true)
    expect(isSameDay(new Date(2026, 10, 26), new Date(2026, 10, 27))).toBe(false)
    expect(dayKey(addDays(new Date(2026, 10, 30), 2))).toBe('2026-12-02')
  })

  it('etiqueta los vencimientos de forma relativa', () => {
    const iso = (offset: number) => {
      const date = new Date()
      date.setDate(date.getDate() + offset)
      return date.toISOString()
    }
    expect(formatDueLabel(null)).toBe('Sin fecha')
    expect(formatDueLabel(iso(0))).toBe('Hoy')
    expect(formatDueLabel(iso(1))).toBe('Mañana')
    expect(formatDueLabel(iso(-1))).toBe('Ayer')
    expect(formatDueLabel(iso(3))).toBe('En 3 días')
    expect(formatDueLabel(iso(-4))).toBe('Hace 4 días')
  })

  it('convierte entre la API y los inputs del formulario', () => {
    expect(shortTime('08:30:00')).toBe('08:30')
    expect(timeInputToApi('08:30')).toBe('08:30:00')
    expect(timeInputToApi('08:30:00')).toBe('08:30:00')

    const iso = new Date(2026, 2, 14, 9, 5).toISOString()
    expect(isoToLocalInput(iso)).toBe('2026-03-14T09:05')
  })
})
