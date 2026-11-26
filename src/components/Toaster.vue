<script setup lang="ts">
import { CircleAlert, CircleCheck, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3 shadow-lg"
      :class="
        toast.tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
      "
      role="status"
    >
      <CircleAlert v-if="toast.tone === 'error'" class="mt-0.5 size-4 shrink-0" />
      <CircleCheck v-else class="mt-0.5 size-4 shrink-0" />
      <p class="flex-1 text-sm">{{ toast.message }}</p>
      <button
        class="opacity-60 transition hover:opacity-100"
        aria-label="Cerrar aviso"
        @click="dismiss(toast.id)"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
</template>
