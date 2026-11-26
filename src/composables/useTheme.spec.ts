import { describe, expect, it, vi } from 'vitest'
import type { Theme } from './useTheme'

type MediaListener = (event: { matches: boolean }) => void

function stubSystemPreference(matches: boolean) {
  const listeners = new Set<MediaListener>()
  const mediaQuery = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: MediaListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaListener) => listeners.delete(listener),
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }

  window.matchMedia = vi.fn().mockReturnValue(mediaQuery) as unknown as typeof window.matchMedia

  return {
    emit(next: boolean) {
      mediaQuery.matches = next
      listeners.forEach((listener) => listener({ matches: next }))
    },
  }
}

async function loadTheme(stored?: Theme) {
  if (stored) {
    window.localStorage.setItem('levelup.theme', stored)
  }
  vi.resetModules()
  return import('./useTheme')
}

describe('useTheme', () => {
  it('usa el tema del sistema cuando no hay preferencia guardada', async () => {
    stubSystemPreference(true)
    const { initTheme, useTheme } = await loadTheme()

    initTheme()

    expect(useTheme().theme.value).toBe('system')
    expect(useTheme().resolvedTheme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('respeta la preferencia guardada en localStorage', async () => {
    stubSystemPreference(false)
    const { useTheme } = await loadTheme('dark')

    expect(useTheme().theme.value).toBe('dark')
    expect(useTheme().resolvedTheme.value).toBe('dark')
  })

  it('ignora un valor inválido guardado en localStorage', async () => {
    stubSystemPreference(false)
    window.localStorage.setItem('levelup.theme', 'neon')
    vi.resetModules()
    const { useTheme } = await import('./useTheme')

    expect(useTheme().theme.value).toBe('system')
  })

  it('aplica y persiste el tema oscuro', async () => {
    stubSystemPreference(false)
    const { setTheme, useTheme } = await loadTheme()

    setTheme('dark')

    expect(useTheme().resolvedTheme.value).toBe('dark')
    expect(window.localStorage.getItem('levelup.theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('vuelve al tema claro y quita la clase dark', async () => {
    stubSystemPreference(true)
    const { setTheme, useTheme } = await loadTheme()

    setTheme('dark')
    setTheme('light')

    expect(useTheme().resolvedTheme.value).toBe('light')
    expect(window.localStorage.getItem('levelup.theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('reacciona al cambio de preferencia del sistema', async () => {
    const system = stubSystemPreference(false)
    const { initTheme, useTheme } = await loadTheme()

    initTheme()
    expect(useTheme().resolvedTheme.value).toBe('light')

    system.emit(true)

    expect(useTheme().resolvedTheme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
