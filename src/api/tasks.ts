import { api } from './client'
import type { PageResponse, TaskInput, TaskItem, TaskStatus } from '@/types/models'

export interface TaskListParams {
  status?: TaskStatus
  courseId?: string
  dueBefore?: string
  page?: number
  size?: number
}

export const tasksApi = {
  async list(params: TaskListParams = {}): Promise<PageResponse<TaskItem>> {
    const { data } = await api.get<PageResponse<TaskItem>>('/tasks', { params })
    return data
  },

  async create(payload: TaskInput): Promise<TaskItem> {
    const { data } = await api.post<TaskItem>('/tasks', payload)
    return data
  },

  async update(id: string, payload: TaskInput): Promise<TaskItem> {
    const { data } = await api.patch<TaskItem>(`/tasks/${id}`, payload)
    return data
  },

  async complete(id: string): Promise<TaskItem> {
    const { data } = await api.patch<TaskItem>(`/tasks/${id}/complete`)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`)
  },
}
