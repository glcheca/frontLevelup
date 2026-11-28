<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import { CheckSquare, Plus } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { keys } from '@/api/keys'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'
import type { PageResponse, TaskItem } from '@/types/models'
import { addDays, dayKey, endOfDay } from '@/utils/dates'
import TaskFormModal from '@/components/tasks/TaskFormModal.vue'
import TaskRow from '@/components/tasks/TaskRow.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

const toast = useToast()
const queryClient = useQueryClient()
const route = useRoute()

const LIST_KEY = ['tasks', { page: 'tasks' }] as const

const statusFilter = ref<'all' | 'todo' | 'doing' | 'done'>('all')
const courseFilter = ref('')
const priorityFilter = ref<'all' | '0' | '1' | '2'>('all')

const formOpen = ref(false)
const editing = ref<TaskItem | null>(null)

onMounted(() => {
  if (route.query.new === '1') {
    formOpen.value = true
  }
})

const tasksQuery = useQuery({
  queryKey: LIST_KEY,
  queryFn: () => tasksApi.list({ size: 300 }),
})

const coursesQuery = useQuery({
  queryKey: keys.courses({ archived: false }),
  queryFn: () => coursesApi.list({ archived: false, size: 100 }),
})

const courses = computed(() => coursesQuery.data.value?.content ?? [])
const allTasks = computed(() => tasksQuery.data.value?.content ?? [])

const filtered = computed(() =>
  allTasks.value.filter((task) => {
    if (statusFilter.value !== 'all' && task.status !== statusFilter.value) return false
    if (courseFilter.value && task.courseId !== courseFilter.value) return false
    if (priorityFilter.value !== 'all' && task.priority !== Number(priorityFilter.value))
      return false
    return true
  }),
)

const groups = computed(() => {
  const week = endOfDay(addDays(new Date(), 7))
  const buckets: { id: string; label: string; tasks: TaskItem[] }[] = [
    { id: 'overdue', label: 'Vencidas', tasks: [] },
    { id: 'today', label: 'Hoy', tasks: [] },
    { id: 'week', label: 'Esta semana', tasks: [] },
    { id: 'later', label: 'Más adelante', tasks: [] },
    { id: 'done', label: 'Hechas', tasks: [] },
  ]
  const byId = new Map(buckets.map((bucket) => [bucket.id, bucket]))

  for (const task of filtered.value) {
    if (task.status === 'done') {
      byId.get('done')!.tasks.push(task)
      continue
    }
    if (!task.dueAt) {
      byId.get('later')!.tasks.push(task)
      continue
    }
    const due = new Date(task.dueAt)
    if (task.overdue) byId.get('overdue')!.tasks.push(task)
    else if (dayKey(due) === dayKey(new Date())) byId.get('today')!.tasks.push(task)
    else if (due <= week) byId.get('week')!.tasks.push(task)
    else byId.get('later')!.tasks.push(task)
  }
  return buckets.filter((bucket) => bucket.tasks.length)
})

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
  onMutate: async ({ task, done }) => {
    await queryClient.cancelQueries({ queryKey: LIST_KEY })
    const previous = queryClient.getQueryData<PageResponse<TaskItem>>(LIST_KEY)
    if (previous) {
      queryClient.setQueryData<PageResponse<TaskItem>>(LIST_KEY, {
        ...previous,
        content: previous.content.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: done ? 'done' : 'todo',
                overdue: done ? false : item.overdue,
                completedAt: done ? new Date().toISOString() : null,
              }
            : item,
        ),
      })
    }
    return { previous }
  },
  onError: (error, _variables, context) => {
    if (context?.previous) queryClient.setQueryData(LIST_KEY, context.previous)
    toast.error(error, 'No se pudo actualizar la tarea.')
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
})

const deleteMutation = useMutation({
  mutationFn: (taskId: string) => tasksApi.remove(taskId),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    toast.success('Tarea eliminada.')
  },
  onError: (error) => toast.error(error, 'No se pudo eliminar la tarea.'),
})
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Tareas</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ allTasks.filter((task) => task.status !== 'done').length }}
          pendientes de {{ allTasks.length }}
        </p>
      </div>
      <button class="btn-primary" @click="((editing = null), (formOpen = true))">
        <Plus class="size-4" />
        Nueva tarea
      </button>
    </header>

    <div class="card grid gap-3 sm:grid-cols-3">
      <label class="block">
        <span class="text-xs text-slate-500 dark:text-slate-400">Estado</span>
        <select v-model="statusFilter" class="input mt-1">
          <option value="all">Todas</option>
          <option value="todo">Pendientes</option>
          <option value="doing">En curso</option>
          <option value="done">Hechas</option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-slate-500 dark:text-slate-400">Curso</span>
        <select v-model="courseFilter" class="input mt-1">
          <option value="">Todos</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-slate-500 dark:text-slate-400">Prioridad</span>
        <select v-model="priorityFilter" class="input mt-1">
          <option value="all">Todas</option>
          <option value="2">Alta</option>
          <option value="1">Media</option>
          <option value="0">Baja</option>
        </select>
      </label>
    </div>

    <div v-if="tasksQuery.isLoading.value" class="card">
      <SkeletonBlock :lines="5" />
    </div>

    <div v-else-if="tasksQuery.isError.value" class="card text-sm text-rose-600">
      No se pudieron cargar las tareas.
      <button class="btn-ghost mt-2" @click="tasksQuery.refetch()">Reintentar</button>
    </div>

    <EmptyState
      v-else-if="!groups.length"
      :icon="CheckSquare"
      title="Nada por aquí"
      description="Crea una tarea o cambia los filtros para ver otras."
    />

    <section v-for="group in groups" :key="group.id" class="card">
      <h2 class="text-sm font-semibold tracking-tight">
        {{ group.label }}
        <span class="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
          ({{ group.tasks.length }})
        </span>
      </h2>
      <ul class="mt-1 divide-y divide-slate-100 dark:divide-slate-800">
        <TaskRow
          v-for="task in group.tasks"
          :key="task.id"
          :task="task"
          :busy="completeMutation.isPending.value"
          @complete="(done) => completeMutation.mutate({ task, done })"
          @edit="((editing = task), (formOpen = true))"
          @remove="deleteMutation.mutate(task.id)"
        />
      </ul>
    </section>

    <TaskFormModal
      :open="formOpen"
      :task="editing"
      :courses="courses"
      @close="((formOpen = false), (editing = null))"
    />
  </div>
</template>
