<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  CornerDownLeft,
  NotebookPen,
  Search,
} from 'lucide-vue-next'
import { keys } from '@/api/keys'
import { searchApi } from '@/api/search'
import type { SearchItem, SearchItemType } from '@/types/models'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const query = ref('')
const debounced = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)

let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.open,
  (open) => {
    if (!open) return
    query.value = ''
    debounced.value = ''
    active.value = 0
    void nextTick(() => input.value?.focus())
  },
  { immediate: true },
)

watch(query, (value) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    debounced.value = value.trim()
    active.value = 0
  }, 250)
})

const searchQuery = useQuery({
  queryKey: computed(() => keys.search(debounced.value)),
  queryFn: () => searchApi.search(debounced.value),
  enabled: computed(() => props.open && debounced.value.length >= 2),
})

const ICONS = {
  course: BookOpen,
  event: CalendarDays,
  task: CheckSquare,
  note: NotebookPen,
} as const

const LABELS: Record<SearchItemType, string> = {
  course: 'Cursos',
  event: 'Eventos',
  task: 'Tareas',
  note: 'Apuntes',
}

const groups = computed(() => {
  const data = searchQuery.data.value
  if (!data) return []
  return (['course', 'event', 'task', 'note'] as const)
    .map((type) => ({
      type,
      label: LABELS[type],
      items: data[`${type}s`] as SearchItem[],
    }))
    .filter((group) => group.items.length > 0)
})

const items = computed(() => groups.value.flatMap((group) => group.items))

watch(items, () => {
  active.value = 0
})

function indexOf(item: SearchItem): number {
  return items.value.findIndex((candidate) => candidate === item)
}

async function select(item: SearchItem) {
  emit('close')
  if (item.type === 'course') {
    await router.push({ name: 'course-detail', params: { id: item.id } })
  } else if (item.type === 'event') {
    await router.push({ name: 'calendar' })
  } else if (item.type === 'task') {
    await router.push({ name: 'tasks' })
  } else {
    await router.push({ name: 'notes', query: { note: item.id } })
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    active.value = items.value.length ? (active.value + 1) % items.value.length : 0
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = items.value.length
      ? (active.value - 1 + items.value.length) % items.value.length
      : 0
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    const item = items.value[active.value]
    if (item) void select(item)
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-[10vh] backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        aria-label="Búsqueda global"
      >
        <div class="flex items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          <Search class="size-4 shrink-0 text-slate-400" />
          <input
            ref="input"
            v-model="query"
            class="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Buscar cursos, eventos, tareas y apuntes…"
            @keydown="onKeydown"
          />
          <kbd
            class="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700"
          >
            Esc
          </kbd>
        </div>

        <div
          v-if="debounced.length < 2"
          class="px-4 py-6 text-sm text-slate-500 dark:text-slate-400"
        >
          Escribe al menos 2 letras para buscar en todo tu semestre.
        </div>

        <div
          v-else-if="searchQuery.isFetching.value"
          class="px-4 py-6 text-sm text-slate-500 dark:text-slate-400"
        >
          Buscando…
        </div>

        <div v-else-if="!items.length" class="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
          No hay resultados para “{{ debounced }}”.
        </div>

        <ul v-else class="max-h-[50vh] overflow-y-auto py-2">
          <template v-for="group in groups" :key="group.type">
            <li
              class="px-4 pt-2 pb-1 text-[11px] font-medium tracking-wide text-slate-400 uppercase"
            >
              {{ group.label }}
            </li>
            <li v-for="item in group.items" :key="`${item.type}-${item.id}`">
              <button
                class="flex w-full items-center gap-3 px-4 py-2 text-left transition"
                :class="
                  indexOf(item) === active
                    ? 'bg-brand-50 dark:bg-brand-900/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                "
                @mouseenter="active = indexOf(item)"
                @click="select(item)"
              >
                <component :is="ICONS[item.type]" class="size-4 shrink-0 text-slate-400" />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium">{{ item.title }}</span>
                  <span v-if="item.subtitle" class="block truncate text-xs text-slate-500">
                    {{ item.subtitle }}
                  </span>
                </span>
                <CornerDownLeft
                  v-if="indexOf(item) === active"
                  class="size-3.5 shrink-0 text-slate-400"
                />
              </button>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
