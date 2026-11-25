import { api } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/models'

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    return data
  },

  async refresh(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh')
    return data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/me')
    return data
  },
}
