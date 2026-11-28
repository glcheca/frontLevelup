<script setup lang="ts"></script>

<template>
  <div
    class="flex min-h-full flex-col items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950"
  >
    <div class="mb-8 flex items-center gap-3">
      <div
        class="grid size-11 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white"
      >
        L
      </div>
      <div>
        <p class="text-xl font-semibold tracking-tight">LevelUp</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">Tu semestre, en orden.</p>
      </div>
    </div>
    <div class="w-full max-w-md">
      <slot />
    </div>
    <p class="mt-8 text-xs text-slate-500 dark:text-slate-400">
      LevelUp · {{ new Date().getFullYear() }}
    </p>
  </div>
</template>
