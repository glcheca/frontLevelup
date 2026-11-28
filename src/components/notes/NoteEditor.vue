<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  AlertCircle,
  Bold,
  Check,
  Code2,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  Loader2,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  X,
} from 'lucide-vue-next'
import { keys } from '@/api/keys'
import { notesApi } from '@/api/notes'
import { useToast } from '@/composables/useToast'
import type { Course, Note } from '@/types/models'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{ note: Note; courses: Course[] }>()
const emit = defineEmits<{ saved: [Note]; remove: [] }>()

const toast = useToast()
const queryClient = useQueryClient()

const form = reactive({
  title: '',
  contentMd: '',
  courseId: '',
  tags: [] as string[],
  pinned: false,
})

const snapshot = ref('')
const status = ref<'saved' | 'dirty' | 'saving' | 'error'>('saved')
const tagInput = ref('')
const showPreview = ref(true)
const textarea = ref<HTMLTextAreaElement | null>(null)
const saving = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null
let pending: Promise<void> | null = null

const serialized = computed(() =>
  JSON.stringify({ ...form, tags: [...form.tags], courseId: form.courseId }),
)
const dirty = computed(() => serialized.value !== snapshot.value)
const html = computed(() => renderMarkdown(form.contentMd))

const statusLabel = computed(() => {
  if (status.value === 'saving') return 'Guardando…'
  if (status.value === 'dirty') return 'Sin guardar'
  if (status.value === 'error') return 'No se pudo guardar'
  return 'Guardado'
})

const statusIcon = computed(() => {
  if (status.value === 'saving') return Loader2
  if (status.value === 'error') return AlertCircle
  if (status.value === 'dirty') return Pencil
  return Check
})

function load(note: Note) {
  form.title = note.title
  form.contentMd = note.contentMd
  form.courseId = note.courseId ?? ''
  form.tags = [...note.tags]
  form.pinned = note.pinned
  snapshot.value = serialized.value
  status.value = 'saved'
  tagInput.value = ''
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const formLoadedId = ref<string | null>(null)

watch(
  () => [props.note.id, props.note.updatedAt] as const,
  () => {
    if (props.note.id !== formLoadedId.value || !dirty.value) {
      formLoadedId.value = props.note.id
      load(props.note)
    }
  },
  { immediate: true },
)

watch(serialized, () => {
  if (serialized.value === snapshot.value) return
  status.value = 'dirty'
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void save()
  }, 1500)
})

async function save(): Promise<void> {
  if (saving.value) {
    await pending?.catch(() => undefined)
    if (serialized.value !== snapshot.value) {
      return save()
    }
    return
  }
  if (serialized.value === snapshot.value) return

  if (!form.title.trim()) {
    form.title = 'Sin título'
  }
  const payload = {
    title: form.title.trim(),
    contentMd: form.contentMd,
    courseId: form.courseId || null,
    tags: [...form.tags],
    pinned: form.pinned,
  }
  const target = serialized.value
  saving.value = true
  status.value = 'saving'
  pending = (async () => {
    try {
      const updated = await notesApi.update(props.note.id, payload)
      queryClient.setQueryData(keys.note(props.note.id), updated)
      snapshot.value = target
      if (serialized.value === target) status.value = 'saved'
      emit('saved', updated)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notes'] }),
        queryClient.invalidateQueries({ queryKey: ['note-tags'] }),
      ])
    } catch (error) {
      status.value = 'error'
      toast.error(error, 'No se pudo guardar el apunte.')
    } finally {
      saving.value = false
      pending = null
    }
  })()
  await pending
}

async function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  await save()
}

defineExpose({ flush })

onBeforeUnmount(() => {
  void flush()
})

function addTag() {
  const value = tagInput.value.trim()
  if (!value) return
  if (form.tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
    tagInput.value = ''
    return
  }
  if (form.tags.length >= 10) {
    toast.error(new Error('Máximo 10 etiquetas'), 'Quita alguna etiqueta antes de añadir otra.')
    return
  }
  form.tags.push(value)
  tagInput.value = ''
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((item) => item !== tag)
}

function wrap(before: string, after = before, placeholder = 'texto') {
  const element = textarea.value
  if (!element) return
  const start = element.selectionStart
  const end = element.selectionEnd
  const selected = form.contentMd.slice(start, end) || placeholder
  form.contentMd =
    form.contentMd.slice(0, start) + before + selected + after + form.contentMd.slice(end)
  nextTick(() => {
    element.focus()
    element.setSelectionRange(start + before.length, start + before.length + selected.length)
  })
}

function heading() {
  wrap('## ', '', 'Título')
}

function list() {
  wrap('- ', '', 'Elemento')
}

function link() {
  wrap('[', '](https://)', 'texto')
}
</script>

<template>
  <div class="card flex min-h-[26rem] flex-col gap-0 overflow-hidden p-0">
    <header class="space-y-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <div class="flex items-start gap-2">
        <input
          v-model="form.title"
          class="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-slate-400"
          placeholder="Título del apunte"
        />
        <button
          class="btn-ghost size-8 shrink-0 p-0"
          :aria-label="form.pinned ? 'Desfijar apunte' : 'Fijar apunte'"
          :title="form.pinned ? 'Desfijar' : 'Fijar'"
          @click="form.pinned = !form.pinned"
        >
          <PinOff v-if="form.pinned" class="size-4 text-brand-600" />
          <Pin v-else class="size-4" />
        </button>
        <button
          class="btn-ghost size-8 shrink-0 p-0 text-rose-600"
          aria-label="Borrar apunte"
          title="Borrar"
          @click="emit('remove')"
        >
          <Trash2 class="size-4" />
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select v-model="form.courseId" class="input h-8 w-auto py-0 text-xs">
          <option value="">Sin curso</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>

        <span
          v-for="tag in form.tags"
          :key="tag"
          class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          #{{ tag }}
          <button
            type="button"
            class="text-slate-500 hover:text-rose-600 dark:text-slate-400"
            :aria-label="`Quitar etiqueta ${tag}`"
            @click="removeTag(tag)"
          >
            <X class="size-3" />
          </button>
        </span>

        <input
          v-model="tagInput"
          class="h-7 w-28 border-0 bg-transparent text-xs outline-none placeholder:text-slate-400"
          placeholder="+ etiqueta"
          @keydown.enter.prevent="addTag"
        />

        <span
          class="ml-auto inline-flex items-center gap-1 text-xs"
          :class="status === 'error' ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'"
        >
          <component
            :is="statusIcon"
            class="size-3.5"
            :class="status === 'saving' ? 'animate-spin' : ''"
          />
          {{ statusLabel }}
        </span>
      </div>
    </header>

    <div class="flex items-center gap-1 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
      <button class="btn-ghost size-8 p-0" aria-label="Negrita" title="Negrita" @click="wrap('**')">
        <Bold class="size-4" />
      </button>
      <button class="btn-ghost size-8 p-0" aria-label="Cursiva" title="Cursiva" @click="wrap('_')">
        <Italic class="size-4" />
      </button>
      <button
        class="btn-ghost size-8 p-0"
        aria-label="Encabezado"
        title="Encabezado"
        @click="heading"
      >
        <Heading2 class="size-4" />
      </button>
      <button class="btn-ghost size-8 p-0" aria-label="Lista" title="Lista" @click="list">
        <List class="size-4" />
      </button>
      <button class="btn-ghost size-8 p-0" aria-label="Código" title="Código" @click="wrap('`')">
        <Code2 class="size-4" />
      </button>
      <button class="btn-ghost size-8 p-0" aria-label="Enlace" title="Enlace" @click="link">
        <Link2 class="size-4" />
      </button>
      <button
        class="btn-ghost ml-auto gap-1.5 px-2 py-1 text-xs lg:hidden"
        @click="showPreview = !showPreview"
      >
        <Eye v-if="!showPreview" class="size-4" />
        <Pencil v-else class="size-4" />
        {{ showPreview ? 'Editar' : 'Vista previa' }}
      </button>
    </div>

    <div
      class="grid min-h-0 flex-1 lg:grid-cols-2 lg:divide-x lg:divide-slate-200 lg:dark:divide-slate-800"
    >
      <textarea
        ref="textarea"
        v-model="form.contentMd"
        class="min-h-[22rem] w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-slate-400"
        :class="showPreview ? 'hidden lg:block' : 'block'"
        placeholder="Escribe en markdown…&#10;&#10;## Título&#10;- idea uno&#10;- idea dos"
        spellcheck="true"
      />
      <!-- eslint-disable vue/no-v-html -- renderMarkdown() sanea con DOMPurify -->
      <div
        class="markdown max-h-[60vh] min-h-[22rem] overflow-y-auto p-4"
        :class="showPreview ? 'block' : 'hidden lg:block'"
        v-html="html"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </div>
</template>
