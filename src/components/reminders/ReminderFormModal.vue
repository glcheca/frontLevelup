<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'
import { invalidateReminders } from '@/api/keys'
import { remindersApi } from '@/api/reminders'
import { useToast } from '@/composables/useToast'
import type { ReminderTargetType } from '@/types/models'
import { isoToLocalInput, localInputToIso } from '@/utils/dates'
import AppModal from '@/components/ui/AppModal.vue'

const props = defineProps<{
  open: boolean
  targetType?: ReminderTargetType
  targetId?: string | null
  targetLabel?: string | null
  defaultAt?: string | null
}>()
const emit = defineEmits<{ close: [] }>()

const toast = useToast()
const queryClient = useQueryClient()

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio')
    .max(160, 'El título no puede superar los 160 caracteres'),
  triggerAt: z.string().min(1, 'Indica cuándo avisar'),
})

const form = reactive({ title: '', body: '', triggerAt: '' })
const errors = ref<Record<string, string>>({})

const isLinked = computed(() => Boolean(props.targetType && props.targetType !== 'custom'))

watch(
  () => props.open,
  (open) => {
    if (!open) return
    errors.value = {}
    form.title = ''
    form.body = ''
    form.triggerAt = props.defaultAt
      ? isoToLocalInput(props.defaultAt)
      : isoToLocalInput(defaultDate())
  },
  { immediate: true },
)

function defaultDate(): string {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return date.toISOString()
}

const mutation = useMutation({
  mutationFn: () =>
    remindersApi.create({
      title: form.title.trim(),
      body: form.body.trim() || null,
      triggerAt: localInputToIso(form.triggerAt),
      targetType: props.targetType ?? 'custom',
      targetId: props.targetId ?? null,
    }),
  onSuccess: async () => {
    await invalidateReminders(queryClient)
    toast.success('Recordatorio creado.')
    emit('close')
  },
  onError: (error) => toast.error(error, 'No se pudo crear el recordatorio.'),
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
  <AppModal :open="open" title="Nuevo recordatorio" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="submit">
      <p
        v-if="isLinked"
        class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      >
        Vinculado a {{ targetType === 'event' ? 'evento' : 'tarea' }}:
        <span class="font-medium text-slate-700 dark:text-slate-200">{{ targetLabel }}</span>
      </p>

      <label class="block">
        <span class="text-sm font-medium">Título</span>
        <input v-model="form.title" class="input mt-1" placeholder="Repasar capítulo 3" />
        <span v-if="errors.title" class="mt-1 block text-xs text-rose-600">{{ errors.title }}</span>
      </label>

      <label class="block">
        <span class="text-sm font-medium">Cuándo</span>
        <input v-model="form.triggerAt" type="datetime-local" class="input mt-1" />
        <span v-if="errors.triggerAt" class="mt-1 block text-xs text-rose-600">
          {{ errors.triggerAt }}
        </span>
      </label>

      <label class="block">
        <span class="text-sm font-medium">Detalle (opcional)</span>
        <textarea v-model="form.body" class="input mt-1" rows="2" />
      </label>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="mutation.isPending.value">
          {{ mutation.isPending.value ? 'Guardando…' : 'Crear recordatorio' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
