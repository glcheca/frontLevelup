<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import { errorMessage } from '@/api/client'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string }>({})
const submitError = ref<string | null>(null)

const schema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresa un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

async function onSubmit() {
  Object.assign(errors, { email: undefined, password: undefined })
  submitError.value = null

  const result = schema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[issue.path[0] as 'email' | 'password'] = issue.message
    }
    return
  }

  try {
    await auth.login(result.data)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (error) {
    submitError.value = errorMessage(error)
  }
}
</script>

<template>
  <AuthLayout>
    <form class="card space-y-5" @submit.prevent="onSubmit">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Inicia sesión</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Entra para ver tu día.</p>
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
          autocomplete="current-password"
          placeholder="••••••••"
        />
        <p v-if="errors.password" class="text-xs text-red-600 dark:text-red-400">
          {{ errors.password }}
        </p>
      </div>

      <p
        v-if="submitError"
        class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
      >
        {{ submitError }}
      </p>

      <button class="btn-primary w-full" type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Entrando…' : 'Entrar' }}
      </button>

      <p class="text-center text-sm text-slate-500 dark:text-slate-400">
        ¿No tienes cuenta?
        <RouterLink :to="{ name: 'register' }" class="font-medium text-brand-600 hover:underline"
          >Crear una</RouterLink
        >
      </p>
    </form>
  </AuthLayout>
</template>
