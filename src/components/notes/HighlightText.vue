<script setup lang="ts">
import { computed } from 'vue'
import { highlightParts } from '@/utils/markdown'

const props = defineProps<{ text: string; query?: string }>()
const parts = computed(() => highlightParts(props.text, props.query ?? ''))
</script>

<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <mark
        v-if="part.match"
        class="rounded-sm bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-400/30"
      >
        {{ part.text }}
      </mark>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>
