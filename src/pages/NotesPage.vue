<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotesPanel from '@/components/notes/NotesPanel.vue'

const route = useRoute()
const router = useRouter()

function setParam(key: 'tag' | 'q', value: string) {
  const query = { ...route.query }
  if (value) {
    query[key] = value
  } else {
    delete query[key]
  }
  void router.replace({ query })
}

const tag = computed({
  get: () => (typeof route.query.tag === 'string' ? route.query.tag : ''),
  set: (value: string) => setParam('tag', value),
})

const query = computed({
  get: () => (typeof route.query.q === 'string' ? route.query.q : ''),
  set: (value: string) => setParam('q', value),
})

const noteId = computed(() => (typeof route.query.note === 'string' ? route.query.note : undefined))
</script>

<template>
  <div class="space-y-5">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Apuntes</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Markdown con búsqueda sin tildes, etiquetas y filtros por curso. Se guarda solo.
      </p>
    </header>

    <NotesPanel v-model:tag="tag" v-model:query="query" :note-id="noteId" />
  </div>
</template>
