import { api } from './client'
import type { User } from '@/types/models'

export interface UpdateProfileRequest {
  name?: string
  timezone?: string
  theme?: 'light' | 'dark' | 'system'
  notifyEvents?: boolean
  notifyTasks?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const userApi = {
  async updateProfile(payload: UpdateProfileRequest): Promise<User> {
    const { data } = await api.patch<User>('/me', payload)
    return data
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await api.post('/me/password', payload)
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/me')
  },
}
