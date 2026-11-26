<script setup lang="ts">
import { computed } from 'vue'
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import type { Course } from '@/types/models'
import { weekdayShort } from '@/utils/dates'

const props = defineProps<{ course: Course }>()
const emit = defineEmits<{ edit: []; archive: []; remove: []; open: [] }>()

const scheduleSummary = computed(() => {
  if (!props.course.schedule?.length) return 'Sin horario'
  const days = [...new Set(props.course.schedule.map((block) => block.dayOfWeek))].sort()
  return days.map((day) => weekdayShort(day)).join(' · ')
})
</script>

<template>
  <article class="card flex flex-col gap-3">
    <div class="flex items-start gap-3">
      <span class="mt-1 size-3 shrink-0 rounded-full" :style="{ backgroundColor: course.color }" />
      <div class="min-w-0 flex-1">
        <button
          class="block max-w-full truncate text-left font-medium hover:underline"
          @click="emit('open')"
        >
          {{ course.name }}
        </button>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ course.period }}
          <template v-if="course.code"> · {{ course.code }}</template>
          <template v-if="course.credits !== null"> · {{ course.credits }} créditos</template>
        </p>
      </div>
      <span
        v-if="course.archived"
        class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      >
        Archivado
      </span>
    </div>

    <p v-if="course.professor" class="text-sm text-slate-600 dark:text-slate-300">
      {{ course.professor }}
    </p>

    <p class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <CalendarClock class="size-3.5" />
      {{ scheduleSummary }}
    </p>

    <div
      class="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800"
    >
      <button
        class="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300"
        @click="emit('open')"
      >
        Ver detalle
      </button>
      <div class="flex items-center gap-1">
        <button class="btn-ghost size-8 p-0" aria-label="Editar curso" @click="emit('edit')">
          <Pencil class="size-4" />
        </button>
        <button
          class="btn-ghost size-8 p-0"
          :aria-label="course.archived ? 'Desarchivar curso' : 'Archivar curso'"
          @click="emit('archive')"
        >
          <ArchiveRestore v-if="course.archived" class="size-4" />
          <Archive v-else class="size-4" />
        </button>
        <button
          class="btn-ghost size-8 p-0 text-rose-600"
          aria-label="Borrar curso"
          @click="emit('remove')"
        >
          <Trash2 class="size-4" />
        </button>
        <MoreVertical class="hidden" />
      </div>
    </div>
  </article>
</template>
