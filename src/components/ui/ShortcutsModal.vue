<script setup lang="ts">
import AppModal from '@/components/ui/AppModal.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const shortcuts = [
  { keys: ['Ctrl', 'K'], action: 'Abrir la búsqueda global' },
  { keys: ['N'], action: 'Crear en la vista actual (curso, evento, tarea o apunte)' },
  { keys: ['Esc'], action: 'Cerrar un diálogo, el menú o la búsqueda' },
  { keys: ['?'], action: 'Mostrar esta ayuda' },
]
</script>

<template>
  <AppModal :open="open" title="Atajos de teclado" @close="emit('close')">
    <p class="text-sm text-slate-600 dark:text-slate-300">
      Funcionan en cualquier vista y no se activan mientras escribes en un campo.
    </p>
    <ul class="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
      <li
        v-for="shortcut in shortcuts"
        :key="shortcut.action"
        class="flex items-center justify-between gap-4 py-2.5"
      >
        <span class="text-sm text-slate-700 dark:text-slate-200">{{ shortcut.action }}</span>
        <span class="flex shrink-0 gap-1">
          <kbd
            v-for="key in shortcut.keys"
            :key="key"
            class="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {{ key }}
          </kbd>
        </span>
      </li>
    </ul>
    <div class="mt-5 flex justify-end">
      <button class="btn-primary" @click="emit('close')">Entendido</button>
    </div>
  </AppModal>
</template>
