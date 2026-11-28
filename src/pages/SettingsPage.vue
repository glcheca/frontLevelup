<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { Monitor, Moon, Save, Sun, Trash2 } from 'lucide-vue-next'
import { z } from 'zod'
import { userApi } from '@/api/user'
import { useToast } from '@/composables/useToast'
import { useTheme, type Theme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const { theme, setTheme } = useTheme()

const TIMEZONES = [
  'America/Lima',
  'America/Bogota',
  'America/Mexico_City',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'Europe/Madrid',
  'UTC',
]

const profile = reactive({
  name: auth.user?.name ?? '',
  timezone: auth.user?.timezone ?? 'America/Lima',
})

const notify = reactive({
  events: auth.user?.notifyEvents ?? true,
  tasks: auth.user?.notifyTasks ?? true,
})

const password = reactive({ current: '', next: '', confirm: '' })
const passwordErrors = ref<Record<string, string>>({})
const deleteOpen = ref(false)

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Indica tu contraseña actual'),
    next: z.string().min(8, 'La nueva contraseña necesita al menos 8 caracteres').max(72),
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

const profileMutation = useMutation({
  mutationFn: () => auth.updateProfile({ name: profile.name.trim(), timezone: profile.timezone }),
  onSuccess: () => toast.success('Perfil actualizado.'),
  onError: (error) => toast.error(error, 'No se pudo guardar el perfil.'),
})

const notifyMutation = useMutation({
  mutationFn: () => auth.updateProfile({ notifyEvents: notify.events, notifyTasks: notify.tasks }),
  onSuccess: () => toast.success('Preferencias de recordatorios guardadas.'),
  onError: (error) => toast.error(error, 'No se pudieron guardar las preferencias.'),
})

const passwordMutation = useMutation({
  mutationFn: () =>
    userApi.changePassword({
      currentPassword: password.current,
      newPassword: password.next,
    }),
  onSuccess: () => {
    password.current = ''
    password.next = ''
    password.confirm = ''
    toast.success('Contraseña actualizada.')
  },
  onError: (error) => toast.error(error, 'No se pudo cambiar la contraseña.'),
})

const deleteMutation = useMutation({
  mutationFn: () => userApi.deleteAccount(),
  onSuccess: async () => {
    auth.clearSession()
    await router.push({ name: 'login' })
  },
  onError: (error) => toast.error(error, 'No se pudo borrar la cuenta.'),
})

function submitPassword() {
  const parsed = passwordSchema.safeParse(password)
  if (!parsed.success) {
    passwordErrors.value = Object.fromEntries(
      parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    )
    return
  }
  passwordErrors.value = {}
  passwordMutation.mutate()
}

async function chooseTheme(next: Theme) {
  setTheme(next)
  try {
    await auth.saveTheme(next)
    toast.success('Tema actualizado.')
  } catch (error) {
    toast.error(error, 'No se pudo guardar el tema en el servidor.')
  }
}

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]
</script>

<template>
  <div class="space-y-5">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Ajustes</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Tu perfil, la zona horaria con la que se muestran las fechas y tus preferencias.
      </p>
    </header>

    <section class="card space-y-4">
      <h2 class="font-medium">Perfil</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">Nombre</span>
          <input v-model="profile.name" class="input mt-1" maxlength="120" />
        </label>
        <label class="block">
          <span class="text-sm font-medium">Correo</span>
          <input :value="auth.user?.email" class="input mt-1 opacity-70" disabled />
        </label>
        <label class="block">
          <span class="text-sm font-medium">Zona horaria</span>
          <input v-model="profile.timezone" class="input mt-1" list="timezones" />
          <datalist id="timezones">
            <option v-for="zone in TIMEZONES" :key="zone" :value="zone" />
          </datalist>
        </label>
      </div>
      <div class="flex justify-end">
        <button
          class="btn-primary"
          :disabled="profileMutation.isPending.value"
          @click="profileMutation.mutate()"
        >
          <Save class="size-4" />
          Guardar perfil
        </button>
      </div>
    </section>

    <section class="card space-y-4">
      <div>
        <h2 class="font-medium">Apariencia</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Se guarda en tu cuenta y se aplica al instante.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in themes"
          :key="option.value"
          class="btn-ghost border"
          :class="
            theme === option.value
              ? 'border-brand-500 text-brand-700 dark:text-brand-300'
              : 'border-slate-200 dark:border-slate-700'
          "
          @click="chooseTheme(option.value)"
        >
          <component :is="option.icon" class="size-4" />
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="card space-y-4">
      <div>
        <h2 class="font-medium">Recordatorios</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Desactiva los avisos automáticos de eventos o tareas. Los recordatorios que crees a mano
          se mantienen.
        </p>
      </div>
      <label class="flex items-center gap-3 text-sm">
        <input
          v-model="notify.events"
          type="checkbox"
          class="size-4 accent-brand-600"
          @change="notifyMutation.mutate()"
        />
        Avisarme de los eventos (según el aviso configurado en cada uno)
      </label>
      <label class="flex items-center gap-3 text-sm">
        <input
          v-model="notify.tasks"
          type="checkbox"
          class="size-4 accent-brand-600"
          @change="notifyMutation.mutate()"
        />
        Avisarme de las tareas con fecha de entrega
      </label>
    </section>

    <section class="card space-y-4">
      <h2 class="font-medium">Contraseña</h2>
      <form class="grid gap-4 sm:grid-cols-3" @submit.prevent="submitPassword">
        <label class="block">
          <span class="text-sm font-medium">Actual</span>
          <input
            v-model="password.current"
            type="password"
            class="input mt-1"
            autocomplete="current-password"
          />
          <span v-if="passwordErrors.current" class="mt-1 block text-xs text-rose-600">
            {{ passwordErrors.current }}
          </span>
        </label>
        <label class="block">
          <span class="text-sm font-medium">Nueva</span>
          <input
            v-model="password.next"
            type="password"
            class="input mt-1"
            autocomplete="new-password"
          />
          <span v-if="passwordErrors.next" class="mt-1 block text-xs text-rose-600">
            {{ passwordErrors.next }}
          </span>
        </label>
        <label class="block">
          <span class="text-sm font-medium">Repite la nueva</span>
          <input
            v-model="password.confirm"
            type="password"
            class="input mt-1"
            autocomplete="new-password"
          />
          <span v-if="passwordErrors.confirm" class="mt-1 block text-xs text-rose-600">
            {{ passwordErrors.confirm }}
          </span>
        </label>
        <div class="sm:col-span-3 flex justify-end">
          <button type="submit" class="btn-primary" :disabled="passwordMutation.isPending.value">
            Cambiar contraseña
          </button>
        </div>
      </form>
    </section>

    <section class="card space-y-3 border-rose-200 dark:border-rose-900/60">
      <h2 class="font-medium text-rose-600">Zona de peligro</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Borrar la cuenta elimina cursos, eventos, tareas, apuntes, notas y recordatorios. No se
        puede deshacer.
      </p>
      <button class="btn-primary bg-rose-600 hover:bg-rose-700" @click="deleteOpen = true">
        <Trash2 class="size-4" />
        Borrar mi cuenta
      </button>
    </section>

    <AppModal :open="deleteOpen" title="Borrar cuenta" @close="deleteOpen = false">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        ¿Seguro que quieres borrar <strong>{{ auth.user?.email }}</strong> y todo su contenido?
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <button class="btn-ghost" @click="deleteOpen = false">Cancelar</button>
        <button
          class="btn-primary bg-rose-600 hover:bg-rose-700"
          :disabled="deleteMutation.isPending.value"
          @click="deleteMutation.mutate()"
        >
          Sí, borrar todo
        </button>
      </div>
    </AppModal>
  </div>
</template>
