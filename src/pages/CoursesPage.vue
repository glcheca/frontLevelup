<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { BookOpen, Plus } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { invalidateCourses, keys } from '@/api/keys'
import { useToast } from '@/composables/useToast'
import type { Course } from '@/types/models'
import CourseCard from '@/components/courses/CourseCard.vue'
import CourseFormModal from '@/components/courses/CourseFormModal.vue'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

const router = useRouter()
const toast = useToast()
const queryClient = useQueryClient()

const showArchived = ref(false)
const formOpen = ref(false)
const editing = ref<Course | null>(null)
const pendingArchive = ref<Course | null>(null)
const pendingDelete = ref<Course | null>(null)

const coursesQuery = useQuery({
  queryKey: computed(() => keys.courses({ archived: showArchived.value })),
  queryFn: () => coursesApi.list({ archived: showArchived.value, size: 100 }),
})

const scheduleQuery = useQuery({
  queryKey: keys.schedule(),
  queryFn: () => coursesApi.allSchedule(),
})

/** La lista no trae el horario: se rellena con los bloques que vienen de `GET /schedule`. */
const courses = computed<Course[]>(() => {
  const blocks = scheduleQuery.data.value ?? []
  return (coursesQuery.data.value?.content ?? []).map((course) => ({
    ...course,
    schedule: blocks.filter((block) => block.courseId === course.id),
  }))
})

const archiveMutation = useMutation({
  mutationFn: (course: Course) => coursesApi.setArchived(course.id, !course.archived),
  onSuccess: async (_, course) => {
    await invalidateCourses(queryClient, course.id)
    toast.success(course.archived ? 'Curso desarchivado.' : 'Curso archivado.')
    pendingArchive.value = null
  },
  onError: (error) => toast.error(error, 'No se pudo archivar el curso.'),
})

const deleteMutation = useMutation({
  mutationFn: (course: Course) => coursesApi.remove(course.id),
  onSuccess: async () => {
    await invalidateCourses(queryClient)
    toast.success('Curso eliminado.')
    pendingDelete.value = null
  },
  onError: (error) => toast.error(error, 'No se pudo eliminar el curso.'),
})

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(course: Course) {
  editing.value = course
  formOpen.value = true
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Cursos</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ coursesQuery.data.value?.totalElements ?? 0 }} curso(s) en este periodo
        </p>
      </div>
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input v-model="showArchived" type="checkbox" class="size-4 accent-brand-600" />
          Ver archivados
        </label>
        <button class="btn-primary" @click="openCreate">
          <Plus class="size-4" />
          Nuevo curso
        </button>
      </div>
    </header>

    <div v-if="coursesQuery.isLoading.value" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="n in 3" :key="n" class="card">
        <SkeletonBlock :lines="4" />
      </div>
    </div>

    <div
      v-else-if="coursesQuery.isError.value"
      class="card border-dashed text-center text-sm text-rose-600"
    >
      No se pudieron cargar los cursos.
      <button class="btn-ghost mt-2" @click="coursesQuery.refetch()">Reintentar</button>
    </div>

    <EmptyState
      v-else-if="!courses.length"
      :icon="BookOpen"
      title="Todavía no tienes cursos"
      :description="
        showArchived
          ? 'No hay cursos archivados.'
          : 'Crea tu primer curso para empezar a organizar el semestre.'
      "
    >
      <button v-if="!showArchived" class="btn-primary mt-2" @click="openCreate">
        <Plus class="size-4" />
        Crear mi primer curso
      </button>
    </EmptyState>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <CourseCard
        v-for="course in courses"
        :key="course.id"
        :course="course"
        @open="router.push({ name: 'course-detail', params: { id: course.id } })"
        @edit="openEdit(course)"
        @archive="pendingArchive = course"
        @remove="pendingDelete = course"
      />
    </div>

    <CourseFormModal :open="formOpen" :course="editing" @close="formOpen = false" />

    <AppModal
      :open="Boolean(pendingArchive)"
      :title="pendingArchive?.archived ? 'Desarchivar curso' : 'Archivar curso'"
      @close="pendingArchive = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        {{
          pendingArchive?.archived
            ? `${pendingArchive?.name} volverá a aparecer en tu lista de cursos.`
            : `${pendingArchive?.name} se ocultará de la lista, pero conservará horario, eventos y tareas.`
        }}
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button class="btn-ghost" @click="pendingArchive = null">Cancelar</button>
        <button
          class="btn-primary"
          :disabled="archiveMutation.isPending.value"
          @click="pendingArchive && archiveMutation.mutate(pendingArchive)"
        >
          Confirmar
        </button>
      </div>
    </AppModal>

    <AppModal :open="Boolean(pendingDelete)" title="Eliminar curso" @close="pendingDelete = null">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Se borrará <span class="font-medium">{{ pendingDelete?.name }}</span> junto con su horario.
        Los eventos y tareas se conservan, pero se quedan sin curso.
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button class="btn-ghost" @click="pendingDelete = null">Cancelar</button>
        <button
          class="btn-primary bg-rose-600 hover:bg-rose-700"
          :disabled="deleteMutation.isPending.value"
          @click="pendingDelete && deleteMutation.mutate(pendingDelete)"
        >
          Eliminar curso
        </button>
      </div>
    </AppModal>
  </div>
</template>
