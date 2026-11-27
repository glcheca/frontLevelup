<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { z } from 'zod'
import { gradesApi } from '@/api/grades'
import { invalidateGrades } from '@/api/keys'
import { useToast } from '@/composables/useToast'
import { useQueryClient } from '@tanstack/vue-query'
import type { Assessment } from '@/types/models'
import { isoToLocalInput, localInputToIso } from '@/utils/dates'
import AppModal from '@/components/ui/AppModal.vue'

const props = defineProps<{
  open: boolean
  courseId: string
  grade?: Assessment | null
}>()
const emit = defineEmits<{ close: [] }>()

const toast = useToast()
const queryClient = useQueryClient()

const form = reactive({
  name: '',
  weight: 20,
  score: '',
  maxScore: 20,
  dueAt: '',
  notes: '',
})

const errors = ref<Record<string, string>>({})
const isEditing = computed(() => Boolean(props.grade))

const schema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Máximo 120 caracteres'),
    weight: z.coerce
      .number()
      .gt(0, 'El peso debe ser mayor que 0')
      .max(100, 'El peso no puede superar 100'),
    maxScore: z.coerce
      .number()
      .gt(0, 'La nota máxima debe ser mayor que 0')
      .max(999.99, 'La nota máxima no puede superar 999.99'),
    score: z.string(),
    dueAt: z.string(),
    notes: z.string().max(4000, 'Máximo 4000 caracteres'),
  })
  .superRefine((data, ctx) => {
    if (data.score.trim() === '') return
    const score = Number(data.score.replace(',', '.'))
    if (!Number.isFinite(score) || score < 0) {
      ctx.addIssue({ code: 'custom', path: ['score'], message: 'Nota inválida' })
      return
    }
    if (score > data.maxScore) {
      ctx.addIssue({
        code: 'custom',
        path: ['score'],
        message: 'La nota no puede superar la nota máxima',
      })
    }
  })

watch(
  () => [props.open, props.grade] as const,
  ([open, grade]) => {
    if (!open) return
    errors.value = {}
    if (grade) {
      form.name = grade.name
      form.weight = grade.weight
      form.score = grade.score === null || grade.score === undefined ? '' : String(grade.score)
      form.maxScore = grade.maxScore
      form.dueAt = grade.dueAt ? isoToLocalInput(grade.dueAt) : ''
      form.notes = grade.notes ?? ''
    } else {
      form.name = ''
      form.weight = 20
      form.score = ''
      form.maxScore = 20
      form.dueAt = ''
      form.notes = ''
    }
  },
  { immediate: true },
)

const percentagePreview = computed(() => {
  const score = Number(form.score.replace(',', '.'))
  if (form.score.trim() === '' || !Number.isFinite(score) || form.maxScore <= 0) return null
  return ((score / form.maxScore) * 100).toFixed(1)
})

const mutation = useMutation({
  mutationFn: () => {
    const payload = {
      name: form.name.trim(),
      weight: Number(form.weight),
      score: form.score.trim() === '' ? null : Number(form.score.replace(',', '.')),
      maxScore: Number(form.maxScore),
      dueAt: form.dueAt ? localInputToIso(form.dueAt) : null,
      notes: form.notes.trim() || null,
    }
    return props.grade
      ? gradesApi.update(props.grade.id, payload)
      : gradesApi.create(props.courseId, payload)
  },
  onSuccess: async () => {
    await invalidateGrades(queryClient, props.courseId)
    toast.success(isEditing.value ? 'Evaluación actualizada.' : 'Evaluación creada.')
    emit('close')
  },
  onError: (error) => toast.error(error, 'No se pudo guardar la evaluación.'),
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
    :title="isEditing ? 'Editar evaluación' : 'Nueva evaluación'"
    description="El peso es el porcentaje que aporta a la nota final del curso."
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="text-sm font-medium">Nombre</span>
        <input v-model="form.name" class="input mt-1" placeholder="Examen parcial" />
        <span v-if="errors.name" class="mt-1 block text-xs text-rose-600">{{ errors.name }}</span>
      </label>

      <div class="grid gap-4 sm:grid-cols-3">
        <label class="block">
          <span class="text-sm font-medium">Peso (%)</span>
          <input
            v-model.number="form.weight"
            type="number"
            step="0.5"
            min="0"
            max="100"
            class="input mt-1"
          />
          <span v-if="errors.weight" class="mt-1 block text-xs text-rose-600">
            {{ errors.weight }}
          </span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Nota</span>
          <input
            v-model="form.score"
            class="input mt-1"
            inputmode="decimal"
            placeholder="Sin calificar"
          />
          <span v-if="errors.score" class="mt-1 block text-xs text-rose-600">{{
            errors.score
          }}</span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Máximo</span>
          <input
            v-model.number="form.maxScore"
            type="number"
            step="0.5"
            min="0"
            class="input mt-1"
          />
          <span v-if="errors.maxScore" class="mt-1 block text-xs text-rose-600">
            {{ errors.maxScore }}
          </span>
        </label>
      </div>

      <p v-if="percentagePreview !== null" class="text-xs text-slate-500 dark:text-slate-400">
        Equivale a {{ percentagePreview }}% de la evaluación.
      </p>

      <label class="block">
        <span class="text-sm font-medium">Fecha (opcional)</span>
        <input v-model="form.dueAt" type="datetime-local" class="input mt-1" />
      </label>

      <label class="block">
        <span class="text-sm font-medium">Notas (opcional)</span>
        <textarea v-model="form.notes" class="input mt-1" rows="2" />
      </label>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="mutation.isPending.value">
          {{
            mutation.isPending.value
              ? 'Guardando…'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear evaluación'
          }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
