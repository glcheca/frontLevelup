<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import { GraduationCap } from 'lucide-vue-next'
import { gradesApi } from '@/api/grades'
import { keys } from '@/api/keys'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

const TARGET = 14

const summariesQuery = useQuery({
  queryKey: keys.gradeSummaries(TARGET),
  queryFn: () => gradesApi.summaries(TARGET),
})

const summaries = computed(() => summariesQuery.data.value ?? [])
const graded = computed(() => summaries.value.filter((summary) => summary.gradedCount > 0))

function average(summary: { average20: number | null }): string {
  return summary.average20 === null || summary.average20 === undefined
    ? '—'
    : summary.average20.toFixed(1)
}

function pending(summary: { totalWeightPending: number }): string {
  return Number(summary.totalWeightPending.toFixed(2)).toString()
}
</script>

<template>
  <div class="space-y-5">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Notas</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Promedio ponderado por curso sobre 20, con los pesos que ya registraste.
      </p>
    </header>

    <div v-if="summariesQuery.isLoading.value" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="n in 3" :key="n" class="card">
        <SkeletonBlock :lines="4" />
      </div>
    </div>

    <div v-else-if="summariesQuery.isError.value" class="card text-sm text-rose-600">
      No se pudieron cargar los promedios.
      <button class="btn-ghost mt-2" @click="summariesQuery.refetch()">Reintentar</button>
    </div>

    <EmptyState
      v-else-if="!summaries.length"
      :icon="GraduationCap"
      title="Aún no hay cursos con notas"
      description="Crea un curso y añade sus evaluaciones para ver tu promedio aquí."
    >
      <RouterLink :to="{ name: 'courses' }" class="btn-primary mt-1">Ir a cursos</RouterLink>
    </EmptyState>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <RouterLink
          v-for="summary in summaries"
          :key="summary.courseId"
          :to="{
            name: 'course-detail',
            params: { id: summary.courseId },
            query: { tab: 'grades' },
          }"
          class="card space-y-2 transition hover:border-brand-400"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="size-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: summary.courseColor }"
              />
              <p class="truncate font-medium">{{ summary.courseName }}</p>
            </div>
            <p class="shrink-0 text-2xl font-semibold tracking-tight">
              {{ average(summary) }}
              <span class="text-xs font-normal text-slate-400">/ 20</span>
            </p>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ summary.gradedCount }} calificada(s) · pendiente {{ pending(summary) }}%
          </p>

          <p
            v-if="!summary.weightsValid && summary.totalWeight > 0"
            class="text-xs font-medium text-amber-600 dark:text-amber-400"
          >
            Los pesos suman {{ Number(summary.totalWeight.toFixed(2)) }}%.
          </p>

          <p class="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
            {{ summary.message }}
          </p>
        </RouterLink>
      </div>

      <p v-if="!graded.length" class="text-sm text-slate-500 dark:text-slate-400">
        Todavía no hay evaluaciones calificadas: abre un curso y añade sus notas.
      </p>
    </template>
  </div>
</template>
