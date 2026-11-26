<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'
import { coursesApi } from '@/api/courses'
import { invalidateCourses } from '@/api/keys'
import { useToast } from '@/composables/useToast'
import type { Course } from '@/types/models'
import AppModal from '@/components/ui/AppModal.vue'

const props = defineProps<{ open: boolean; course?: Course | null }>()
const emit = defineEmits<{ close: []; saved: [course: Course] }>()

const toast = useToast()
const queryClient = useQueryClient()

const COLOR_PRESETS = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#64748b',
]

const credits = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d{1,2}(\.\d)?$/.test(value),
    'Usa hasta un decimal, ej. 4.5',
  )
  .refine((value) => value === '' || Number(value) <= 30, 'Máximo 30 créditos')

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
  period: z.string().regex(/^\d{4}-[12]$/, 'Formato AAAA-N, ej. 2026-1'),
  code: z.string().trim().max(20, 'Máximo 20 caracteres'),
  professor: z.string().trim().max(120, 'Máximo 120 caracteres'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hexadecimal, ej. #6366f1'),
  credits,
})

const form = reactive({
  name: '',
  period: currentPeriod(),
  code: '',
  professor: '',
  color: COLOR_PRESETS[0] as string,
  credits: '',
})

const errors = ref<Record<string, string>>({})

const isEditing = computed(() => Boolean(props.course))
const title = computed(() => (isEditing.value ? 'Editar curso' : 'Nuevo curso'))

function currentPeriod(): string {
  const now = new Date()
  const half = now.getMonth() + 1 <= 6 ? 1 : 2
  return `${now.getFullYear()}-${half}`
}

watch(
  () => [props.open, props.course] as const,
  ([open, course]) => {
    if (!open) return
    errors.value = {}
    if (course) {
      form.name = course.name
      form.period = course.period
      form.code = course.code ?? ''
      form.professor = course.professor ?? ''
      form.color = course.color
      form.credits = course.credits === null ? '' : String(course.credits)
    } else {
      form.name = ''
      form.period = currentPeriod()
      form.code = ''
      form.professor = ''
      form.color = COLOR_PRESETS[0] as string
      form.credits = ''
    }
  },
  { immediate: true },
)

const mutation = useMutation({
  mutationFn: async () => {
    const payload = {
      name: form.name.trim(),
      period: form.period,
      code: form.code.trim() || null,
      professor: form.professor.trim() || null,
      color: form.color,
      credits: form.credits === '' ? null : Number(form.credits),
    }
    return props.course ? coursesApi.update(props.course.id, payload) : coursesApi.create(payload)
  },
  onSuccess: async (course) => {
    await invalidateCourses(queryClient, course.id)
    toast.success(isEditing.value ? 'Curso actualizado.' : 'Curso creado.')
    emit('saved', course)
    emit('close')
  },
  onError: (error) => toast.error(error, 'No se pudo guardar el curso.'),
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
  <AppModal :open="open" :title="title" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="text-sm font-medium">Nombre</span>
          <input v-model="form.name" class="input mt-1" placeholder="Álgebra Lineal" />
          <span v-if="errors.name" class="mt-1 block text-xs text-rose-600">{{ errors.name }}</span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Periodo</span>
          <input v-model="form.period" class="input mt-1" placeholder="2026-1" />
          <span v-if="errors.period" class="mt-1 block text-xs text-rose-600">{{
            errors.period
          }}</span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Código</span>
          <input v-model="form.code" class="input mt-1" placeholder="MAT-201" />
          <span v-if="errors.code" class="mt-1 block text-xs text-rose-600">{{ errors.code }}</span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Profesor</span>
          <input v-model="form.professor" class="input mt-1" placeholder="Dra. Ríos" />
          <span v-if="errors.professor" class="mt-1 block text-xs text-rose-600">{{
            errors.professor
          }}</span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">Créditos</span>
          <input v-model="form.credits" class="input mt-1" inputmode="decimal" placeholder="4.5" />
          <span v-if="errors.credits" class="mt-1 block text-xs text-rose-600">{{
            errors.credits
          }}</span>
        </label>

        <div class="sm:col-span-2">
          <span class="text-sm font-medium">Color</span>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="preset in COLOR_PRESETS"
              :key="preset"
              type="button"
              class="size-8 rounded-full border-2 transition"
              :class="
                form.color === preset ? 'border-slate-900 dark:border-white' : 'border-transparent'
              "
              :style="{ backgroundColor: preset }"
              :aria-label="`Color ${preset}`"
              :aria-pressed="form.color === preset"
              @click="form.color = preset"
            />
            <label class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <input
                v-model="form.color"
                type="color"
                class="size-8 rounded border-0 bg-transparent"
              />
              personalizado
            </label>
          </div>
          <span v-if="errors.color" class="mt-1 block text-xs text-rose-600">{{
            errors.color
          }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="mutation.isPending.value">
          {{
            mutation.isPending.value ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear curso'
          }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
