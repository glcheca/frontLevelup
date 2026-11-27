<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { BookOpen, CalendarDays, CheckSquare, GraduationCap, Plus } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { eventsApi } from '@/api/events'
import { gradesApi } from '@/api/grades'
import { keys } from '@/api/keys'
import { tasksApi } from '@/api/tasks'
import { useAuthStore } from '@/stores/auth'
import {
  addDays,
  endOfDay,
  formatDueLabel,
  formatTime,
  isoWeekday,
  shortTime,
  startOfDay,
} from '@/utils/dates'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

const auth = useAuthStore()
const router = useRouter()

const today = computed(() => {
  const formatted = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const scheduleQuery = useQuery({
  queryKey: keys.schedule(),
  queryFn: () => coursesApi.allSchedule(),
})

const coursesQuery = useQuery({
  queryKey: keys.courses({ archived: false }),
  queryFn: () => coursesApi.list({ archived: false, size: 100 }),
})

const tasksQuery = useQuery({
  queryKey: keys.tasks({ dashboard: true }),
  queryFn: () => tasksApi.list({ size: 300 }),
})

const eventsQuery = useQuery({
  queryKey: keys.events({ dashboard: true }),
  queryFn: () =>
    eventsApi.list({
      from: startOfDay(new Date()).toISOString(),
      to: endOfDay(addDays(new Date(), 30)).toISOString(),
      size: 50,
    }),
})

const gradesQuery = useQuery({
  queryKey: keys.gradeSummaries(14),
  queryFn: () => gradesApi.summaries(14),
})

const loading = computed(
  () =>
    scheduleQuery.isLoading.value ||
    coursesQuery.isLoading.value ||
    tasksQuery.isLoading.value ||
    eventsQuery.isLoading.value ||
    gradesQuery.isLoading.value,
)

const courses = computed(() => coursesQuery.data.value?.content ?? [])
const hasCourses = computed(() => courses.value.length > 0)

const todayClasses = computed(() => {
  const weekday = isoWeekday(new Date())
  return (scheduleQuery.data.value ?? [])
    .filter((block) => block.dayOfWeek === weekday)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
})

const weekLimit = endOfDay(addDays(new Date(), 7))
const upcomingTasks = computed(() =>
  (tasksQuery.data.value?.content ?? [])
    .filter((task) => task.status !== 'done' && task.dueAt && new Date(task.dueAt) <= weekLimit)
    .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))
    .slice(0, 5),
)

const upcomingEvents = computed(() =>
  (eventsQuery.data.value?.content ?? [])
    .filter((event) => event.status !== 'cancelled')
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 5),
)

const pendingCount = computed(
  () => (tasksQuery.data.value?.content ?? []).filter((task) => task.status !== 'done').length,
)

const gradedSummaries = computed(() =>
  (gradesQuery.data.value ?? []).filter((summary) => summary.gradedCount > 0),
)

function summaryAverage(value: number | null): string {
  return value === null || value === undefined ? '—' : value.toFixed(1)
}

function summaryPending(value: number): string {
  return Number(value.toFixed(2)).toString()
}
</script>

<template>
  <div class="space-y-6">
    <section>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ today }}</p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight">Hola, {{ auth.user?.name }}</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        <template v-if="hasCourses">
          Tienes {{ todayClasses.length }} clase(s) hoy y {{ pendingCount }} tarea(s) pendiente(s).
        </template>
        <template v-else> Empecemos por crear tu primer curso. </template>
      </p>
    </section>

    <div v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <div v-for="n in 3" :key="n" class="card">
        <SkeletonBlock :lines="4" />
      </div>
    </div>

    <template v-else>
      <EmptyState
        v-if="!hasCourses"
        :icon="BookOpen"
        title="Aún no tienes cursos"
        description="Crea un curso y su horario para ver tus clases del día en este panel."
      >
        <button class="btn-primary mt-2" @click="router.push({ name: 'courses' })">
          <Plus class="size-4" />
          Crear mi primer curso
        </button>
      </EmptyState>

      <div v-else class="grid gap-4 lg:grid-cols-3">
        <section class="card lg:col-span-1">
          <h2 class="flex items-center gap-2 font-medium">
            <CalendarDays class="size-4 text-brand-600" />
            Clases de hoy
          </h2>
          <p v-if="!todayClasses.length" class="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Hoy no tienes clases programadas.
          </p>
          <ul v-else class="mt-3 space-y-2">
            <li
              v-for="block in todayClasses"
              :key="block.id"
              class="flex items-center gap-3 rounded-lg border border-slate-100 p-2 dark:border-slate-800"
            >
              <span
                class="size-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: block.courseColor }"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ block.courseName }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ shortTime(block.startTime) }}–{{ shortTime(block.endTime) }}
                  <template v-if="block.room"> · {{ block.room }}</template>
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section class="card lg:col-span-1">
          <h2 class="flex items-center gap-2 font-medium">
            <CheckSquare class="size-4 text-brand-600" />
            Próximas entregas
          </h2>
          <p v-if="!upcomingTasks.length" class="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Nada que entregar esta semana.
          </p>
          <ul v-else class="mt-3 space-y-2">
            <li v-for="task in upcomingTasks" :key="task.id" class="flex items-center gap-3">
              <span
                class="size-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: task.courseColor ?? '#94a3b8' }"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ task.title }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ task.courseName ?? 'Sin curso' }}
                </p>
              </div>
              <span
                class="shrink-0 text-xs font-medium"
                :class="task.overdue ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'"
              >
                {{ formatDueLabel(task.dueAt) }}
              </span>
            </li>
          </ul>
          <button class="btn-ghost mt-3 w-full" @click="router.push({ name: 'tasks' })">
            Ver todas las tareas
          </button>
        </section>

        <section class="card lg:col-span-1">
          <h2 class="flex items-center gap-2 font-medium">
            <CalendarDays class="size-4 text-brand-600" />
            Próximos eventos
          </h2>
          <p v-if="!upcomingEvents.length" class="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No hay eventos en los próximos 30 días.
          </p>
          <ul v-else class="mt-3 space-y-2">
            <li v-for="event in upcomingEvents" :key="event.id" class="flex items-center gap-3">
              <span
                class="size-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: event.courseColor ?? '#94a3b8' }"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ event.title }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ event.courseName ?? 'Personal' }}
                </p>
              </div>
              <span class="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                {{ event.allDay ? 'Todo el día' : formatTime(event.startAt) }}
              </span>
            </li>
          </ul>
          <button class="btn-ghost mt-3 w-full" @click="router.push({ name: 'calendar' })">
            Abrir calendario
          </button>
        </section>
      </div>

      <section class="card">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="flex items-center gap-2 font-medium">
            <GraduationCap class="size-4 text-brand-600" />
            Promedio del semestre
          </h2>
          <button class="btn-ghost" @click="router.push({ name: 'grades' })">Ver notas</button>
        </div>

        <p v-if="!gradedSummaries.length" class="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Añade evaluaciones en tus cursos para ver tu promedio ponderado.
        </p>

        <ul v-else class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="summary in gradedSummaries"
            :key="summary.courseId"
            class="flex items-center gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800"
          >
            <span
              class="size-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: summary.courseColor }"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ summary.courseName }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Pendiente {{ summaryPending(summary.totalWeightPending) }}%
              </p>
            </div>
            <span class="shrink-0 text-lg font-semibold">
              {{ summaryAverage(summary.average20) }}
              <span class="text-xs font-normal text-slate-400">/ 20</span>
            </span>
          </li>
        </ul>
      </section>

      <section class="grid gap-4 sm:grid-cols-3">
        <button
          class="card text-left transition hover:border-brand-400"
          @click="router.push({ name: 'courses' })"
        >
          <p class="text-sm text-slate-500 dark:text-slate-400">Cursos activos</p>
          <p class="mt-1 text-2xl font-semibold">{{ courses.length }}</p>
        </button>
        <button
          class="card text-left transition hover:border-brand-400"
          @click="router.push({ name: 'tasks' })"
        >
          <p class="text-sm text-slate-500 dark:text-slate-400">Tareas pendientes</p>
          <p class="mt-1 text-2xl font-semibold">{{ pendingCount }}</p>
        </button>
        <button
          class="card text-left transition hover:border-brand-400"
          @click="router.push({ name: 'events' })"
        >
          <p class="text-sm text-slate-500 dark:text-slate-400">Eventos (30 días)</p>
          <p class="mt-1 text-2xl font-semibold">
            {{ eventsQuery.data.value?.totalElements ?? 0 }}
          </p>
        </button>
      </section>
    </template>
  </div>
</template>
