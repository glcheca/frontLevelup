import { api } from './client'
import type { ClassBlock, ClassBlockInput, Course, CourseInput, PageResponse } from '@/types/models'

export interface CourseListParams {
  archived?: boolean
  page?: number
  size?: number
}

export const coursesApi = {
  async list(params: CourseListParams = {}): Promise<PageResponse<Course>> {
    const { data } = await api.get<PageResponse<Course>>('/courses', { params })
    return data
  },

  async get(id: string): Promise<Course> {
    const { data } = await api.get<Course>(`/courses/${id}`)
    return data
  },

  async create(payload: CourseInput): Promise<Course> {
    const { data } = await api.post<Course>('/courses', payload)
    return data
  },

  async update(id: string, payload: Partial<CourseInput>): Promise<Course> {
    const { data } = await api.patch<Course>(`/courses/${id}`, payload)
    return data
  },

  async setArchived(id: string, archived: boolean): Promise<Course> {
    const { data } = await api.patch<Course>(`/courses/${id}/archive`, { archived })
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/courses/${id}`)
  },

  async schedule(id: string): Promise<ClassBlock[]> {
    const { data } = await api.get<ClassBlock[]>(`/courses/${id}/schedule`)
    return data
  },

  async allSchedule(): Promise<ClassBlock[]> {
    const { data } = await api.get<ClassBlock[]>('/schedule')
    return data
  },

  async createBlock(courseId: string, payload: ClassBlockInput): Promise<ClassBlock> {
    const { data } = await api.post<ClassBlock>(`/courses/${courseId}/schedule`, payload)
    return data
  },

  async updateBlock(blockId: string, payload: ClassBlockInput): Promise<ClassBlock> {
    const { data } = await api.patch<ClassBlock>(`/schedule/${blockId}`, payload)
    return data
  },

  async removeBlock(blockId: string): Promise<void> {
    await api.delete(`/schedule/${blockId}`)
  },
}
