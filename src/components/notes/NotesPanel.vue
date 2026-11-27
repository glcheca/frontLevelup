<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NotebookPen, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { invalidateNotes, keys } from '@/api/keys'
import { notesApi } from '@/api/notes'
import { useToast } from '@/composables/useToast'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import HighlightText from '@/components/notes/HighlightText.vue'
import NoteEditor from '@/components/notes/NoteEditor.vue'

const props = defineProps<{
  courseId?: string | null
  embedded?: boolean
  tag?: string
  query?: string
}>()
const emit = defineEmits<{ 'update:tag': [string]; 'update:query': [string] }>()

const toast = useToast()
const queryClient = useQueryClient()

const searchInput = ref(props.query ?? '')
const debouncedQuery = ref(props.query ?? '')
const courseFilter = ref('')
const selectedId = ref<string | null>(null)
const pendingDelete = ref<{ id: string; title: string } | null>(null)
const editorRef = ref<{ flush: () => Promise<void> } | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
let syncing = false

watch(
  () => props.query,
  (value) => {
    const next = value ?? ''
    if (next === debouncedQuery.value) return
    syncing = true
    searchInput.value = next
    debouncedQuery.value = next
    nextTick(() => {
      syncing = false
    })
  },
)

watch(searchInput, (value) => {
  if (syncing) return
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedQuery.value = value.trim()
    emit('update:query', debouncedQuery.value)
  }, 300)
})

const effectiveCourseId = computed(() =>
  props.courseId ? props.courseId : courseFilter.value || undefined,
)

const listParams = computed(() => ({
  ...(effectiveCourseId.value ? { courseId: effectiveCourseId.value } : {}),
  ...(props.tag ? { tag: props.tag } : {}),
  ...(debouncedQuery.value ? { q: debouncedQuery.value } : {}),
}))

const notesQuery = useQuery({
  queryKey: computed(() => keys.notes(listParams.value)),
  queryFn: () => notesApi.list({ ...listParams.value, size: 100 }),
})

const tagsQuery = useQuery({ queryKey: keys.noteTags(), queryFn: () => notesApi.tags() })

const coursesQuery = useQuery({
  queryKey: keys.courses({ archived: false }),
  queryFn: () => coursesApi.list({ archived: false, size: 100 }),
})

const notes = computed(() => notesQuery.data.value?.content ?? [])
const tags = computed(() => tagsQuery.data.value ?? [])
const courses = computed(() => coursesQuery.data.value?.content ?? [])

watch(
  notes,
  (list) => {
    if (!list.length) {
      selectedId.value = null
      return
    }
    if (!selectedId.value || !list.some((note) => note.id === selectedId.value)) {
      selectedId.value = list[0]!.id
    }
  },
  { immediate: true },
)

const detailQuery = useQuery({
  queryKey: computed(() => keys.note(selectedId.value ?? '')),
  queryFn: () => notesApi.get(selectedId.value as string),
  enabled: computed(() => Boolean(selectedId.value)),
})

const createMutation = useMutation({
  mutationFn: () =>
    notesApi.create({
      title: 'Nuevo apunte',
      contentMd: '',
      courseId: props.courseId ?? null,
      tags: [],
      pinned: false,
    }),
  onSuccess: async (note) => {
    searchInput.value = ''
    debouncedQuery.value = ''
    emit('update:query', '')
    emit('update:tag', '')
    queryClient.setQueryData(keys.note(note.id), note)
    selectedId.value = note.id
    await invalidateNotes(queryClient)
    toast.success('Apunte creado.')
  },
  onError: (error) => toast.error(error, 'No se pudo crear el apunte.'),
})

const pinMutation = useMutation({
  mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => notesApi.setPinned(id, pinned),
  onSuccess: async (note) => {
    queryClient.setQueryData(keys.note(note.id), note)
    await invalidateNotes(queryClient)
  },
  onError: (error) => toast.error(error, 'No se pudo fijar el apunte.'),
})

const deleteMutation = useMutation({
  mutationFn: (id: string) => notesApi.remove(id),
  onSuccess: async () => {
    pendingDelete.value = null
    await invalidateNotes(queryClient)
    toast.success('Apunte eliminado.')
  },
  onError: (error) => toast.error(error, 'No se pudo eliminar el apunte.'),
})

async function select(id: string) {
  if (id === selectedId.value) return
  await editorRef.value?.flush()
  selectedId.value = id
}

function setTag(tag: string) {
  emit('update:tag', tag)
}

function confirmDelete(note: { id: string; title: string }) {
  pendingDelete.value = note
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!embedded" class="flex flex-wrap items-center gap-2">
      <div class="relative min-w-56 flex-1">
        <Search
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
        />
        <input
          v-model="searchInput"
          class="input pl-9"
          type="search"
          placeholder="Buscar en tus apuntes…"
          aria-label="Buscar apuntes"
        />
      </div>
      <select v-model="courseFilter" class="input w-auto" aria-label="Filtrar por curso">
        <option value="">Todos los cursos</option>
        <option v-for="course in courses" :key="course.id" :value="course.id">
          {{ course.name }}
        </option>
      </select>
      <button class="btn-primary" @click="createMutation.mutate()">
        <Plus class="size-4" />
        Nuevo apunte
      </button>
    </div>

    <div v-if="tags.length" class="flex flex-wrap items-center gap-1.5">
      <button
        class="rounded-full px-2.5 py-1 text-xs font-medium transition"
        :class="
          !tag
            ? 'bg-brand-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
        "
        @click="setTag('')"
      >
        Todas
      </button>
      <button
        v-for="item in tags"
        :key="item"
        class="rounded-full px-2.5 py-1 text-xs font-medium transition"
        :class="
          tag === item
            ? 'bg-brand-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
        "
        @click="setTag(item)"
      >
        #{{ item }}
      </button>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <aside class="card flex min-h-72 flex-col gap-3 p-0">
        <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p class="text-sm font-medium">
            {{ notes.length }} apunte(s)
            <span v-if="debouncedQuery" class="text-slate-400">· “{{ debouncedQuery }}”</span>
          </p>
          <button
            v-if="embedded"
            class="btn-ghost gap-1 px-2 py-1 text-xs"
            @click="createMutation.mutate()"
          >
            <Plus class="size-3.5" />
            Nuevo
          </button>
        </div>

        <div v-if="notesQuery.isLoading.value" class="px-4 pb-4">
          <SkeletonBlock :lines="5" />
        </div>

        <div v-else-if="notesQuery.isError.value" class="space-y-2 px-4 pb-4 text-sm">
          <p class="text-rose-600">No se pudieron cargar los apuntes.</p>
          <button class="btn-ghost" @click="notesQuery.refetch()">Reintentar</button>
        </div>

        <div v-else-if="!notes.length" class="px-4 pb-4">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ debouncedQuery || tag ? 'Nada coincide con el filtro.' : 'Todavía no hay apuntes.' }}
          </p>
        </div>

        <ul
          v-else
          class="max-h-[62vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800"
        >
          <li v-for="note in notes" :key="note.id" class="relative">
            <button
              class="w-full space-y-1 px-4 py-3 pr-16 text-left transition"
              :class="
                selectedId === note.id
                  ? 'bg-brand-50/70 dark:bg-brand-900/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              "
              @click="select(note.id)"
            >
              <span class="flex items-center gap-1.5">
                <Pin v-if="note.pinned" class="size-3 shrink-0 text-brand-600" />
                <span class="truncate text-sm font-medium">
                  <HighlightText :text="note.title" :query="debouncedQuery" />
                </span>
              </span>
              <span
                v-if="note.excerpt"
                class="line-clamp-2 block text-xs text-slate-500 dark:text-slate-400"
              >
                <HighlightText :text="note.excerpt" :query="debouncedQuery" />
              </span>
              <span class="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-slate-400">
                <span
                  v-if="note.courseName"
                  class="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400"
                >
                  <span
                    class="size-2 rounded-full"
                    :style="{ backgroundColor: note.courseColor ?? '#6366f1' }"
                  />
                  {{ note.courseName }}
                </span>
                <span v-for="item in note.tags" :key="item" class="text-slate-400">
                  #{{ item }}
                </span>
              </span>
            </button>

            <div class="absolute top-2 right-2 flex gap-0.5">
              <button
                class="btn-ghost size-7 p-0"
                :aria-label="note.pinned ? `Desfijar ${note.title}` : `Fijar ${note.title}`"
                @click="pinMutation.mutate({ id: note.id, pinned: !note.pinned })"
              >
                <PinOff v-if="note.pinned" class="size-3.5 text-brand-600" />
                <Pin v-else class="size-3.5" />
              </button>
              <button
                class="btn-ghost size-7 p-0 text-rose-600"
                :aria-label="`Borrar ${note.title}`"
                @click="confirmDelete(note)"
              >
                <Trash2 class="size-3.5" />
              </button>
            </div>
          </li>
        </ul>
      </aside>

      <section class="min-w-0">
        <div v-if="detailQuery.isLoading.value" class="card">
          <SkeletonBlock :lines="8" />
        </div>
        <div v-else-if="detailQuery.isError.value" class="card text-sm text-rose-600">
          No se pudo abrir el apunte.
          <button class="btn-ghost mt-2" @click="detailQuery.refetch()">Reintentar</button>
        </div>
        <NoteEditor
          v-else-if="detailQuery.data.value"
          ref="editorRef"
          :note="detailQuery.data.value"
          :courses="courses"
          @remove="confirmDelete(detailQuery.data.value)"
        />
        <EmptyState
          v-else
          :icon="NotebookPen"
          title="Selecciona un apunte"
          description="O crea uno nuevo para empezar a escribir en markdown."
        >
          <button class="btn-primary mt-1" @click="createMutation.mutate()">
            <Plus class="size-4" />
            Nuevo apunte
          </button>
        </EmptyState>
      </section>
    </div>

    <AppModal :open="Boolean(pendingDelete)" title="Borrar apunte" @close="pendingDelete = null">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        “{{ pendingDelete?.title }}” se borrará para siempre.
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <button class="btn-ghost" @click="pendingDelete = null">Cancelar</button>
        <button
          class="btn-primary bg-rose-600 hover:bg-rose-700"
          :disabled="deleteMutation.isPending.value"
          @click="pendingDelete && deleteMutation.mutate(pendingDelete.id)"
        >
          Borrar
        </button>
      </div>
    </AppModal>
  </div>
</template>
