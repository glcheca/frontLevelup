<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
    <div
      class="card flex min-h-48 flex-col items-center justify-center gap-2 border-dashed text-center"
    >
      <p class="font-medium">Módulo en construcción</p>
      <p class="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Esta sección se habilita en una etapa posterior del plan.
      </p>
    </div>
  </div>
</template>
