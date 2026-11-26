<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { TaskItem } from '@/types/models'
import { formatDueLabel } from '@/utils/dates'

const props = defineProps<{ task: TaskItem; busy?: boolean }>()
const emit = defineEmits<{ complete: [done: boolean]; edit: []; remove: [] }>()

const doneSubtasks = computed(() => props.task.subtasks.filter((subtask) => subtask.done).length)
const priorityLabel = computed(() => ['Baja', 'Media', 'Alta'][props.task.priority] ?? 'Media')
const priorityClass = computed(
  () =>
    [
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
      'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
    ][props.task.priority] ?? '',
)
</script>

<template>
  <li class="flex items-start gap-3 py-3">
    <input
      type="checkbox"
      class="mt-1 size-4 shrink-0 accent-brand-600"
      :checked="task.status === 'done'"
      :disabled="busy"
      :aria-label="`Marcar ${task.title} como hecha`"
      @change="emit('complete', ($event.target as HTMLInputElement).checked)"
    />
    <div class="min-w-0 flex-1">
      <p
        class="truncate font-medium"
        :class="task.status === 'done' ? 'line-through opacity-60' : ''"
      >
        {{ task.title }}
      </p>
      <div
        class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
      >
        <span
          v-if="task.courseName"
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
          :style="{
            backgroundColor: `${task.courseColor}22`,
            color: task.courseColor ?? undefined,
          }"
        >
          {{ task.courseName }}
        </span>
        <span class="rounded-full px-2 py-0.5" :class="priorityClass">{{ priorityLabel }}</span>
        <span :class="task.overdue ? 'font-medium text-rose-600' : ''">
          {{ formatDueLabel(task.dueAt) }}
        </span>
        <span v-if="task.subtasks.length">
          {{ doneSubtasks }}/{{ task.subtasks.length }} subtareas
        </span>
      </div>
    </div>
    <div class="flex items-center gap-1">
      <button class="btn-ghost size-8 p-0" aria-label="Editar tarea" @click="emit('edit')">
        <Pencil class="size-4" />
      </button>
      <button
        class="btn-ghost size-8 p-0 text-rose-600"
        aria-label="Borrar tarea"
        @click="emit('remove')"
      >
        <Trash2 class="size-4" />
      </button>
    </div>
  </li>
</template>
