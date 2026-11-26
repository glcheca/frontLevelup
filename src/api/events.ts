import { api } from './client'
import type { CalendarEvent, EventInput, EventType, PageResponse } from '@/types/models'

export interface EventListParams {
  from?: string
  to?: string
  courseId?: string
  type?: EventType
  page?: number
  size?: number
}

export const eventsApi = {
  async list(params: EventListParams = {}): Promise<PageResponse<CalendarEvent>> {
    const { data } = await api.get<PageResponse<CalendarEvent>>('/events', { params })
    return data
  },

  async create(payload: EventInput): Promise<CalendarEvent> {
    const { data } = await api.post<CalendarEvent>('/events', payload)
    return data
  },

  async update(id: string, payload: EventInput): Promise<CalendarEvent> {
    const { data } = await api.patch<CalendarEvent>(`/events/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/events/${id}`)
  },
}
