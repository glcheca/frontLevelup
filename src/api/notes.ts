import { api } from './client'
import type { Note, NoteInput, NoteSummary, PageResponse } from '@/types/models'

export interface NoteListParams {
  courseId?: string
  tag?: string
  q?: string
  pinned?: boolean
  page?: number
  size?: number
}

export const notesApi = {
  async list(params: NoteListParams = {}): Promise<PageResponse<NoteSummary>> {
    const { data } = await api.get<PageResponse<NoteSummary>>('/notes', { params })
    return data
  },

  async get(id: string): Promise<Note> {
    const { data } = await api.get<Note>(`/notes/${id}`)
    return data
  },

  async create(payload: NoteInput): Promise<Note> {
    const { data } = await api.post<Note>('/notes', payload)
    return data
  },

  async update(id: string, payload: NoteInput): Promise<Note> {
    const { data } = await api.patch<Note>(`/notes/${id}`, payload)
    return data
  },

  async setPinned(id: string, pinned: boolean): Promise<Note> {
    const { data } = await api.patch<Note>(`/notes/${id}/pin`, { pinned })
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/notes/${id}`)
  },

  async tags(): Promise<string[]> {
    const { data } = await api.get<string[]>('/notes/tags')
    return data
  },
}
