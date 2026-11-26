<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{ open: boolean; title: string; description?: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      window.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      window.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />
      <div
        role="dialog"
        aria-modal="true"
        :class="[
          'relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl dark:bg-slate-900',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        ]"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold tracking-tight">{{ title }}</h2>
            <p v-if="description" class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ description }}
            </p>
          </div>
          <button class="btn-ghost size-8 shrink-0 p-0" aria-label="Cerrar" @click="emit('close')">
            <X class="size-4" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
