import { api } from './client'
import type { User } from '@/types/models'

export interface UpdateProfileRequest {
  name?: string
  timezone?: string
  theme?: 'light' | 'dark' | 'system'
}

export const userApi = {
  async updateProfile(payload: UpdateProfileRequest): Promise<User> {
    const { data } = await api.patch<User>('/me', payload)
    return data
  },
}
