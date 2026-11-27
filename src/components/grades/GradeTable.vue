<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { Assessment } from '@/types/models'
import { formatDayShort } from '@/utils/dates'

defineProps<{ grades: Assessment[]; loading?: boolean }>()
const emit = defineEmits<{ edit: [Assessment]; remove: [Assessment] }>()

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return Number(value.toFixed(2)).toString()
}
</script>

<template>
  <div class="card overflow-hidden p-0">
    <div v-if="loading" class="space-y-3 p-5">
      <div class="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div class="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div class="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    </div>

    <table v-else class="w-full text-sm">
      <thead
        class="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
      >
        <tr>
          <th class="px-4 py-2.5 font-medium">Evaluación</th>
          <th class="px-4 py-2.5 font-medium">Peso</th>
          <th class="px-4 py-2.5 font-medium">Nota</th>
          <th class="hidden px-4 py-2.5 font-medium sm:table-cell">Fecha</th>
          <th class="px-4 py-2.5 text-right font-medium">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <tr v-for="grade in grades" :key="grade.id">
          <td class="max-w-56 px-4 py-3">
            <p class="truncate font-medium">{{ grade.name }}</p>
            <p v-if="grade.notes" class="truncate text-xs text-slate-500 dark:text-slate-400">
              {{ grade.notes }}
            </p>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
            {{ formatNumber(grade.weight) }}%
          </td>
          <td class="px-4 py-3 whitespace-nowrap">
            <span
              v-if="grade.score === null || grade.score === undefined"
              class="text-xs text-slate-400"
            >
              Sin calificar
            </span>
            <span v-else class="flex items-center gap-1.5">
              <span class="font-medium">{{ formatNumber(grade.score) }}</span>
              <span class="text-xs text-slate-400">/ {{ formatNumber(grade.maxScore) }}</span>
              <span
                class="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              >
                {{ formatNumber(grade.percentage) }}%
              </span>
            </span>
          </td>
          <td
            class="hidden px-4 py-3 whitespace-nowrap text-slate-500 sm:table-cell dark:text-slate-400"
          >
            {{ grade.dueAt ? formatDayShort(grade.dueAt) : '—' }}
          </td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-0.5">
              <button
                class="btn-ghost size-8 p-0"
                :aria-label="`Editar ${grade.name}`"
                @click="emit('edit', grade)"
              >
                <Pencil class="size-3.5" />
              </button>
              <button
                class="btn-ghost size-8 p-0 text-rose-600"
                :aria-label="`Borrar ${grade.name}`"
                @click="emit('remove', grade)"
              >
                <Trash2 class="size-3.5" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
