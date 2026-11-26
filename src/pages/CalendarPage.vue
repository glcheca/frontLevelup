<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { eventsApi } from '@/api/events'
import { keys } from '@/api/keys'
import type { CalendarEvent, ClassBlock } from '@/types/models'
import {
  addDays,
  addMonths,
  dayKey,
  endOfDay,
  endOfMonth,
  endOfWeek,
  formatDayShort,
  isSameDay,
  isoWeekday,
  monthGrid,
  shortTime,
  startOfMonth,
  startOfWeek,
} from '@/utils/dates'
import EventFormModal from '@/components/events/EventFormModal.vue'

type View = 'week' | 'month'

const view = ref<View>('week')
const cursor = ref(new Date())

const formOpen = ref(false)
const editing = ref<CalendarEvent | null>(null)
const defaultDate = ref<Date | null>(null)

const gridStart = computed(() =>
  view.value === 'week' ? startOfWeek(cursor.value) : startOfWeek(startOfMonth(cursor.value)),
)
const gridEnd = computed(() =>
  view.value === 'week' ? endOfWeek(cursor.value) : endOfWeek(endOfMonth(cursor.value)),
)

const eventsQuery = useQuery({
  queryKey: computed(() => keys.events({ calendar: dayKey(gridStart.value) })),
  queryFn: () =>
    eventsApi.list({
      from: gridStart.value.toISOString(),
      to: endOfDay(gridEnd.value).toISOString(),
      size: 300,
    }),
})

const scheduleQuery = useQuery({
  queryKey: keys.schedule(),
  queryFn: () => coursesApi.allSchedule(),
})

const coursesQuery = useQuery({
  queryKey: keys.courses({ archived: false }),
  queryFn: () => coursesApi.list({ archived: false, size: 100 }),
})

const courses = computed(() => coursesQuery.data.value?.content ?? [])

function blocksFor(date: Date): ClassBlock[] {
  const weekday = isoWeekday(date)
  return (scheduleQuery.data.value ?? []).filter((block) => block.dayOfWeek === weekday)
}

function eventsFor(date: Date): CalendarEvent[] {
  const key = dayKey(date)
  return (eventsQuery.data.value?.content ?? [])
    .filter((event) => dayKey(event.startAt) === key)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}

const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor.value), index)),
)

const weeks = computed(() => monthGrid(cursor.value))

const title = computed(() => {
  if (view.value === 'month') {
    const label = cursor.value.toLocaleDateString('es', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }
  const start = startOfWeek(cursor.value)
  const end = endOfWeek(cursor.value)
  return `${formatDayShort(start)} – ${formatDayShort(end)}`
})

function shift(direction: number) {
  cursor.value =
    view.value === 'week'
      ? addDays(cursor.value, direction * 7)
      : addMonths(cursor.value, direction)
}

function openCreate(date: Date) {
  editing.value = null
  defaultDate.value = date
  formOpen.value = true
}

function openEdit(event: CalendarEvent) {
  editing.value = event
  defaultDate.value = null
  formOpen.value = true
}

function typeColor(event: CalendarEvent) {
  if (event.courseColor) return event.courseColor
  return { exam: '#ef4444', assignment: '#f97316', class: '#0ea5e9', personal: '#64748b' }[
    event.type
  ]
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Calendario</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ title }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            class="px-3 py-1.5 text-sm"
            :class="
              view === 'week' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300'
            "
            @click="view = 'week'"
          >
            Semana
          </button>
          <button
            class="px-3 py-1.5 text-sm"
            :class="
              view === 'month' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300'
            "
            @click="view = 'month'"
          >
            Mes
          </button>
        </div>
        <button class="btn-ghost" aria-label="Anterior" @click="shift(-1)">
          <ChevronLeft class="size-4" />
        </button>
        <button class="btn-ghost" @click="cursor = new Date()">Hoy</button>
        <button class="btn-ghost" aria-label="Siguiente" @click="shift(1)">
          <ChevronRight class="size-4" />
        </button>
        <button class="btn-primary" @click="openCreate(new Date())">
          <Plus class="size-4" />
          Evento
        </button>
      </div>
    </header>

    <!-- Vista semanal -->
    <div v-if="view === 'week'" class="grid gap-3 overflow-x-auto md:grid-cols-7">
      <section
        v-for="day in weekDays"
        :key="day.toISOString()"
        class="card min-w-40 space-y-2"
        :class="isSameDay(day, new Date()) ? 'ring-2 ring-brand-500/40' : ''"
      >
        <button
          class="w-full text-left text-sm font-medium hover:underline"
          @click="openCreate(day)"
        >
          {{ formatDayShort(day) }}
        </button>

        <ul class="space-y-1">
          <li
            v-for="block in blocksFor(day)"
            :key="block.id"
            class="truncate rounded-md px-2 py-1 text-xs"
            :style="{ backgroundColor: `${block.courseColor}22`, color: block.courseColor }"
            :title="`${block.courseName} · ${shortTime(block.startTime)}–${shortTime(block.endTime)}`"
          >
            {{ shortTime(block.startTime) }} {{ block.courseName }}
          </li>
          <li v-for="event in eventsFor(day)" :key="event.id">
            <button
              class="w-full truncate rounded-md px-2 py-1 text-left text-xs text-white"
              :style="{ backgroundColor: typeColor(event) }"
              @click="openEdit(event)"
            >
              {{ event.allDay ? '' : `${shortTime(event.startAt)} ` }}{{ event.title }}
            </button>
          </li>
        </ul>

        <button
          class="w-full rounded-md border border-dashed border-slate-200 py-1 text-xs text-slate-400 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700"
          @click="openCreate(day)"
        >
          +
        </button>
      </section>
    </div>

    <!-- Vista mensual -->
    <div v-else class="card overflow-x-auto p-3">
      <div class="min-w-[42rem]">
        <div
          class="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          <span v-for="label in ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']" :key="label">
            {{ label }}
          </span>
        </div>
        <div class="mt-2 space-y-2">
          <div v-for="(week, index) in weeks" :key="index" class="grid grid-cols-7 gap-2">
            <div
              v-for="day in week"
              :key="day.toISOString()"
              class="min-h-24 rounded-lg border p-2 text-left transition"
              :class="[
                day.getMonth() === cursor.getMonth()
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-transparent bg-slate-50/60 dark:bg-slate-900/40',
                isSameDay(day, new Date()) ? 'ring-2 ring-brand-500/40' : '',
              ]"
            >
              <button class="text-xs font-medium hover:underline" @click="openCreate(day)">
                {{ day.getDate() }}
              </button>
              <ul class="mt-1 space-y-1">
                <li
                  v-for="block in blocksFor(day).slice(0, 2)"
                  :key="block.id"
                  class="truncate rounded px-1.5 py-0.5 text-[11px]"
                  :style="{ backgroundColor: `${block.courseColor}22`, color: block.courseColor }"
                >
                  {{ block.courseName }}
                </li>
                <li v-for="event in eventsFor(day).slice(0, 2)" :key="event.id">
                  <button
                    class="w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] text-white"
                    :style="{ backgroundColor: typeColor(event) }"
                    @click="openEdit(event)"
                  >
                    {{ event.title }}
                  </button>
                </li>
                <li
                  v-if="blocksFor(day).length + eventsFor(day).length > 4"
                  class="text-[11px] text-slate-400"
                >
                  +{{ blocksFor(day).length + eventsFor(day).length - 4 }} más
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="!scheduleQuery.data.value?.length"
      class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
    >
      <CalendarDays class="size-4" />
      Añade horario a tus cursos y aparecerá aquí como clases recurrentes.
    </p>

    <EventFormModal
      :open="formOpen"
      :event="editing"
      :courses="courses"
      :default-date="defaultDate"
      @close="((formOpen = false), (editing = null))"
    />
  </div>
</template>
