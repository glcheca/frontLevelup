<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { CalendarDays, Plus } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { eventsApi } from '@/api/events'
import { keys } from '@/api/keys'
import { useToast } from '@/composables/useToast'
import type { CalendarEvent } from '@/types/models'
import { addDays, dayKey, endOfDay, formatDayLong, formatTime, startOfDay } from '@/utils/dates'
import EventFormModal from '@/components/events/EventFormModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

const toast = useToast()
const queryClient = useQueryClient()

const rangeStart = computed(() => startOfDay(new Date()))
const rangeEnd = computed(() => endOfDay(addDays(new Date(), 60)))
const RANGE_KEY = computed(() => ['events', { agenda: dayKey(rangeStart.value) }] as const)

const formOpen = ref(false)
const editing = ref<CalendarEvent | null>(null)

const eventsQuery = useQuery({
  queryKey: RANGE_KEY,
  queryFn: () =>
    eventsApi.list({
      from: rangeStart.value.toISOString(),
      to: rangeEnd.value.toISOString(),
      size: 200,
    }),
})

const coursesQuery = useQuery({
  queryKey: keys.courses({ archived: false }),
  queryFn: () => coursesApi.list({ archived: false, size: 100 }),
})

const courses = computed(() => coursesQuery.data.value?.content ?? [])

const days = computed(() => {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of eventsQuery.data.value?.content ?? []) {
    const key = dayKey(event.startAt)
    map.set(key, [...(map.get(key) ?? []), event])
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, events]) => ({
      key,
      date: new Date(`${key}T00:00`),
      events: events.sort((a, b) => a.startAt.localeCompare(b.startAt)),
    }))
})

const deleteMutation = useMutation({
  mutationFn: (eventId: string) => eventsApi.remove(eventId),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['events'] })
    toast.success('Evento eliminado.')
  },
  onError: (error) => toast.error(error, 'No se pudo eliminar el evento.'),
})

function typeLabel(type: CalendarEvent['type']) {
  return { exam: 'Examen', assignment: 'Entrega', class: 'Clase', personal: 'Personal' }[type]
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Eventos</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Próximos 60 días · {{ eventsQuery.data.value?.totalElements ?? 0 }} evento(s)
        </p>
      </div>
      <button class="btn-primary" @click="((editing = null), (formOpen = true))">
        <Plus class="size-4" />
        Nuevo evento
      </button>
    </header>

    <div v-if="eventsQuery.isLoading.value" class="card">
      <SkeletonBlock :lines="5" />
    </div>

    <div v-else-if="eventsQuery.isError.value" class="card text-sm text-rose-600">
      No se pudieron cargar los eventos.
      <button class="btn-ghost mt-2" @click="eventsQuery.refetch()">Reintentar</button>
    </div>

    <EmptyState
      v-else-if="!days.length"
      :icon="CalendarDays"
      title="Sin eventos próximos"
      description="Crea un examen, una entrega o cualquier plan con fecha."
    >
      <button class="btn-primary mt-2" @click="((editing = null), (formOpen = true))">
        <Plus class="size-4" />
        Crear evento
      </button>
    </EmptyState>

    <section v-for="day in days" :key="day.key" class="space-y-2">
      <h2 class="text-sm font-semibold tracking-tight">{{ formatDayLong(day.date) }}</h2>
      <ul class="card divide-y divide-slate-100 dark:divide-slate-800">
        <li v-for="event in day.events" :key="event.id" class="flex items-center gap-3 py-3">
          <span
            class="size-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: event.courseColor ?? '#94a3b8' }"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">{{ event.title }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ event.allDay ? 'Todo el día' : formatTime(event.startAt) }}
              · {{ typeLabel(event.type) }}
              <template v-if="event.courseName"> · {{ event.courseName }}</template>
              <template v-if="event.location"> · {{ event.location }}</template>
            </p>
          </div>
          <div class="flex gap-1">
            <button class="btn-ghost" @click="((editing = event), (formOpen = true))">
              Editar
            </button>
            <button
              class="btn-ghost text-rose-600"
              aria-label="Borrar evento"
              @click="deleteMutation.mutate(event.id)"
            >
              Borrar
            </button>
          </div>
        </li>
      </ul>
    </section>

    <EventFormModal
      :open="formOpen"
      :event="editing"
      :courses="courses"
      @close="((formOpen = false), (editing = null))"
    />
  </div>
</template>
