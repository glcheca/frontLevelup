<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="grid min-h-full place-items-center px-4">
    <div class="text-center">
      <p class="text-sm font-medium text-brand-600">404</p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight">Esta página no existe</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Puede que el enlace esté mal o que hayas borrado algo.
      </p>
      <RouterLink :to="{ name: 'dashboard' }" class="btn-primary mt-6">Volver al inicio</RouterLink>
    </div>
  </div>
</template>
