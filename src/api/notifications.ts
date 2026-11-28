import { api } from './client'
import type { AppNotification, PageResponse } from '@/types/models'

export interface NotificationListParams {
  unreadOnly?: boolean
  page?: number
  size?: number
}

export const notificationsApi = {
  async list(params: NotificationListParams = {}): Promise<PageResponse<AppNotification>> {
    const { data } = await api.get<PageResponse<AppNotification>>('/notifications', { params })
    return data
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<{ unread: number }>('/notifications/unread-count')
    return data.unread
  },

  async markRead(id: string): Promise<AppNotification> {
    const { data } = await api.patch<AppNotification>(`/notifications/${id}/read`)
    return data
  },

  async markAllRead(): Promise<number> {
    const { data } = await api.patch<{ unread: number }>('/notifications/read-all')
    return data.unread
  },
}
