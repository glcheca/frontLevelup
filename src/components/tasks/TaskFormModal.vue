<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { Plus, Trash2 } from 'lucide-vue-next'
import { z } from 'zod'
import { invalidateTasks } from '@/api/keys'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'
import type { Course, TaskItem, TaskStatus } from '@/types/models'
import { isoToLocalInput, localInputToIso } from '@/utils/dates'
import { REMINDER_OFFSETS } from '@/utils/relative'
import AppModal from '@/components/ui/AppModal.vue'

const props = defineProps<{
  open: boolean
  task?: TaskItem | null
  courses: Course[]
  defaultDue?: string | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const toast = useToast()
const queryClient = useQueryClient()

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio')
    .max(160, 'El título no puede superar los 160 caracteres'),
})

const form = reactive({
  title: '',
  description: '',
  courseId: '',
  status: 'todo' as TaskStatus,
  priority: 1,
  dueAt: '',
  subtasks: [] as { id?: string; title: string; done: boolean }[],
  reminderOffsetMinutes: 1440 as number | null,
})

const errors = ref<Record<string, string>>({})
const newSubtask = ref('')
const isEditing = computed(() => Boolean(props.task))

watch(
  () => [props.open, props.task] as const,
  ([open, task]) => {
    if (!open) return
    errors.value = {}
    newSubtask.value = ''
    if (task) {
      form.title = task.title
      form.description = task.description ?? ''
      form.courseId = task.courseId ?? ''
      form.status = task.status
      form.priority = task.priority
      form.dueAt = task.dueAt ? isoToLocalInput(task.dueAt) : ''
      form.subtasks = task.subtasks.map((subtask) => ({ ...subtask }))
      form.reminderOffsetMinutes = task.reminderOffsetMinutes ?? null
    } else {
      form.title = ''
      form.description = ''
      form.courseId = ''
      form.status = 'todo'
      form.priority = 1
      form.dueAt = props.defaultDue ? isoToLocalInput(props.defaultDue) : ''
      form.subtasks = []
      form.reminderOffsetMinutes = 1440
    }
  },
  { immediate: true },
)

const mutation = useMutation({
  mutationFn: async () => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      courseId: form.courseId || null,
      status: form.status,
      priority: form.priority,
      dueAt: form.dueAt ? localInputToIso(form.dueAt) : null,
      subtasks: form.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        done: subtask.done,
      })),
      reminderOffsetMinutes: form.reminderOffsetMinutes,
    }
    return props.task ? tasksApi.update(props.task.id, payload) : tasksApi.create(payload)
  },
  onSuccess: async () => {
    await invalidateTasks(queryClient)
    toast.success(isEditing.value ? 'Tarea actualizada.' : 'Tarea creada.')
    emit('saved')
    emit('close')
  },
  onError: (error) => toast.error(error, 'No se pudo guardar la tarea.'),
})

function addSubtask() {
  const title = newSubtask.value.trim()
  if (!title) return
  form.subtasks.push({ title, done: false })
  newSubtask.value = ''
}

function submit() {
  const parsed = schema.safeParse(form)
  if (!parsed.success) {
    errors.value = Object.fromEntries(
      parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    )
    return
  }
  errors.value = {}
  mutation.mutate()
}
</script>

<template>
  <AppModal
    :open="open"
    :title="isEditing ? 'Editar tarea' : 'Nueva tarea'"
    wide
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="text-sm font-medium">Título</span>
        <input v-model="form.title" class="input mt-1" placeholder="Informe de laboratorio" />
        <span v-if="errors.title" class="mt-1 block text-xs text-rose-600">{{ errors.title }}</span>
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">Curso</span>
          <select v-model="form.courseId" class="input mt-1">
            <option value="">Sin curso</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Vence</span>
          <input v-model="form.dueAt" type="datetime-local" class="input mt-1" />
        </label>

        <label class="block">
          <span class="text-sm font-medium">Estado</span>
          <select v-model="form.status" class="input mt-1">
            <option value="todo">Pendiente</option>
            <option value="doing">En curso</option>
            <option value="done">Hecha</option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Prioridad</span>
          <select v-model.number="form.priority" class="input mt-1">
            <option :value="0">Baja</option>
            <option :value="1">Media</option>
            <option :value="2">Alta</option>
          </select>
        </label>

        <label class="block sm:col-span-2">
          <span class="text-sm font-medium">Aviso</span>
          <select v-model="form.reminderOffsetMinutes" class="input mt-1">
            <option
              v-for="option in REMINDER_OFFSETS"
              :key="String(option.value)"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>

      <label class="block">
        <span class="text-sm font-medium">Notas</span>
        <textarea v-model="form.description" class="input mt-1" rows="2" />
      </label>

      <div>
        <span class="text-sm font-medium">Subtareas</span>
        <ul v-if="form.subtasks.length" class="mt-2 space-y-2">
          <li
            v-for="(subtask, index) in form.subtasks"
            :key="index"
            class="flex items-center gap-2"
          >
            <input v-model="subtask.done" type="checkbox" class="size-4 accent-brand-600" />
            <input v-model="subtask.title" class="input flex-1" />
            <button
              type="button"
              class="btn-ghost size-8 p-0 text-rose-600"
              aria-label="Quitar subtarea"
              @click="form.subtasks.splice(index, 1)"
            >
              <Trash2 class="size-4" />
            </button>
          </li>
        </ul>
        <div class="mt-2 flex gap-2">
          <input
            v-model="newSubtask"
            class="input flex-1"
            placeholder="Añadir subtarea"
            @keydown.enter.prevent="addSubtask"
          />
          <button type="button" class="btn-ghost" @click="addSubtask">
            <Plus class="size-4" />
          </button>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="mutation.isPending.value">
          {{
            mutation.isPending.value ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear tarea'
          }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
