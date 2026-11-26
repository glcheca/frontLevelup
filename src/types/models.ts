export interface User {
  id: string
  email: string
  name: string
  timezone: string
  locale: string
  theme: 'light' | 'dark' | 'system'
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  name: string
  timezone?: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ClassBlock {
  id: string
  courseId: string
  courseName: string
  courseColor: string
  /** 1 = lunes … 7 = domingo */
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  /** Aviso no bloqueante, solo en creación/edición (p. ej. solapamiento). */
  warning?: string | null
}

export interface Course {
  id: string
  name: string
  code: string | null
  professor: string | null
  color: string
  credits: number | null
  period: string
  archived: boolean
  createdAt: string
  updatedAt: string
  schedule: ClassBlock[]
}

export interface CourseInput {
  name: string
  period: string
  code?: string | null
  professor?: string | null
  color?: string
  credits?: number | null
}

export interface ClassBlockInput {
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string | null
}

export type EventType = 'exam' | 'assignment' | 'class' | 'personal'
export type EventStatus = 'scheduled' | 'done' | 'cancelled'

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  courseId: string | null
  courseName: string | null
  courseColor: string | null
  type: EventType
  startAt: string
  endAt: string
  allDay: boolean
  location: string | null
  status: EventStatus
  createdAt: string
  updatedAt: string
}

export interface EventInput {
  title: string
  type: EventType
  startAt: string
  endAt: string
  description?: string | null
  courseId?: string | null
  allDay?: boolean
  location?: string | null
  status?: EventStatus
}

export type TaskStatus = 'todo' | 'doing' | 'done'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface TaskItem {
  id: string
  title: string
  description: string | null
  courseId: string | null
  courseName: string | null
  courseColor: string | null
  eventId: string | null
  status: TaskStatus
  priority: number
  dueAt: string | null
  completedAt: string | null
  overdue: boolean
  subtasks: Subtask[]
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title: string
  description?: string | null
  courseId?: string | null
  eventId?: string | null
  status?: TaskStatus
  priority?: number
  dueAt?: string | null
  subtasks?: { id?: string; title: string; done?: boolean }[]
}
