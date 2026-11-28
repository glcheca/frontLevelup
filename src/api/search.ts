import { api } from './client'
import type { SearchResponse } from '@/types/models'

export const searchApi = {
  async search(q: string): Promise<SearchResponse> {
    const { data } = await api.get<SearchResponse>('/search', { params: { q } })
    return data
  },
}
