import type { QueryClient } from '@tanstack/vue-query'

/**
 * Claves de caché. Cursos, horario, eventos, tareas, apuntes y notas comparten datos (color y
 * nombre del curso), así que al mutar un curso se invalidan todos para que las vistas se
 * actualicen sin recargar.
 */
export const keys = {
  courses: (params: Record<string, unknown> = {}) => ['courses', params] as const,
  course: (id: string) => ['course', id] as const,
  schedule: () => ['schedule'] as const,
  events: (params: Record<string, unknown> = {}) => ['events', params] as const,
  tasks: (params: Record<string, unknown> = {}) => ['tasks', params] as const,
  notes: (params: Record<string, unknown> = {}) => ['notes', params] as const,
  note: (id: string) => ['note', id] as const,
  noteTags: () => ['note-tags'] as const,
  grades: (courseId: string) => ['grades', courseId] as const,
  gradeSummary: (courseId: string, target: number) => ['grade-summary', courseId, target] as const,
  gradeSummaries: (target: number) => ['grade-summaries', target] as const,
}

export async function invalidateCourses(client: QueryClient, courseId?: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['courses'] }),
    client.invalidateQueries({ queryKey: ['schedule'] }),
    client.invalidateQueries({ queryKey: ['events'] }),
    client.invalidateQueries({ queryKey: ['tasks'] }),
    client.invalidateQueries({ queryKey: ['notes'] }),
    client.invalidateQueries({ queryKey: ['grade-summaries'] }),
    ...(courseId ? [client.invalidateQueries({ queryKey: keys.course(courseId) })] : []),
  ])
}

export async function invalidateEvents(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['events'] }),
    client.invalidateQueries({ queryKey: ['tasks'] }),
  ])
}

export async function invalidateTasks(client: QueryClient) {
  await client.invalidateQueries({ queryKey: ['tasks'] })
}

export async function invalidateNotes(client: QueryClient, noteId?: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['notes'] }),
    client.invalidateQueries({ queryKey: ['note-tags'] }),
    ...(noteId ? [client.invalidateQueries({ queryKey: keys.note(noteId) })] : []),
  ])
}

export async function invalidateGrades(client: QueryClient, courseId: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['grades', courseId] }),
    client.invalidateQueries({ queryKey: ['grade-summary'] }),
    client.invalidateQueries({ queryKey: ['grade-summaries'] }),
  ])
}
