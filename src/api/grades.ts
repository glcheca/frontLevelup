import { api } from './client'
import type { Assessment, AssessmentInput, GradeSummary } from '@/types/models'

/** El backend omite los campos nulos; aquí se normalizan para que la UI los trate igual. */
function normalize(assessment: Assessment): Assessment {
  return {
    ...assessment,
    score: assessment.score ?? null,
    percentage: assessment.percentage ?? null,
    dueAt: assessment.dueAt ?? null,
    notes: assessment.notes ?? null,
  }
}

function normalizeSummary(summary: GradeSummary): GradeSummary {
  return {
    ...summary,
    weightedAverage: summary.weightedAverage ?? null,
    average20: summary.average20 ?? null,
    neededFor: summary.neededFor ?? null,
  }
}

export const gradesApi = {
  async list(courseId: string): Promise<Assessment[]> {
    const { data } = await api.get<Assessment[]>(`/courses/${courseId}/grades`)
    return data.map(normalize)
  },

  async create(courseId: string, payload: AssessmentInput): Promise<Assessment> {
    const { data } = await api.post<Assessment>(`/courses/${courseId}/grades`, payload)
    return normalize(data)
  },

  async update(id: string, payload: AssessmentInput): Promise<Assessment> {
    const { data } = await api.patch<Assessment>(`/grades/${id}`, payload)
    return normalize(data)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/grades/${id}`)
  },

  async summary(courseId: string, target?: number): Promise<GradeSummary> {
    const { data } = await api.get<GradeSummary>(`/courses/${courseId}/grades/summary`, {
      params: target === undefined ? {} : { target },
    })
    return normalizeSummary(data)
  },

  async summaries(target?: number): Promise<GradeSummary[]> {
    const { data } = await api.get<GradeSummary[]>('/grades/summary', {
      params: target === undefined ? {} : { target },
    })
    return data.map(normalizeSummary)
  },
}
