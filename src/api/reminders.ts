import { api } from './client'
import type { Reminder, ReminderInput, ReminderStatus } from '@/types/models'

export const remindersApi = {
  async list(status?: ReminderStatus): Promise<Reminder[]> {
    const { data } = await api.get<Reminder[]>('/reminders', { params: status ? { status } : {} })
    return data
  },

  async create(payload: ReminderInput): Promise<Reminder> {
    const { data } = await api.post<Reminder>('/reminders', payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`)
  },
}
