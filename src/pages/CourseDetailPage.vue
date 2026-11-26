<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarPlus, CheckSquare, Plus } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { eventsApi } from '@/api/events'
import { invalidateTasks, keys } from '@/api/keys'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'
import type { CalendarEvent, TaskItem } from '@/types/models'
import { formatDateTime } from '@/utils/dates'
import ScheduleEditor from '@/components/courses/ScheduleEditor.vue'
import EventFormModal from '@/components/events/EventFormModal.vue'
import TaskFormModal from '@/components/tasks/TaskFormModal.vue'
import TaskRow from '@/components/tasks/TaskRow.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const queryClient = useQueryClient()

const courseId = computed(() => String(route.params.id))
const tab = ref<'schedule' | 'events' | 'tasks' | 'notes' | 'grades'>('schedule')

const courseQuery = useQuery({
  queryKey: computed(() => keys.course(courseId.value)),
  queryFn: () => coursesApi.get(courseId.value),
})

const eventsQuery = useQuery({
  queryKey: computed(() => keys.events({ courseId: courseId.value })),
  queryFn: () => eventsApi.list({ courseId: courseId.value, size: 100 }),
})

const tasksQuery = useQuery({
  queryKey: computed(() => keys.tasks({ courseId: courseId.value })),
  queryFn: () => tasksApi.list({ courseId: courseId.value, size: 100 }),
})

const tasks = computed(() => tasksQuery.data.value?.content ?? [])
const events = computed(() => eventsQuery.data.value?.content ?? [])

const eventFormOpen = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const taskFormOpen = ref(false)
const editingTask = ref<TaskItem | null>(null)

const completeMutation = useMutation({
  mutationFn: ({ task, done }: { task: TaskItem; done: boolean }) =>
    done
      ? tasksApi.complete(task.id)
      : tasksApi.update(task.id, {
          title: task.title,
          description: task.description,
          courseId: task.courseId,
          eventId: task.eventId,
          status: 'todo',
          priority: task.priority,
          dueAt: task.dueAt,
          subtasks: task.subtasks,
        }),
  onSuccess: async () => {
    await invalidateTasks(queryClient)
  },
  onError: (error) => toast.error(error, 'No se pudo actualizar la tarea.'),
})

const deleteTaskMutation = useMutation({
  mutationFn: (taskId: string) => tasksApi.remove(taskId),
  onSuccess: async () => {
    await invalidateTasks(queryClient)
    toast.success('Tarea eliminada.')
  },
  onError: (error) => toast.error(error, 'No se pudo eliminar la tarea.'),
})

const deleteEventMutation = useMutation({
  mutationFn: (eventId: string) => eventsApi.remove(eventId),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['events'] })
    toast.success('Evento eliminado.')
  },
  onError: (error) => toast.error(error, 'No se pudo eliminar el evento.'),
})

const tabs = [
  { id: 'schedule', label: 'Horario' },
  { id: 'events', label: 'Eventos' },
  { id: 'tasks', label: 'Tareas' },
  { id: 'notes', label: 'Apuntes' },
  { id: 'grades', label: 'Notas' },
] as const

const courses = computed(() => (courseQuery.data.value ? [courseQuery.data.value] : []))
</script>

<template>
  <div class="space-y-5">
    <button class="btn-ghost -ml-2" @click="router.push({ name: 'courses' })">
      <ArrowLeft class="size-4" />
      Cursos
    </button>

    <div v-if="courseQuery.isLoading.value" class="card">
      <SkeletonBlock :lines="3" />
    </div>

    <div v-else-if="!courseQuery.data.value" class="card text-sm text-rose-600">
      No se encontró el curso.
    </div>

    <template v-else>
      <header class="card">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <span
              class="mt-1.5 size-3.5 shrink-0 rounded-full"
              :style="{ backgroundColor: courseQuery.data.value.color }"
            />
            <div>
              <h1 class="text-2xl font-semibold tracking-tight">
                {{ courseQuery.data.value.name }}
              </h1>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {{ courseQuery.data.value.period }}
                <template v-if="courseQuery.data.value.code">
                  · {{ courseQuery.data.value.code }}
                </template>
                <template v-if="courseQuery.data.value.credits !== null">
                  · {{ courseQuery.data.value.credits }} créditos
                </template>
                <template v-if="courseQuery.data.value.professor">
                  · {{ courseQuery.data.value.professor }}
                </template>
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn-ghost" @click="((tab = 'events'), (eventFormOpen = true))">
              <CalendarPlus class="size-4" />
              Evento
            </button>
            <button class="btn-primary" @click="((tab = 'tasks'), (taskFormOpen = true))">
              <Plus class="size-4" />
              Tarea
            </button>
          </div>
        </div>
      </header>

      <nav class="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        <button
          v-for="item in tabs"
          :key="item.id"
          class="whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition"
          :class="
            tab === item.id
              ? 'border-brand-600 text-brand-700 dark:text-brand-300'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          "
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
      </nav>

      <section v-if="tab === 'schedule'">
        <ScheduleEditor :course-id="courseId" :blocks="courseQuery.data.value.schedule" />
      </section>

      <section v-else-if="tab === 'events'" class="space-y-3">
        <p v-if="!events.length" class="card text-sm text-slate-500 dark:text-slate-400">
          Este curso todavía no tiene eventos.
        </p>
        <ul v-else class="card divide-y divide-slate-100 dark:divide-slate-800">
          <li
            v-for="event in events"
            :key="event.id"
            class="flex items-center justify-between gap-3 py-3"
          >
            <div class="min-w-0">
              <p class="truncate font-medium">{{ event.title }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ formatDateTime(event.startAt) }} · {{ event.type }}
              </p>
            </div>
            <div class="flex gap-1">
              <button
                class="btn-ghost size-8 p-0"
                aria-label="Editar evento"
                @click="((editingEvent = event), (eventFormOpen = true))"
              >
                Editar
              </button>
              <button
                class="btn-ghost size-8 p-0 text-rose-600"
                aria-label="Borrar evento"
                @click="deleteEventMutation.mutate(event.id)"
              >
                Borrar
              </button>
            </div>
          </li>
        </ul>
      </section>

      <section v-else-if="tab === 'tasks'" class="space-y-3">
        <EmptyState
          v-if="!tasks.length"
          :icon="CheckSquare"
          title="Sin tareas para este curso"
          description="Añade una tarea con su fecha de entrega."
        />
        <ul v-else class="card divide-y divide-slate-100 dark:divide-slate-800">
          <TaskRow
            v-for="task in tasks"
            :key="task.id"
            :task="task"
            @complete="(done) => completeMutation.mutate({ task, done })"
            @edit="((editingTask = task), (taskFormOpen = true))"
            @remove="deleteTaskMutation.mutate(task.id)"
          />
        </ul>
      </section>

      <section
        v-else
        class="card border-dashed text-center text-sm text-slate-500 dark:text-slate-400"
      >
        {{
          tab === 'notes' ? 'Los apuntes llegan en la Etapa 2.' : 'Las notas llegan en la Etapa 2.'
        }}
      </section>
    </template>

    <TaskFormModal
      :open="taskFormOpen"
      :task="editingTask"
      :courses="courses"
      @close="((taskFormOpen = false), (editingTask = null))"
    />
    <EventFormModal
      :open="eventFormOpen"
      :event="editingEvent"
      :courses="courses"
      @close="((eventFormOpen = false), (editingEvent = null))"
    />
  </div>
</template>
