<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ title: string; description?: string; icon?: Component }>()
</script>

<template>
  <div
    class="card flex min-h-44 flex-col items-center justify-center gap-2 border-dashed text-center"
  >
    <div
      v-if="icon"
      class="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
    >
      <component :is="icon" class="size-5" />
    </div>
    <p class="font-medium">{{ title }}</p>
    <p v-if="description" class="max-w-sm text-sm text-slate-500 dark:text-slate-400">
      {{ description }}
    </p>
    <slot />
  </div>
</template>
