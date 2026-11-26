import type { QueryClient } from '@tanstack/vue-query'

/**
 * Claves de caché. Cursos, horario, eventos y tareas comparten datos (color y nombre del curso),
 * así que al mutar un curso se invalidan todos para que las vistas se actualicen sin recargar.
 */
export const keys = {
  courses: (params: Record<string, unknown> = {}) => ['courses', params] as const,
  course: (id: string) => ['course', id] as const,
  schedule: () => ['schedule'] as const,
  events: (params: Record<string, unknown> = {}) => ['events', params] as const,
  tasks: (params: Record<string, unknown> = {}) => ['tasks', params] as const,
}

export async function invalidateCourses(client: QueryClient, courseId?: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['courses'] }),
    client.invalidateQueries({ queryKey: ['schedule'] }),
    client.invalidateQueries({ queryKey: ['events'] }),
    client.invalidateQueries({ queryKey: ['tasks'] }),
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
