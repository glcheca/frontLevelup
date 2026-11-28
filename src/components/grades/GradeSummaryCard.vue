<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertTriangle, CheckCircle2, Target } from 'lucide-vue-next'
import type { GradeSummary } from '@/types/models'

const props = defineProps<{ summary: GradeSummary; target: number }>()
const emit = defineEmits<{ 'update:target': [number] }>()

const targetInput = ref(props.target)
watch(
  () => props.target,
  (value) => {
    targetInput.value = value
  },
)

function applyTarget() {
  const value = Number(targetInput.value)
  if (!Number.isFinite(value)) {
    targetInput.value = props.target
    return
  }
  const clamped = Math.min(20, Math.max(0, value))
  targetInput.value = clamped
  if (clamped !== props.target) emit('update:target', clamped)
}

const average = computed(() =>
  props.summary.average20 === null || props.summary.average20 === undefined
    ? '—'
    : props.summary.average20.toFixed(1),
)

const maxWeight = computed(() => Math.max(100, props.summary.totalWeight))
const registeredWidth = computed(
  () => (props.summary.totalWeightRegistered / maxWeight.value) * 100,
)
const pendingWidth = computed(() => (props.summary.totalWeightPending / maxWeight.value) * 100)
const overflowing = computed(() => props.summary.totalWeight > 100)

const reachedTarget = computed(
  () =>
    props.summary.average20 !== null &&
    props.summary.average20 !== undefined &&
    props.summary.average20 >= props.target,
)

const messageTone = computed(() => {
  if (props.summary.gradedCount === 0) return 'neutral'
  if (props.summary.pendingCount > 0) return props.summary.achievable ? 'positive' : 'negative'
  return reachedTarget.value ? 'positive' : 'negative'
})

const messageIcon = computed(() => {
  if (messageTone.value === 'positive') return CheckCircle2
  if (messageTone.value === 'negative') return AlertTriangle
  return Target
})

function formatWeight(value: number): string {
  return Number(value.toFixed(2)).toString()
}
</script>

<template>
  <div class="card space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Promedio ponderado
        </p>
        <p class="mt-1 flex items-baseline gap-1">
          <span class="text-4xl font-semibold tracking-tight">{{ average }}</span>
          <span class="text-sm text-slate-500 dark:text-slate-400">/ 20</span>
        </p>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {{ summary.gradedCount }} calificada(s) · {{ summary.pendingCount }} pendiente(s)
        </p>
      </div>

      <label class="block text-sm">
        <span class="text-xs font-medium text-slate-500 dark:text-slate-400"
          >Meta para calcular</span
        >
        <span class="mt-1 flex items-center gap-1.5">
          <input
            v-model.number="targetInput"
            type="number"
            min="0"
            max="20"
            step="0.5"
            class="input h-9 w-20"
            aria-label="Nota meta"
            @change="applyTarget"
            @blur="applyTarget"
          />
          <span class="text-slate-500 dark:text-slate-400">/ 20</span>
        </span>
      </label>
    </div>

    <div class="space-y-1.5">
      <div class="flex h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          class="bg-brand-500 transition-all"
          :style="{ width: `${registeredWidth}%` }"
          :title="`Registrado ${formatWeight(summary.totalWeightRegistered)}%`"
        />
        <div
          class="bg-slate-400 transition-all dark:bg-slate-600"
          :style="{ width: `${pendingWidth}%` }"
          :title="`Pendiente ${formatWeight(summary.totalWeightPending)}%`"
        />
        <div v-if="overflowing" class="flex-1 bg-rose-500" title="Los pesos superan 100%" />
      </div>
      <div class="flex flex-wrap justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Registrado {{ formatWeight(summary.totalWeightRegistered) }}%</span>
        <span>Pendiente {{ formatWeight(summary.totalWeightPending) }}%</span>
      </div>
    </div>

    <p
      v-if="!summary.weightsValid && summary.totalWeight > 0"
      class="text-xs font-medium text-amber-700 dark:text-amber-400"
    >
      Los pesos suman {{ formatWeight(summary.totalWeight) }}% (deberían sumar 100%).
    </p>

    <p
      class="flex items-start gap-2 text-sm"
      :class="{
        'text-emerald-700 dark:text-emerald-400': messageTone === 'positive',
        'text-rose-600 dark:text-rose-400': messageTone === 'negative',
        'text-slate-500 dark:text-slate-400': messageTone === 'neutral',
      }"
    >
      <component :is="messageIcon" class="mt-0.5 size-4 shrink-0" />
      {{ summary.message }}
    </p>
  </div>
</template>
