<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { z } from 'zod'
import { errorMessage } from '@/api/client'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const errors = reactive<{ name?: string; email?: string; password?: string; confirm?: string }>({})
const submitError = ref<string | null>(null)

const schema = z
  .object({
    name: z.string().min(2, 'Escribe tu nombre'),
    email: z.string().min(1, 'El correo es obligatorio').email('Ingresa un correo válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  })

async function onSubmit() {
  Object.assign(errors, {
    name: undefined,
    email: undefined,
    password: undefined,
    confirm: undefined,
  })
  submitError.value = null

  const result = schema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[issue.path[0] as keyof typeof errors] = issue.message
    }
    return
  }

  try {
    await auth.register({
      name: result.data.name,
      email: result.data.email,
      password: result.data.password,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    await router.push({ name: 'dashboard' })
  } catch (error) {
    submitError.value = errorMessage(error)
  }
}
</script>

<template>
  <AuthLayout>
    <form class="card space-y-5" @submit.prevent="onSubmit">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Crea tu cuenta</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Empieza a organizar tu semestre.
        </p>
      </div>

      <div class="space-y-1.5">
        <label for="name" class="text-sm font-medium">Nombre</label>
        <input
          id="name"
          v-model="form.name"
          class="input"
          autocomplete="name"
          placeholder="Tu nombre"
        />
        <p v-if="errors.name" class="text-xs text-red-600 dark:text-red-400">{{ errors.name }}</p>
      </div>

      <div class="space-y-1.5">
        <label for="email" class="text-sm font-medium">Correo</label>
        <input
          id="email"
          v-model="form.email"
          class="input"
          type="email"
          autocomplete="email"
          placeholder="tu@correo.com"
        />
        <p v-if="errors.email" class="text-xs text-red-600 dark:text-red-400">{{ errors.email }}</p>
      </div>

      <div class="space-y-1.5">
        <label for="password" class="text-sm font-medium">Contraseña</label>
        <input
          id="password"
          v-model="form.password"
          class="input"
          type="password"
          autocomplete="new-password"
          placeholder="Mínimo 8 caracteres"
        />
        <p v-if="errors.password" class="text-xs text-red-600 dark:text-red-400">
          {{ errors.password }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label for="confirm" class="text-sm font-medium">Repite la contraseña</label>
        <input
          id="confirm"
          v-model="form.confirm"
          class="input"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
        />
        <p v-if="errors.confirm" class="text-xs text-red-600 dark:text-red-400">
          {{ errors.confirm }}
        </p>
      </div>

      <p
        v-if="submitError"
        class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
      >
        {{ submitError }}
      </p>

      <button class="btn-primary w-full" type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Creando…' : 'Crear cuenta' }}
      </button>

      <p class="text-center text-sm text-slate-500 dark:text-slate-400">
        ¿Ya tienes cuenta?
        <RouterLink :to="{ name: 'login' }" class="font-medium text-brand-600 hover:underline"
          >Inicia sesión</RouterLink
        >
      </p>
    </form>
  </AuthLayout>
</template>
