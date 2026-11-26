<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, CalendarDays, CheckSquare, GraduationCap } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const today = computed(() => {
  const formatted = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const cards = [
  { name: 'Cursos', description: 'Organiza tus materias del semestre.', icon: BookOpen },
  { name: 'Calendario', description: 'Clases, exámenes y entregas.', icon: CalendarDays },
  { name: 'Tareas', description: 'Lo que tienes pendiente, sin olvidos.', icon: CheckSquare },
  { name: 'Notas', description: 'Promedio y qué necesitas para aprobar.', icon: GraduationCap },
]
</script>

<template>
  <div class="space-y-6">
    <section>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ today }}</p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight">Hola, {{ auth.user?.name }}</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Este es tu punto de partida. Los módulos se irán activando por etapas.
      </p>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in cards" :key="card.name" class="card">
        <div
          class="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"
        >
          <component :is="card.icon" class="size-5" />
        </div>
        <h2 class="mt-4 font-medium">{{ card.name }}</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ card.description }}</p>
        <span
          class="mt-3 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        >
          Próximamente
        </span>
      </article>
    </section>

    <section class="card border-dashed">
      <h2 class="font-medium">Etapa 0 completada</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Autenticación, layout y base de datos listos. La siguiente etapa añade cursos, horario,
        eventos y tareas.
      </p>
    </section>
  </div>
</template>
