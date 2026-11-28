import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { AuthResponse, User } from '@/types/models'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  setAccessToken: vi.fn(),
  setTheme: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('@/api/auth', () => ({
  authApi: {
    login: mocks.login,
    register: mocks.register,
    refresh: mocks.refresh,
    logout: mocks.logout,
  },
}))

vi.mock('@/api/token', () => ({ setAccessToken: mocks.setAccessToken }))

vi.mock('@/composables/useTheme', () => ({ setTheme: mocks.setTheme }))

vi.mock('@/api/user', () => ({ userApi: { updateProfile: mocks.updateProfile } }))

import { useAuthStore } from './auth'

const user: User = {
  id: 'u1',
  email: 'ana@levelup.test',
  name: 'Ana',
  timezone: 'America/Lima',
  locale: 'es',
  theme: 'dark',
  notifyEvents: true,
  notifyTasks: true,
}

const session: AuthResponse = { accessToken: 'access-token', user }

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocks.login.mockReset()
    mocks.register.mockReset()
    mocks.refresh.mockReset()
    mocks.logout.mockReset()
    mocks.setAccessToken.mockReset()
    mocks.setTheme.mockReset()
    mocks.updateProfile.mockReset()
  })

  it('inicia sesión, guarda el token y aplica el tema del usuario', async () => {
    mocks.login.mockResolvedValue(session)
    const store = useAuthStore()

    await store.login({ email: user.email, password: 'Secreta123!' })

    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.email).toBe(user.email)
    expect(store.loading).toBe(false)
    expect(mocks.setAccessToken).toHaveBeenCalledWith('access-token')
    expect(mocks.setTheme).toHaveBeenCalledWith('dark')
  })

  it('no autentica si el login falla y restablece loading', async () => {
    mocks.login.mockRejectedValue(new Error('credenciales inválidas'))
    const store = useAuthStore()

    await expect(store.login({ email: user.email, password: 'mala' })).rejects.toThrow(
      'credenciales inválidas',
    )

    expect(store.isAuthenticated).toBe(false)
    expect(store.loading).toBe(false)
    expect(mocks.setAccessToken).not.toHaveBeenCalled()
  })

  it('bootstrap deja la sesión lista cuando el refresh funciona', async () => {
    mocks.refresh.mockResolvedValue(session)
    const store = useAuthStore()

    await store.bootstrap()

    expect(store.initialized).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.name).toBe('Ana')
  })

  it('bootstrap marca inicializado y sin sesión si el refresh falla', async () => {
    mocks.refresh.mockRejectedValue(new Error('401'))
    const store = useAuthStore()

    await store.bootstrap()

    expect(store.initialized).toBe(true)
    expect(store.isAuthenticated).toBe(false)
    expect(mocks.setAccessToken).toHaveBeenCalledWith(null)
  })

  it('logout limpia la sesión aunque el backend falle', async () => {
    mocks.login.mockResolvedValue(session)
    mocks.logout.mockRejectedValue(new Error('sin red'))
    const store = useAuthStore()

    await store.login({ email: user.email, password: 'Secreta123!' })
    await expect(store.logout()).rejects.toThrow('sin red')

    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(mocks.setAccessToken).toHaveBeenLastCalledWith(null)
  })

  it('saveTheme actualiza el usuario con la respuesta del backend', async () => {
    mocks.login.mockResolvedValue(session)
    mocks.updateProfile.mockResolvedValue({ ...user, theme: 'light' })
    const store = useAuthStore()

    await store.login({ email: user.email, password: 'Secreta123!' })
    await store.saveTheme('light')

    expect(mocks.updateProfile).toHaveBeenCalledWith({ theme: 'light' })
    expect(store.user?.theme).toBe('light')
  })
})
