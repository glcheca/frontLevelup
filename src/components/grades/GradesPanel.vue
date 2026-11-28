<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { GraduationCap, Plus } from 'lucide-vue-next'
import { gradesApi } from '@/api/grades'
import { invalidateGrades, keys } from '@/api/keys'
import { useToast } from '@/composables/useToast'
import { useNewShortcut } from '@/composables/useNewShortcut'
import type { Assessment } from '@/types/models'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import GradeFormModal from '@/components/grades/GradeFormModal.vue'
import GradeSummaryCard from '@/components/grades/GradeSummaryCard.vue'
import GradeTable from '@/components/grades/GradeTable.vue'

const props = defineProps<{ courseId: string }>()

const toast = useToast()
const queryClient = useQueryClient()

const target = ref(14)
const formOpen = ref(false)
const editing = ref<Assessment | null>(null)
const pendingDelete = ref<Assessment | null>(null)

const gradesQuery = useQuery({
  queryKey: computed(() => keys.grades(props.courseId)),
  queryFn: () => gradesApi.list(props.courseId),
})

const summaryQuery = useQuery({
  queryKey: computed(() => keys.gradeSummary(props.courseId, target.value)),
  queryFn: () => gradesApi.summary(props.courseId, target.value),
})

const grades = computed(() => gradesQuery.data.value ?? [])
const summary = computed(() => summaryQuery.data.value)

const deleteMutation = useMutation({
  mutationFn: (id: string) => gradesApi.remove(id),
  onSuccess: async () => {
    pendingDelete.value = null
    await invalidateGrades(queryClient, props.courseId)
    toast.success('Evaluación eliminada.')
  },
  onError: (error) => toast.error(error, 'No se pudo eliminar la evaluación.'),
})

function create() {
  editing.value = null
  formOpen.value = true
}

function edit(grade: Assessment) {
  editing.value = grade
  formOpen.value = true
}

useNewShortcut(create)
</script>

<template>
  <div class="space-y-4">
    <div v-if="summaryQuery.isLoading.value" class="card">
      <SkeletonBlock :lines="4" />
    </div>
    <div v-else-if="summaryQuery.isError.value" class="card text-sm text-rose-600">
      No se pudo calcular el resumen.
      <button class="btn-ghost mt-2" @click="summaryQuery.refetch()">Reintentar</button>
    </div>
    <GradeSummaryCard
      v-else-if="summary"
      :summary="summary"
      :target="target"
      @update:target="target = $event"
    />

    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-medium">
        Evaluaciones
        <span class="text-slate-500 dark:text-slate-400">({{ grades.length }})</span>
      </p>
      <button class="btn-primary" @click="create">
        <Plus class="size-4" />
        Añadir evaluación
      </button>
    </div>

    <div v-if="gradesQuery.isLoading.value" class="card">
      <SkeletonBlock :lines="4" />
    </div>
    <div v-else-if="gradesQuery.isError.value" class="card text-sm text-rose-600">
      No se pudieron cargar las evaluaciones.
      <button class="btn-ghost mt-2" @click="gradesQuery.refetch()">Reintentar</button>
    </div>
    <GradeTable
      v-else-if="grades.length"
      :grades="grades"
      @edit="edit"
      @remove="pendingDelete = $event"
    />
    <EmptyState
      v-else
      :icon="GraduationCap"
      title="Sin evaluaciones todavía"
      description="Añade parciales, prácticas o el examen final con su peso sobre la nota del curso."
    >
      <button class="btn-primary mt-1" @click="create">
        <Plus class="size-4" />
        Añadir evaluación
      </button>
    </EmptyState>

    <GradeFormModal
      :open="formOpen"
      :course-id="courseId"
      :grade="editing"
      @close="((formOpen = false), (editing = null))"
    />

    <AppModal
      :open="Boolean(pendingDelete)"
      title="Borrar evaluación"
      @close="pendingDelete = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        “{{ pendingDelete?.name }}” dejará de contar para el promedio.
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <button class="btn-ghost" @click="pendingDelete = null">Cancelar</button>
        <button
          class="btn-primary bg-rose-600 hover:bg-rose-700"
          :disabled="deleteMutation.isPending.value"
          @click="pendingDelete && deleteMutation.mutate(pendingDelete.id)"
        >
          Borrar
        </button>
      </div>
    </AppModal>
  </div>
</template>
