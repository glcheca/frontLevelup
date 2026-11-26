<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { Plus, Trash2 } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { invalidateCourses } from '@/api/keys'
import { useToast } from '@/composables/useToast'
import type { ClassBlock } from '@/types/models'
import { shortTime, timeInputToApi, weekdayName } from '@/utils/dates'

const props = defineProps<{ courseId: string; blocks: ClassBlock[] }>()

const toast = useToast()
const queryClient = useQueryClient()

const emptyForm = () => ({ dayOfWeek: 1, startTime: '08:00', endTime: '09:00', room: '' })
const form = reactive(emptyForm())
const editingId = ref<string | null>(null)
const error = ref<string | null>(null)

const grouped = computed(() => {
  const map = new Map<number, ClassBlock[]>()
  for (const block of props.blocks) {
    const list = map.get(block.dayOfWeek) ?? []
    list.push(block)
    map.set(block.dayOfWeek, list)
  }
  return [...map.entries()].sort(([a], [b]) => a - b)
})

const mutation = useMutation({
  mutationFn: async () => {
    const payload = {
      dayOfWeek: form.dayOfWeek,
      startTime: timeInputToApi(form.startTime),
      endTime: timeInputToApi(form.endTime),
      room: form.room.trim() || null,
    }
    return editingId.value
      ? coursesApi.updateBlock(editingId.value, payload)
      : coursesApi.createBlock(props.courseId, payload)
  },
  onSuccess: async (block) => {
    await invalidateCourses(queryClient, props.courseId)
    if (block.warning) {
      toast.success(block.warning)
    } else {
      toast.success(editingId.value ? 'Bloque actualizado.' : 'Bloque añadido al horario.')
    }
    cancel()
  },
  onError: (mutationError) => toast.error(mutationError, 'No se pudo guardar el bloque.'),
})

const removeMutation = useMutation({
  mutationFn: (blockId: string) => coursesApi.removeBlock(blockId),
  onSuccess: async () => {
    await invalidateCourses(queryClient, props.courseId)
    toast.success('Bloque eliminado.')
  },
  onError: (mutationError) => toast.error(mutationError, 'No se pudo eliminar el bloque.'),
})

function submit() {
  if (form.endTime <= form.startTime) {
    error.value = 'La hora de fin debe ser posterior a la de inicio.'
    return
  }
  error.value = null
  mutation.mutate()
}

function edit(block: ClassBlock) {
  editingId.value = block.id
  form.dayOfWeek = block.dayOfWeek
  form.startTime = shortTime(block.startTime)
  form.endTime = shortTime(block.endTime)
  form.room = block.room ?? ''
}

function cancel() {
  editingId.value = null
  error.value = null
  Object.assign(form, emptyForm())
}
</script>

<template>
  <div class="space-y-4">
    <form class="card space-y-3" @submit.prevent="submit">
      <h3 class="font-medium">{{ editingId ? 'Editar bloque' : 'Añadir bloque' }}</h3>
      <div class="grid gap-3 sm:grid-cols-4">
        <label class="block">
          <span class="text-xs text-slate-500 dark:text-slate-400">Día</span>
          <select v-model.number="form.dayOfWeek" class="input mt-1">
            <option v-for="day in 7" :key="day" :value="day">{{ weekdayName(day) }}</option>
          </select>
        </label>
        <label class="block">
          <span class="text-xs text-slate-500 dark:text-slate-400">Inicio</span>
          <input v-model="form.startTime" type="time" class="input mt-1" />
        </label>
        <label class="block">
          <span class="text-xs text-slate-500 dark:text-slate-400">Fin</span>
          <input v-model="form.endTime" type="time" class="input mt-1" />
        </label>
        <label class="block">
          <span class="text-xs text-slate-500 dark:text-slate-400">Aula</span>
          <input v-model="form.room" class="input mt-1" placeholder="Aula 302" />
        </label>
      </div>
      <p v-if="error" class="text-xs text-rose-600">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <button v-if="editingId" type="button" class="btn-ghost" @click="cancel">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="mutation.isPending.value">
          <Plus class="size-4" />
          {{ editingId ? 'Guardar' : 'Añadir' }}
        </button>
      </div>
    </form>

    <p v-if="!blocks.length" class="text-sm text-slate-500 dark:text-slate-400">
      Todavía no hay bloques de horario para este curso.
    </p>

    <div v-for="[day, dayBlocks] in grouped" :key="day" class="card space-y-2">
      <h4 class="text-sm font-medium capitalize">{{ weekdayName(day) }}</h4>
      <ul class="divide-y divide-slate-100 dark:divide-slate-800">
        <li
          v-for="block in dayBlocks"
          :key="block.id"
          class="flex items-center justify-between gap-3 py-2 text-sm"
        >
          <span>
            {{ shortTime(block.startTime) }}–{{ shortTime(block.endTime) }}
            <span v-if="block.room" class="text-slate-500 dark:text-slate-400">
              · {{ block.room }}</span
            >
          </span>
          <span class="flex items-center gap-1">
            <button class="btn-ghost size-8 p-0" aria-label="Editar bloque" @click="edit(block)">
              Editar
            </button>
            <button
              class="btn-ghost size-8 p-0 text-rose-600"
              aria-label="Eliminar bloque"
              @click="removeMutation.mutate(block.id)"
            >
              <Trash2 class="size-4" />
            </button>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
