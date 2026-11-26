<script setup lang="ts">
const props = withDefaults(defineProps<{ lines?: number }>(), { lines: 3 })

/** El ancho se calcula aquí: los literales de plantilla dentro de atributos confunden al linter. */
function lineWidth(line: number): string {
  return `${100 - line * 7}%`
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="line in props.lines"
      :key="line"
      class="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
      :style="{ width: lineWidth(line) }"
    />
  </div>
</template>
