<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'
import { eventsApi } from '@/api/events'
import { invalidateEvents } from '@/api/keys'
import { useToast } from '@/composables/useToast'
import type { CalendarEvent, Course, EventStatus, EventType } from '@/types/models'
import {
  dateInputToIso,
  endOfDay,
  isoToDateInput,
  isoToLocalInput,
  localInputToIso,
} from '@/utils/dates'
import AppModal from '@/components/ui/AppModal.vue'

const props = defineProps<{
  open: boolean
  event?: CalendarEvent | null
  courses: Course[]
  defaultDate?: Date | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const toast = useToast()
const queryClient = useQueryClient()

const TYPES: { value: EventType; label: string }[] = [
  { value: 'exam', label: 'Examen' },
  { value: 'assignment', label: 'Entrega' },
  { value: 'class', label: 'Clase' },
  { value: 'personal', label: 'Personal' },
]

const schema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'El título es obligatorio')
      .max(160, 'El título no puede superar los 160 caracteres'),
    allDay: z.boolean(),
    startAt: z.string(),
    endAt: z.string(),
    date: z.string(),
  })
  .refine((value) => (value.allDay ? Boolean(value.date) : Boolean(value.startAt && value.endAt)), {
    message: 'Indica la fecha del evento',
    path: ['startAt'],
  })
  .refine((value) => value.allDay || value.endAt >= value.startAt, {
    message: 'La fecha de fin no puede ser anterior a la de inicio',
    path: ['endAt'],
  })

const form = reactive({
  title: '',
  description: '',
  courseId: '',
  type: 'personal' as EventType,
  status: 'scheduled' as EventStatus,
  allDay: false,
  date: '',
  startAt: '',
  endAt: '',
  location: '',
})

const errors = ref<Record<string, string>>({})
const isEditing = computed(() => Boolean(props.event))

function defaultRange(date: Date) {
  const start = new Date(date)
  start.setHours(9, 0, 0, 0)
  const end = new Date(date)
  end.setHours(10, 0, 0, 0)
  return { start, end }
}

watch(
  () => [props.open, props.event] as const,
  ([open, event]) => {
    if (!open) return
    errors.value = {}
    if (event) {
      form.title = event.title
      form.description = event.description ?? ''
      form.courseId = event.courseId ?? ''
      form.type = event.type
      form.status = event.status
      form.allDay = event.allDay
      form.date = isoToDateInput(event.startAt)
      form.startAt = isoToLocalInput(event.startAt)
      form.endAt = isoToLocalInput(event.endAt)
      form.location = event.location ?? ''
    } else {
      const base = props.defaultDate ?? new Date()
      const { start, end } = defaultRange(base)
      form.title = ''
      form.description = ''
      form.courseId = ''
      form.type = 'personal'
      form.status = 'scheduled'
      form.allDay = false
      form.date = isoToDateInput(start.toISOString())
      form.startAt = isoToLocalInput(start.toISOString())
      form.endAt = isoToLocalInput(end.toISOString())
      form.location = ''
    }
  },
  { immediate: true },
)

const mutation = useMutation({
  mutationFn: async () => {
    const startAt = form.allDay ? dateInputToIso(form.date) : localInputToIso(form.startAt)
    const endAt = form.allDay
      ? endOfDay(new Date(dateInputToIso(form.date))).toISOString()
      : localInputToIso(form.endAt)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      courseId: form.courseId || null,
      type: form.type,
      status: form.status,
      allDay: form.allDay,
      location: form.location.trim() || null,
      startAt,
      endAt,
    }
    return props.event ? eventsApi.update(props.event.id, payload) : eventsApi.create(payload)
  },
  onSuccess: async () => {
    await invalidateEvents(queryClient)
    toast.success(isEditing.value ? 'Evento actualizado.' : 'Evento creado.')
    emit('saved')
    emit('close')
  },
  onError: (error) => toast.error(error, 'No se pudo guardar el evento.'),
})

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
    :title="isEditing ? 'Editar evento' : 'Nuevo evento'"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="text-sm font-medium">Título</span>
        <input v-model="form.title" class="input mt-1" placeholder="Parcial de Álgebra" />
        <span v-if="errors.title" class="mt-1 block text-xs text-rose-600">{{ errors.title }}</span>
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">Tipo</span>
          <select v-model="form.type" class="input mt-1">
            <option v-for="type in TYPES" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Curso</span>
          <select v-model="form.courseId" class="input mt-1">
            <option value="">Sin curso</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>
        </label>
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.allDay" type="checkbox" class="size-4 accent-brand-600" />
        Todo el día
      </label>

      <div v-if="form.allDay" class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">Fecha</span>
          <input v-model="form.date" type="date" class="input mt-1" />
          <span v-if="errors.startAt" class="mt-1 block text-xs text-rose-600">{{
            errors.startAt
          }}</span>
        </label>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">Inicio</span>
          <input v-model="form.startAt" type="datetime-local" class="input mt-1" />
        </label>
        <label class="block">
          <span class="text-sm font-medium">Fin</span>
          <input v-model="form.endAt" type="datetime-local" class="input mt-1" />
          <span v-if="errors.endAt" class="mt-1 block text-xs text-rose-600">{{
            errors.endAt
          }}</span>
        </label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">Lugar</span>
          <input v-model="form.location" class="input mt-1" placeholder="Aula 201" />
        </label>
        <label class="block">
          <span class="text-sm font-medium">Estado</span>
          <select v-model="form.status" class="input mt-1">
            <option value="scheduled">Programado</option>
            <option value="done">Realizado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>
      </div>

      <label class="block">
        <span class="text-sm font-medium">Notas</span>
        <textarea v-model="form.description" class="input mt-1" rows="2" />
      </label>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="mutation.isPending.value">
          {{
            mutation.isPending.value ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear evento'
          }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
