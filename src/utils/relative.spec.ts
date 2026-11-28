import { describe, expect, it } from 'vitest'
import { formatCountdown, minutesUntil, offsetLabel } from './relative'

describe('relative', () => {
  it('calcula los minutos que faltan', () => {
    const now = new Date('2026-11-27T08:00:00Z')
    expect(minutesUntil('2026-11-27T08:25:00Z', now)).toBe(25)
    expect(minutesUntil('2026-11-27T07:30:00Z', now)).toBe(-30)
  })

  it('formatea la cuenta atrás en minutos, horas y días', () => {
    expect(formatCountdown(0)).toBe('ahora')
    expect(formatCountdown(-10)).toBe('ahora')
    expect(formatCountdown(25)).toBe('en 25 min')
    expect(formatCountdown(60)).toBe('en 1 h')
    expect(formatCountdown(125)).toBe('en 2 h 5 min')
    expect(formatCountdown(60 * 24 * 3)).toBe('en 3 d')
  })

  it('etiqueta los offsets de recordatorio', () => {
    expect(offsetLabel(null)).toBe('Sin recordatorio')
    expect(offsetLabel(60)).toBe('1 h antes')
    expect(offsetLabel(90)).toBe('90 min antes')
  })
})
