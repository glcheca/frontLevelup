<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{ open: boolean; title: string; description?: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLElement | null>(null)
const titleId = useId()
const descriptionId = useId()

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

let previousFocus: HTMLElement | null = null

function focusables(): HTMLElement[] {
  if (!dialog.value) return []
  return Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null,
  )
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return

  const items = focusables()
  if (!items.length) {
    event.preventDefault()
    dialog.value?.focus()
    return
  }

  const first = items[0]!
  const last = items[items.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      const preferred = dialog.value?.querySelector<HTMLElement>('[data-autofocus]')
      const target = preferred ?? focusables()[0] ?? dialog.value
      target?.focus()
    } else {
      document.body.style.overflow = ''
      previousFocus?.focus?.()
      previousFocus = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  previousFocus?.focus?.()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />
      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
        tabindex="-1"
        :class="[
          'relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl outline-none sm:rounded-2xl dark:bg-slate-900',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        ]"
        @keydown="onKeydown"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 :id="titleId" class="text-lg font-semibold tracking-tight">{{ title }}</h2>
            <p
              v-if="description"
              :id="descriptionId"
              class="mt-1 text-sm text-slate-500 dark:text-slate-400"
            >
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
