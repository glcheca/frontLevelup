import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import { setAccessToken } from '@/api/token'
import { userApi } from '@/api/user'
import { setTheme, type Theme } from '@/composables/useTheme'
import type { LoginRequest, RegisterRequest, User } from '@/types/models'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  function applySession(session: { accessToken: string; user: User }) {
    setAccessToken(session.accessToken)
    user.value = session.user
    if (session.user.theme) {
      setTheme(session.user.theme)
    }
  }

  async function login(payload: LoginRequest) {
    loading.value = true
    error.value = null
    try {
      applySession(await authApi.login(payload))
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterRequest) {
    loading.value = true
    error.value = null
    try {
      applySession(await authApi.register(payload))
    } finally {
      loading.value = false
    }
  }

  async function bootstrap() {
    if (initialized.value) return
    try {
      applySession(await authApi.refresh())
    } catch {
      setAccessToken(null)
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      user.value = null
    }
  }

  async function saveTheme(theme: Theme) {
    user.value = await userApi.updateProfile({ theme })
  }

  async function updateProfile(payload: {
    name?: string
    timezone?: string
    theme?: Theme
    notifyEvents?: boolean
    notifyTasks?: boolean
  }) {
    user.value = await userApi.updateProfile(payload)
    return user.value
  }

  function clearSession() {
    setAccessToken(null)
    user.value = null
  }

  return {
    user,
    initialized,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    bootstrap,
    logout,
    saveTheme,
    updateProfile,
    clearSession,
  }
})
