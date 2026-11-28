<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarPlus, CheckSquare, Plus } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { eventsApi } from '@/api/events'
import { invalidateTasks, keys } from '@/api/keys'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'
import { useNewShortcut } from '@/composables/useNewShortcut'
import type { CalendarEvent, TaskItem } from '@/types/models'
import { formatDateTime } from '@/utils/dates'
import ScheduleEditor from '@/components/courses/ScheduleEditor.vue'
import EventFormModal from '@/components/events/EventFormModal.vue'
import GradesPanel from '@/components/grades/GradesPanel.vue'
import NotesPanel from '@/components/notes/NotesPanel.vue'
import TaskFormModal from '@/components/tasks/TaskFormModal.vue'
import TaskRow from '@/components/tasks/TaskRow.vue'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const queryClient = useQueryClient()

const courseId = computed(() => String(route.params.id))

const tabIds = ['schedule', 'events', 'tasks', 'notes', 'grades'] as const
type TabId = (typeof tabIds)[number]

function isTabId(value: unknown): value is TabId {
  return typeof value === 'string' && (tabIds as readonly string[]).includes(value)
}

const initialTab = route.query.tab
const tab = ref<TabId>(isTabId(initialTab) ? initialTab : 'schedule')

watch(tab, (value) => {
  void router.replace({ query: { ...route.query, tab: value } })
})

watch(
  () => route.query.tab,
  (value) => {
    if (isTabId(value) && value !== tab.value) {
      tab.value = value
    }
  },
)

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
const pendingDeleteEvent = ref<CalendarEvent | null>(null)
const pendingDeleteTask = ref<TaskItem | null>(null)

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
          reminderOffsetMinutes: task.reminderOffsetMinutes,
        }),
  onSuccess: async () => {
    await invalidateTasks(queryClient)
  },
  onError: (error) => toast.error(error, 'No se pudo actualizar la tarea.'),
})

const deleteTaskMutation = useMutation({
  mutationFn: (taskId: string) => tasksApi.remove(taskId),
  onSuccess: async () => {
    pendingDeleteTask.value = null
    await invalidateTasks(queryClient)
    toast.success('Tarea eliminada.')
  },
  onError: (error) => toast.error(error, 'No se pudo eliminar la tarea.'),
})

const deleteEventMutation = useMutation({
  mutationFn: (eventId: string) => eventsApi.remove(eventId),
  onSuccess: async () => {
    pendingDeleteEvent.value = null
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

useNewShortcut(() => {
  if (tab.value === 'events') {
    editingEvent.value = null
    eventFormOpen.value = true
  } else if (tab.value === 'tasks') {
    editingTask.value = null
    taskFormOpen.value = true
  } else if (tab.value === 'notes' || tab.value === 'grades') {
    return
  } else {
    tab.value = 'tasks'
    editingTask.value = null
    taskFormOpen.value = true
  }
})
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

    <div v-else-if="courseQuery.isError.value" class="card text-sm text-rose-600">
      No se pudo cargar el curso.
      <button class="btn-ghost mt-2" @click="courseQuery.refetch()">Reintentar</button>
    </div>

    <div v-else-if="!courseQuery.data.value" class="card text-sm text-rose-600">
      No se encontró el curso.
      <button class="btn-ghost mt-2" @click="router.push({ name: 'courses' })">
        Volver a cursos
      </button>
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
                @click="pendingDeleteEvent = event"
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
            @remove="pendingDeleteTask = task"
          />
        </ul>
      </section>

      <section v-else-if="tab === 'notes'">
        <NotesPanel :course-id="courseId" embedded />
      </section>

      <section v-else>
        <GradesPanel :course-id="courseId" />
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

    <AppModal
      :open="Boolean(pendingDeleteEvent)"
      title="Borrar evento"
      @close="pendingDeleteEvent = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        “{{ pendingDeleteEvent?.title }}” se borrará junto con su recordatorio pendiente.
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <button class="btn-ghost" @click="pendingDeleteEvent = null">Cancelar</button>
        <button
          class="btn-primary bg-rose-600 hover:bg-rose-700"
          :disabled="deleteEventMutation.isPending.value"
          @click="pendingDeleteEvent && deleteEventMutation.mutate(pendingDeleteEvent.id)"
        >
          Borrar evento
        </button>
      </div>
    </AppModal>

    <AppModal
      :open="Boolean(pendingDeleteTask)"
      title="Borrar tarea"
      @close="pendingDeleteTask = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        “{{ pendingDeleteTask?.title }}” se borrará junto con su recordatorio pendiente.
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <button class="btn-ghost" @click="pendingDeleteTask = null">Cancelar</button>
        <button
          class="btn-primary bg-rose-600 hover:bg-rose-700"
          :disabled="deleteTaskMutation.isPending.value"
          @click="pendingDeleteTask && deleteTaskMutation.mutate(pendingDeleteTask.id)"
        >
          Borrar tarea
        </button>
      </div>
    </AppModal>
  </div>
</template>
